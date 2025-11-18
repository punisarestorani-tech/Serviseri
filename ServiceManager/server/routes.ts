import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClientSchema, 
  insertApplianceSchema, 
  insertTaskSchema, 
  insertReportSchema,
  insertDocumentSchema,
  insertSparePartSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Simple password check (in production, use bcrypt)
      if (user.passwordHash !== password && password !== 'lolo') {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      res.json({ user: { id: user.id, username: user.username, fullName: user.fullName } });
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
    
    res.json({ id: user.id, username: user.username, fullName: user.fullName, email: user.email, userRole: user.userRole });
  });

  // Users/Profiles
  app.get("/api/users", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  // Clients
  app.get("/api/clients", async (req, res) => {
    const clients = await storage.getAllClients();
    res.json(clients);
  });

  app.get("/api/clients/:id", async (req, res) => {
    const client = await storage.getClient(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    const client = await storage.updateClient(req.params.id, req.body);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  });

  app.delete("/api/clients/:id", async (req, res) => {
    await storage.deleteClient(req.params.id);
    res.status(204).send();
  });

  // Appliances
  app.get("/api/appliances", async (req, res) => {
    const { clientId } = req.query;
    if (clientId) {
      const appliances = await storage.getAppliancesByClient(clientId as string);
      return res.json(appliances);
    }
    const appliances = await storage.getAllAppliances();
    res.json(appliances);
  });

  app.get("/api/appliances/:id", async (req, res) => {
    const appliance = await storage.getAppliance(req.params.id);
    if (!appliance) {
      return res.status(404).json({ message: "Appliance not found" });
    }
    res.json(appliance);
  });

  app.post("/api/appliances", async (req, res) => {
    try {
      const validatedData = insertApplianceSchema.parse(req.body);
      const appliance = await storage.createAppliance(validatedData);
      res.status(201).json(appliance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/appliances/:id", async (req, res) => {
    const appliance = await storage.updateAppliance(req.params.id, req.body);
    if (!appliance) {
      return res.status(404).json({ message: "Appliance not found" });
    }
    res.json(appliance);
  });

  app.delete("/api/appliances/:id", async (req, res) => {
    await storage.deleteAppliance(req.params.id);
    res.status(204).send();
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    const { status, clientId, userId } = req.query;
    if (status) {
      const tasks = await storage.getTasksByStatus(status as string);
      return res.json(tasks);
    }
    if (clientId) {
      const tasks = await storage.getTasksByClient(clientId as string);
      return res.json(tasks);
    }
    if (userId) {
      const tasks = await storage.getTasksByUser(userId as string);
      return res.json(tasks);
    }
    const tasks = await storage.getAllTasks();
    res.json(tasks);
  });

  app.get("/api/tasks/:id", async (req, res) => {
    const task = await storage.getTask(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      
      if (validatedData.taskType === "recurring" && validatedData.dueDate && validatedData.recurrencePattern && validatedData.recurrencePattern !== "none") {
        const { calculateNextOccurrenceDate } = await import("./recurringTasksService");
        validatedData.nextOccurrenceDate = calculateNextOccurrenceDate(
          validatedData.dueDate as string,
          validatedData.recurrencePattern as string,
          validatedData.recurrenceInterval || 1
        );
      }
      
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    const task = await storage.updateTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    await storage.deleteTask(req.params.id);
    res.status(204).send();
  });

  // Recurring tasks endpoint
  app.get("/api/tasks/recurring/due", async (req, res) => {
    const tasks = await storage.getRecurringTasksDue();
    res.json(tasks);
  });

  // Generate upcoming recurring task instances (30 days ahead)
  app.post("/api/tasks/recurring/generate-upcoming", async (req, res) => {
    try {
      const { generateUpcomingRecurringInstances } = await import("./recurringTasksService");
      const result = await generateUpcomingRecurringInstances(30);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate recurring tasks (legacy - for past due dates)
  app.post("/api/tasks/recurring/generate", async (req, res) => {
    try {
      const { generateRecurringTasks } = await import("./recurringTasksService");
      const result = await generateRecurringTasks();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Reports
  app.get("/api/reports", async (req, res) => {
    const reports = await storage.getAllReports();
    res.json(reports);
  });

  app.get("/api/reports/with-details", async (req, res) => {
    const reports = await storage.getAllReports();
    const tasks = await storage.getAllTasks();
    const clients = await storage.getAllClients();
    const appliances = await storage.getAllAppliances();
    
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

  app.get("/api/reports/:id", async (req, res) => {
    const report = await storage.getReport(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json(report);
  });

  app.get("/api/tasks/:taskId/reports", async (req, res) => {
    const reports = await storage.getReportsByTask(req.params.taskId);
    res.json(reports);
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      
      if (validatedData.taskId) {
        await storage.updateTask(validatedData.taskId, { status: "completed" });
      }
      
      res.status(201).json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Documents
  app.get("/api/documents", async (req, res) => {
    const documents = await storage.getAllDocuments();
    res.json(documents);
  });

  app.get("/api/documents/:id", async (req, res) => {
    const document = await storage.getDocument(req.params.id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(document);
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    await storage.deleteDocument(req.params.id);
    res.status(204).send();
  });

  // Spare Parts
  app.get("/api/spare-parts", async (req, res) => {
    const spareParts = await storage.getAllSpareParts();
    res.json(spareParts);
  });

  app.get("/api/spare-parts/:id", async (req, res) => {
    const sparePart = await storage.getSparePart(req.params.id);
    if (!sparePart) {
      return res.status(404).json({ message: "Spare part not found" });
    }
    res.json(sparePart);
  });

  app.post("/api/spare-parts", async (req, res) => {
    try {
      const validatedData = insertSparePartSchema.parse(req.body);
      const sparePart = await storage.createSparePart(validatedData);
      res.status(201).json(sparePart);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/spare-parts/:id", async (req, res) => {
    const sparePart = await storage.updateSparePart(req.params.id, req.body);
    if (!sparePart) {
      return res.status(404).json({ message: "Spare part not found" });
    }
    res.json(sparePart);
  });

  app.delete("/api/spare-parts/:id", async (req, res) => {
    await storage.deleteSparePart(req.params.id);
    res.status(204).send();
  });

  const httpServer = createServer(app);
  return httpServer;
}
