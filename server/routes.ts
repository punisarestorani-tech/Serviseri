import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertClientSchema,
  insertApplianceSchema,
  insertTaskSchema,
  insertReportSchema,
  insertDocumentSchema,
  insertSparePartSchema,
  insertOrganizationSchema,
  insertProfileSchema
} from "@shared/schema";
import { generateRecurringTasks, generateUpcomingRecurringInstances, calculateNextOccurrenceDate } from "./recurringTasksService";
import { generateReportPdf } from "./pdfGenerator";
import multer from "multer";
import OpenAI from "openai";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import crypto from "crypto";

// Password hashing functions
function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    if (!salt || !key) {
      // Legacy: plain text password comparison
      resolve(password === hash);
      return;
    }
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex') === key);
    });
  });
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for memory storage (for audio files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit (Whisper API limit)
});

// Helper function to convert audio to MP3 using FFmpeg
async function convertToMp3(inputBuffer: Buffer, inputFormat: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const inputStream = Readable.from(inputBuffer);

    const command = ffmpeg(inputStream)
      .inputFormat(inputFormat)
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .audioChannels(1)
      .audioFrequency(16000)
      .format('mp3')
      .on('error', (err) => {
        console.error('FFmpeg conversion error:', err);
        reject(err);
      })
      .on('end', () => {
        console.log('FFmpeg conversion completed successfully');
        resolve(Buffer.concat(chunks));
      });

    const stream = command.pipe();
    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    stream.on('error', (err) => {
      console.error('FFmpeg stream error:', err);
      reject(err);
    });
  });
}

// Middleware to check authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

// Middleware to check organization context (skips for super_admin)
function requireOrg(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  // Super admin can work without org context (they switch orgs)
  if (req.session.userRole === 'super_admin' && !req.session.organizationId) {
    return res.status(400).json({ message: "Please select an organization" });
  }
  if (!req.session.organizationId && req.session.userRole !== 'super_admin') {
    return res.status(403).json({ message: "No organization context" });
  }
  next();
}

// Middleware to check if user is org_admin or super_admin
function requireOrgAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.session.userRole !== 'org_admin' && req.session.userRole !== 'super_admin') {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  next();
}

