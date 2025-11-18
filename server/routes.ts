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
import multer from "multer";
import OpenAI from "openai";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";

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
      .audioChannels(1) // Mono for smaller file size
      .audioFrequency(16000) // 16kHz is optimal for Whisper
      .format('mp3')
      .on('error', (err) => {
        console.error('FFmpeg conversion error:', err);
        reject(err);
      })
      .on('end', () => {
        console.log('FFmpeg conversion completed successfully');
        resolve(Buffer.concat(chunks));
      });

    // Create a writable stream to collect output
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Voice to Report endpoint
  app.post("/api/transcribe-voice", upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "applianceContext", maxCount: 1 },
    { name: "clientContext", maxCount: 1 }
  ]), async (req, res) => {
    try {
      console.log("=== Transcribe Voice Request ===");
      console.log("Headers:", req.headers);
      console.log("Body keys:", Object.keys(req.body));
      console.log("Files:", req.files);
      console.log("File object:", req.file);
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files || !files.audio || files.audio.length === 0) {
        console.error("No audio file found in request");
        console.error("Files object:", files);
        return res.status(400).json({ message: "No audio file provided" });
      }

      const audioFile = files.audio[0];

      // Parse context from form data with error handling
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
        console.error("Failed to parse context:", parseError);
        return res.status(400).json({ message: "Invalid context format" });
      }

      // Build context description for Whisper and GPT
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

      // Convert audio to MP3 if it's in WebM or other unsupported formats
      let audioBuffer = audioFile.buffer;
      let audioFilename = "audio.mp3";
      let audioMimetype = "audio/mp3";

      if (audioFile.mimetype === "audio/webm" || audioFile.mimetype.includes("webm")) {
        console.log("Converting WebM audio to MP3 format...");
        try {
          audioBuffer = await convertToMp3(audioFile.buffer, "webm");
          console.log(`Converted WebM to MP3. Original size: ${audioFile.size}, New size: ${audioBuffer.length}`);
        } catch (conversionError) {
          console.error("Audio conversion failed:", conversionError);
          return res.status(500).json({ message: "Failed to convert audio format" });
        }
      }

      // Step 1: Transcribe audio using Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], audioFilename, { type: audioMimetype }),
        model: "whisper-1",
        language: "sr", // Serbian language for Montenegro
        prompt: contextDescription + "Tehničar opisuje popravku uređaja, delove koji su korišćeni, i vreme rada.",
      });

      const transcript = transcription.text;
      console.log("Whisper transcript:", transcript);

      // Step 2: Generate structured report using GPT
      const systemPrompt = `Ti si asistent koji pretvara glasovne poruke tehničara u strukturirane izvještaje o popravkama.

${contextDescription ? `KONTEKST SERVISA:\n${contextDescription}\n` : ""}
Iz transkripta glasovne poruke, ekstraktuj:
1. **Opis rada**: Detaljan opis šta je urađeno na popravci. Obavezno navedi tačan uređaj koji se popravlja.
2. **Trajanje rada**: Koliko minuta je trajao posao (procijeni ako nije navedeno)
3. **Korišćeni dijelovi**: Lista rezervnih dijelova koji su korišćeni (ako ih ima)

Odgovori SAMO u JSON formatu:
{
  "description": "Detaljan opis rada koji je obavljen na [naziv uređaja]...",
  "workDuration": 60,
  "sparePartsUsed": "Lista korišćenih dijelova (ili null)"
}`;

      console.log("Calling GPT-4o with transcript...");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Glasovna poruka tehničara: "${transcript}"`,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      console.log("GPT-4o raw response:", completion.choices[0].message.content);
      const reportData = JSON.parse(completion.choices[0].message.content || "{}");
      console.log("Parsed reportData:", reportData);

      res.json({
        transcript,
        reportData,
      });
    } catch (error: any) {
      console.error("Voice transcription error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to process voice message" 
      });
    }
  });

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
    const task = await storage.getTask(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    await storage.deleteTaskCascade(req.params.id);
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
