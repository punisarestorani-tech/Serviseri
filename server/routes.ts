import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertApplianceSchema, insertTaskSchema, insertReportSchema } from "@shared/schema";
import { generateRecurringTasks } from "./recurringTasksService";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Generate recurring tasks
  app.post("/api/tasks/recurring/generate", async (req, res) => {
    try {
      const result = await generateRecurringTasks();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Reports
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
      res.status(201).json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Files
  app.get("/api/tasks/:taskId/files", async (req, res) => {
    const files = await storage.getFilesByTask(req.params.taskId);
    res.json(files);
  });

  app.get("/api/reports/:reportId/files", async (req, res) => {
    const files = await storage.getFilesByReport(req.params.reportId);
    res.json(files);
  });

  // Users
  app.get("/api/users", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  const httpServer = createServer(app);

  return httpServer;
}