// Middleware to check if user is super_admin
function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.session.userRole !== 'super_admin') {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ==================== AUTHENTICATION ====================

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password using scrypt
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.userRole || 'technician';
      req.session.organizationId = user.organizationId || undefined;

      // Get organization name if user belongs to one
      let organizationName = null;
      if (user.organizationId) {
        const org = await storage.getOrganization(user.organizationId);
        organizationName = org?.name;
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          userRole: user.userRole,
          organizationId: user.organizationId,
          organizationName
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let organizationName = null;
    const orgId = req.session.organizationId || user.organizationId;
    if (orgId) {
      const org = await storage.getOrganization(orgId);
      organizationName = org?.name;
    }

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      userRole: user.userRole,
      organizationId: req.session.organizationId || user.organizationId,
      organizationName
    });
  });

  // ==================== ORGANIZATIONS (Super Admin) ====================

  // Get all organizations (super_admin only)
  app.get("/api/organizations", requireSuperAdmin, async (req, res) => {
    const organizations = await storage.getAllOrganizations();
    res.json(organizations);
  });

  // Get single organization
  app.get("/api/organizations/:id", requireAuth, async (req, res) => {
    // Users can only view their own org, super_admin can view any
    if (req.session.userRole !== 'super_admin' && req.session.organizationId !== req.params.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const org = await storage.getOrganization(req.params.id);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    res.json(org);
  });

  // Create organization (super_admin only)
  app.post("/api/organizations", requireSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertOrganizationSchema.parse(req.body);
      const org = await storage.createOrganization(validatedData);
      res.status(201).json(org);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update organization (super_admin only)
  app.patch("/api/organizations/:id", requireSuperAdmin, async (req, res) => {
    const org = await storage.updateOrganization(req.params.id, req.body);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    res.json(org);
  });

  // Delete organization (super_admin only)
  app.delete("/api/organizations/:id", requireSuperAdmin, async (req, res) => {
    await storage.deleteOrganization(req.params.id);
    res.status(204).send();
  });

  // Switch organization (super_admin only)
  app.post("/api/organizations/:id/switch", requireSuperAdmin, async (req, res) => {
    const org = await storage.getOrganization(req.params.id);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    req.session.organizationId = org.id;
    res.json({ message: "Switched to organization", organization: org });
  });

  // ==================== USERS/PROFILES ====================

  // Get users (org_admin sees their org users, super_admin sees all or filtered)
  app.get("/api/users", requireOrgAdmin, async (req, res) => {
    if (req.session.userRole === 'super_admin') {
      // Super admin can filter by org or get all
      const orgId = req.query.organizationId as string || req.session.organizationId;
      const users = await storage.getAllUsers(orgId);
      res.json(users);
    } else {
      // Org admin sees only their org users
      const users = await storage.getAllUsers(req.session.organizationId);
      res.json(users);
    }
  });

  // Get single user
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check access
    if (req.session.userRole !== 'super_admin') {
      if (user.organizationId !== req.session.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json(user);
  });

  // Create user (org_admin creates for their org, super_admin can specify org)
  app.post("/api/users", requireOrgAdmin, async (req, res) => {
    try {
      const { username, password, fullName, email, userRole } = req.body;

      // Validate role - org_admin cannot create super_admin
      if (userRole === 'super_admin' && req.session.userRole !== 'super_admin') {
        return res.status(403).json({ message: "Cannot create super_admin users" });
      }

      // Determine organization
      let organizationId = req.body.organizationId;
      if (req.session.userRole !== 'super_admin') {
        // Org admin can only create users in their org
        organizationId = req.session.organizationId;
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        passwordHash: hashedPassword,
        fullName,
        email,
        userRole: userRole || 'technician',
        organizationId
      });

      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update user
  app.patch("/api/users/:id", requireOrgAdmin, async (req, res) => {
    const existingUser = await storage.getUser(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check access
    if (req.session.userRole !== 'super_admin') {
      if (existingUser.organizationId !== req.session.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      // Org admin cannot change user's organization
      if (req.body.organizationId && req.body.organizationId !== req.session.organizationId) {
        return res.status(403).json({ message: "Cannot change user's organization" });
      }
      // Org admin cannot promote to super_admin
      if (req.body.userRole === 'super_admin') {
        return res.status(403).json({ message: "Cannot promote to super_admin" });
      }
    }

    const updateData: any = { ...req.body };
    if (updateData.password) {
      updateData.passwordHash = await hashPassword(updateData.password);
      delete updateData.password;
    }

    const user = await storage.updateUser(req.params.id, updateData);
    res.json(user);
  });

  // Delete user
  app.delete("/api/users/:id", requireOrgAdmin, async (req, res) => {
    const existingUser = await storage.getUser(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check access
    if (req.session.userRole !== 'super_admin') {
      if (existingUser.organizationId !== req.session.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Prevent self-deletion
    if (existingUser.id === req.session.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    await storage.deleteUser(req.params.id);
    res.status(204).send();
  });

  // ==================== CLIENTS ====================

  app.get("/api/clients", requireOrg, async (req, res) => {
    const clients = await storage.getAllClients(req.session.organizationId!);
    res.json(clients);
  });

  app.get("/api/clients/:id", requireOrg, async (req, res) => {
    const client = await storage.getClient(req.params.id, req.session.organizationId!);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  });

  app.post("/api/clients", requireOrg, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse({
        ...req.body,
        organizationId: req.session.organizationId
      });
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/clients/:id", requireOrg, async (req, res) => {
    const client = await storage.updateClient(req.params.id, req.body, req.session.organizationId!);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  });

  app.delete("/api/clients/:id", requireOrg, async (req, res) => {
    await storage.deleteClient(req.params.id, req.session.organizationId!);
    res.status(204).send();
  });

  // ==================== APPLIANCES ====================

  app.get("/api/appliances", requireOrg, async (req, res) => {
    const { clientId } = req.query;
    if (clientId) {
      const appliances = await storage.getAppliancesByClient(clientId as string, req.session.organizationId!);
      return res.json(appliances);
    }
    const appliances = await storage.getAllAppliances(req.session.organizationId!);
    res.json(appliances);
  });

  app.get("/api/appliances/:id", requireOrg, async (req, res) => {
    const appliance = await storage.getAppliance(req.params.id, req.session.organizationId!);
    if (!appliance) {
      return res.status(404).json({ message: "Appliance not found" });
    }
    res.json(appliance);
  });

  app.post("/api/appliances", requireOrg, async (req, res) => {
    try {
      const validatedData = insertApplianceSchema.parse(req.body);
      const appliance = await storage.createAppliance(validatedData, req.session.organizationId!);
      res.status(201).json(appliance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/appliances/:id", requireOrg, async (req, res) => {
    const appliance = await storage.updateAppliance(req.params.id, req.body, req.session.organizationId!);
    if (!appliance) {
      return res.status(404).json({ message: "Appliance not found" });
    }
    res.json(appliance);
  });

  app.delete("/api/appliances/:id", requireOrg, async (req, res) => {
    await storage.deleteAppliance(req.params.id, req.session.organizationId!);
    res.status(204).send();
  });

  // ==================== TASKS ====================

  app.get("/api/tasks", requireOrg, async (req, res) => {
    const { status, clientId, userId } = req.query;
    if (status) {
      const tasks = await storage.getTasksByStatus(status as string, req.session.organizationId!);
      return res.json(tasks);
    }
    if (clientId) {
      const tasks = await storage.getTasksByClient(clientId as string, req.session.organizationId!);
      return res.json(tasks);
    }
    if (userId) {
      const tasks = await storage.getTasksByUser(userId as string, req.session.organizationId!);
      return res.json(tasks);
    }
    const tasks = await storage.getAllTasks(req.session.organizationId!);
    res.json(tasks);
  });

  app.get("/api/tasks/:id", requireOrg, async (req, res) => {
    const task = await storage.getTask(req.params.id, req.session.organizationId!);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  });

  app.post("/api/tasks", requireOrg, async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);

      if (validatedData.taskType === "recurring" && validatedData.dueDate && validatedData.recurrencePattern && validatedData.recurrencePattern !== "none") {
        validatedData.nextOccurrenceDate = calculateNextOccurrenceDate(
          validatedData.dueDate as string,
          validatedData.recurrencePattern as string,
          validatedData.recurrenceInterval || 1
        );
      }

      const task = await storage.createTask(validatedData);

      if (task.taskType === "recurring" && task.recurrencePattern && task.recurrencePattern !== "none") {
        await generateUpcomingRecurringInstances(90);
      }

      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/tasks/:id", requireOrg, async (req, res) => {
    try {
      // Verify task belongs to org
      const existingTask = await storage.getTask(req.params.id, req.session.organizationId!);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const updateData = { ...req.body };
      if (updateData.completedAt && typeof updateData.completedAt === 'string') {
        updateData.completedAt = new Date(updateData.completedAt);
      }

      const task = await storage.updateTask(req.params.id, updateData);
      res.json(task);
    } catch (error: any) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: error.message || "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", requireOrg, async (req, res) => {
    const task = await storage.getTask(req.params.id, req.session.organizationId!);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status === "completed") {
      return res.status(409).json({
        message: "Cannot delete completed task. Completed tasks are preserved as history."
      });
    }

    await storage.deleteTaskCascade(req.params.id);
    res.status(204).send();
  });

  app.delete("/api/tasks/:id/recurring", requireOrg, async (req, res) => {
    const task = await storage.getTask(req.params.id, req.session.organizationId!);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await storage.deleteTaskCascade(req.params.id);
    res.status(204).send();
  });

  app.get("/api/tasks/recurring/due", requireOrg, async (req, res) => {
    const tasks = await storage.getRecurringTasksDue(req.session.organizationId!);
    res.json(tasks);
  });

  app.post("/api/tasks/recurring/generate-upcoming", requireOrg, async (req, res) => {
    try {
      const daysAhead = req.body?.daysAhead || 90;
      const result = await generateUpcomingRecurringInstances(daysAhead);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tasks/recurring/generate", requireOrg, async (req, res) => {
    try {
      const result = await generateRecurringTasks();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== REPORTS ====================

  app.get("/api/reports", requireOrg, async (req, res) => {
    const reports = await storage.getAllReports(req.session.organizationId!);
    res.json(reports);
  });

  app.get("/api/reports/with-details", requireOrg, async (req, res) => {
    const reports = await storage.getAllReports(req.session.organizationId!);
    const tasks = await storage.getAllTasks(req.session.organizationId!);
    const clients = await storage.getAllClients(req.session.organizationId!);
    const appliances = await storage.getAllAppliances(req.session.organizationId!);

    const reportsWithDetails = reports.map(report => {
      const task = tasks.find(t => t.id === report.taskId);
      const client = task ? clients.find(c => c.id === task.clientId) : null;
      const appliance = task?.applianceId ? appliances.find(a => a.id === task.applianceId) : null;

      const applianceName = appliance
        ? [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(' - ')
        : 'Unknown appliance';

      return {
        ...report,
        clientName: client?.name || 'Unknown client',
        applianceName,
        taskDescription: task?.description || 'N/A',
      };
    });

    res.json(reportsWithDetails);
  });

  app.get("/api/reports/:id", requireOrg, async (req, res) => {
    const report = await storage.getReport(req.params.id, req.session.organizationId!);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json(report);
  });

  app.get("/api/reports/:id/pdf", requireOrg, async (req, res) => {
    try {
      // Verify report belongs to org
      const report = await storage.getReport(req.params.id, req.session.organizationId!);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const pdfBuffer = await generateReportPdf(req.params.id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="izvjestaj-${req.params.id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('PDF generation error:', error);
      if (error.message === 'Report not found') {
        return res.status(404).json({ message: "Report not found" });
      }
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.get("/api/tasks/:taskId/reports", requireOrg, async (req, res) => {
    // Verify task belongs to org
    const task = await storage.getTask(req.params.taskId, req.session.organizationId!);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const reports = await storage.getReportsByTask(req.params.taskId);
    res.json(reports);
  });

  app.post("/api/reports", requireOrg, async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);

      // Verify task belongs to org
      const task = await storage.getTask(validatedData.taskId, req.session.organizationId!);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const report = await storage.createReport(validatedData);

      if (validatedData.taskId) {
        const completedTask = await storage.getTask(validatedData.taskId);

        await storage.updateTask(validatedData.taskId, { status: "completed" });

        if (completedTask &&
          completedTask.taskType === "recurring" &&
          completedTask.nextOccurrenceDate &&
          completedTask.recurrencePattern &&
          completedTask.recurrencePattern !== "none") {

          const parentId = completedTask.parentTaskId || completedTask.id;
          const nextOccurrenceDate = completedTask.nextOccurrenceDate;

          const futureOccurrence = calculateNextOccurrenceDate(
            nextOccurrenceDate,
            completedTask.recurrencePattern,
            completedTask.recurrenceInterval || 1
          );

          const nextTaskData = {
            clientId: completedTask.clientId,
            applianceId: completedTask.applianceId,
            userId: completedTask.userId,
            description: completedTask.description,
            status: "pending" as const,
            priority: completedTask.priority,
            dueDate: nextOccurrenceDate,
            taskType: "recurring" as const,
            recurrencePattern: completedTask.recurrencePattern,
            recurrenceInterval: completedTask.recurrenceInterval,
            parentTaskId: parentId,
            isAutoGenerated: 1,
            nextOccurrenceDate: futureOccurrence,
          };

          await storage.createTask(nextTaskData);
        }
      }

      res.status(201).json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/reports/:id", requireOrg, async (req, res) => {
    try {
      // Verify report belongs to org
      const existingReport = await storage.getReport(req.params.id, req.session.organizationId!);
      if (!existingReport) {
        return res.status(404).json({ message: "Report not found" });
      }

      const report = await storage.updateReport(req.params.id, req.body);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== DOCUMENTS ====================

  app.get("/api/documents", requireOrg, async (req, res) => {
    const documents = await storage.getAllDocuments(req.session.organizationId!);
    res.json(documents);
  });

  app.get("/api/documents/:id", requireOrg, async (req, res) => {
    const document = await storage.getDocument(req.params.id, req.session.organizationId!);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(document);
  });

  app.post("/api/documents", requireOrg, async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        organizationId: req.session.organizationId
      });
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/documents/:id", requireOrg, async (req, res) => {
    await storage.deleteDocument(req.params.id, req.session.organizationId!);
    res.status(204).send();
  });

  // ==================== SPARE PARTS ====================

  app.get("/api/spare-parts", requireOrg, async (req, res) => {
    const spareParts = await storage.getAllSpareParts(req.session.organizationId!);
    res.json(spareParts);
  });

  app.get("/api/spare-parts/:id", requireOrg, async (req, res) => {
    const sparePart = await storage.getSparePart(req.params.id, req.session.organizationId!);
    if (!sparePart) {
      return res.status(404).json({ message: "Spare part not found" });
    }
    res.json(sparePart);
  });

  app.post("/api/spare-parts", requireOrg, async (req, res) => {
    try {
      const validatedData = insertSparePartSchema.parse({
        ...req.body,
        organizationId: req.session.organizationId
      });
      const sparePart = await storage.createSparePart(validatedData);
      res.status(201).json(sparePart);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/spare-parts/:id", requireOrg, async (req, res) => {
    const sparePart = await storage.updateSparePart(req.params.id, req.body, req.session.organizationId!);
    if (!sparePart) {
      return res.status(404).json({ message: "Spare part not found" });
    }
    res.json(sparePart);
  });

  app.delete("/api/spare-parts/:id", requireOrg, async (req, res) => {
    await storage.deleteSparePart(req.params.id, req.session.organizationId!);
    res.status(204).send();
  });

  // ==================== VOICE TRANSCRIPTION ====================

  app.post("/api/transcribe-voice", requireOrg, upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "applianceContext", maxCount: 1 },
    { name: "clientContext", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files || !files.audio || files.audio.length === 0) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const audioFile = files.audio[0];

      let applianceContext = null;
      let clientContext = null;

      try {
        if (req.body.applianceContext) {
          applianceContext = JSON.parse(req.body.applianceContext);
        }
        if (req.body.clientContext) {
          clientContext = JSON.parse(req.body.clientContext);
        }
      } catch (parseError) {
        return res.status(400).json({ message: "Invalid context format" });
      }

      let contextDescription = "";
      if (clientContext) {
        contextDescription += `Klijent: ${clientContext.name}. `;
      }
      if (applianceContext) {
        contextDescription += `Uređaj: ${applianceContext.maker} ${applianceContext.type}`;
        if (applianceContext.model) {
          contextDescription += ` ${applianceContext.model}`;
        }
        if (applianceContext.serialNumber) {
          contextDescription += ` (Serijski broj: ${applianceContext.serialNumber})`;
        }
        contextDescription += ". ";
      }

      let audioBuffer = audioFile.buffer;
      let audioFilename = "audio.mp3";
      let audioMimetype = "audio/mp3";

      if (audioFile.mimetype === "audio/webm" || audioFile.mimetype.includes("webm")) {
        try {
          audioBuffer = await convertToMp3(audioFile.buffer, "webm");
        } catch (conversionError) {
          return res.status(500).json({ message: "Failed to convert audio format" });
        }
      }

      const transcription = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], audioFilename, { type: audioMimetype }),
        model: "whisper-1",
        language: "sr",
        prompt: contextDescription + "Tehničar opisuje popravku uređaja, delove koji su korišćeni, i vreme rada.",
      });

      const transcript = transcription.text;

      const systemPrompt = `Ti si asistent koji pretvara glasovne poruke tehničara u strukturirane izvještaje o popravkama.

${contextDescription ? `KONTEKST SERVISA:\n${contextDescription}\n` : ""}
Iz transkripta glasovne poruke, ekstraktuj:
1. **Opis rada**: Detaljan opis šta je urađeno na popravci.
2. **Trajanje rada**: Koliko minuta je trajao posao (procijeni ako nije navedeno)
3. **Korišćeni dijelovi**: Lista rezervnih dijelova koji su korišćeni (ako ih ima)

Odgovori SAMO u JSON formatu:
{
  "description": "Detaljan opis rada...",
  "workDuration": 60,
  "sparePartsUsed": "Lista korišćenih dijelova (ili null)"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Glasovna poruka tehničara: "${transcript}"` },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const reportData = JSON.parse(completion.choices[0].message.content || "{}");

      res.json({ transcript, reportData });
    } catch (error: any) {
      console.error("Voice transcription error:", error);
      res.status(500).json({ message: error.message || "Failed to process voice message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
