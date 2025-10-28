import { 
  type User, type Profile, type InsertProfile,
  type Client, type InsertClient,
  type Appliance, type InsertAppliance,
  type Task, type InsertTask,
  type Report, type InsertReport,
  type Document, type InsertDocument,
  type SparePart, type InsertSparePart,
  profiles, clients, appliances, tasks, reports, documents, spareParts
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Partial<InsertProfile>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  getAllClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;
  
  getAllAppliances(): Promise<Appliance[]>;
  getAppliancesByClient(clientId: string): Promise<Appliance[]>;
  getAppliance(id: string): Promise<Appliance | undefined>;
  createAppliance(appliance: InsertAppliance): Promise<Appliance>;
  updateAppliance(id: string, appliance: Partial<InsertAppliance>): Promise<Appliance | undefined>;
  deleteAppliance(id: string): Promise<void>;
  
  getAllTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByStatus(status: string): Promise<Task[]>;
  getTasksByClient(clientId: string): Promise<Task[]>;
  getTasksByUser(userId: string): Promise<Task[]>;
  getRecurringTasksDue(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  
  getAllReports(): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  getReportsByTask(taskId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  
  getAllDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  
  getAllSpareParts(): Promise<SparePart[]>;
  getSparePart(id: string): Promise<SparePart | undefined>;
  createSparePart(sparePart: InsertSparePart): Promise<SparePart>;
  updateSparePart(id: string, sparePart: Partial<InsertSparePart>): Promise<SparePart | undefined>;
  deleteSparePart(id: string): Promise<void>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.username, username));
    return result[0];
  }

  async createUser(insertProfile: Partial<InsertProfile>): Promise<User> {
    const result = await db.insert(profiles).values({
      id: randomUUID(),
      ...insertProfile
    } as any).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(profiles);
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values({
      id: randomUUID(),
      ...insertClient
    }).returning();
    return result[0];
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db.update(clients).set(client).where(eq(clients.id, id)).returning();
    return result[0];
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async getAllAppliances(): Promise<Appliance[]> {
    return await db.select().from(appliances);
  }

  async getAppliancesByClient(clientId: string): Promise<Appliance[]> {
    return await db.select().from(appliances).where(eq(appliances.clientId, clientId));
  }

  async getAppliance(id: string): Promise<Appliance | undefined> {
    const result = await db.select().from(appliances).where(eq(appliances.id, id));
    return result[0];
  }

  async createAppliance(insertAppliance: InsertAppliance): Promise<Appliance> {
    const result = await db.insert(appliances).values({
      id: randomUUID(),
      ...insertAppliance
    }).returning();
    return result[0];
  }

  async updateAppliance(id: string, appliance: Partial<InsertAppliance>): Promise<Appliance | undefined> {
    const result = await db.update(appliances).set(appliance).where(eq(appliances.id, id)).returning();
    return result[0];
  }

  async deleteAppliance(id: string): Promise<void> {
    await db.delete(appliances).where(eq(appliances.id, id));
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.status, status));
  }

  async getTasksByClient(clientId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.clientId, clientId));
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getRecurringTasksDue(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.select().from(tasks).where(
      and(
        eq(tasks.taskType, "recurring"),
        lte(tasks.nextOccurrenceDate, today)
      )
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values({
      id: randomUUID(),
      ...insertTask
    }).returning();
    return result[0];
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports);
  }

  async getReport(id: string): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.id, id));
    return result[0];
  }

  async getReportsByTask(taskId: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.taskId, taskId));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const result = await db.insert(reports).values({
      id: randomUUID(),
      ...insertReport
    }).returning();
    return result[0];
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id));
    return result[0];
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values({
      id: randomUUID(),
      ...insertDocument
    }).returning();
    return result[0];
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async getAllSpareParts(): Promise<SparePart[]> {
    return await db.select().from(spareParts);
  }

  async getSparePart(id: string): Promise<SparePart | undefined> {
    const result = await db.select().from(spareParts).where(eq(spareParts.id, id));
    return result[0];
  }

  async createSparePart(insertSparePart: InsertSparePart): Promise<SparePart> {
    const result = await db.insert(spareParts).values({
      id: randomUUID(),
      ...insertSparePart
    }).returning();
    return result[0];
  }

  async updateSparePart(id: string, sparePart: Partial<InsertSparePart>): Promise<SparePart | undefined> {
    const result = await db.update(spareParts).set(sparePart).where(eq(spareParts.id, id)).returning();
    return result[0];
  }

  async deleteSparePart(id: string): Promise<void> {
    await db.delete(spareParts).where(eq(spareParts.id, id));
  }
}

export const storage = new DbStorage();
