import { 
  type User, type InsertUser,
  type Client, type InsertClient,
  type Appliance, type InsertAppliance,
  type Task, type InsertTask,
  type Report, type InsertReport,
  type File, type InsertFile,
  users, clients, appliances, tasks, reports, files
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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
  
  getReport(id: string): Promise<Report | undefined>;
  getReportsByTask(taskId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  
  getFilesByTask(taskId: string): Promise<File[]>;
  getFilesByReport(reportId: string): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: string): Promise<void>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(insertClient).returning();
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
    const result = await db.insert(appliances).values(insertAppliance).returning();
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
        eq(tasks.taskType, 'recurring'),
        lte(tasks.nextOccurrenceDate, today),
        sql`${tasks.nextOccurrenceDate} IS NOT NULL`
      )
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(insertTask).returning();
    return result[0];
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getReport(id: string): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.id, id));
    return result[0];
  }

  async getReportsByTask(taskId: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.taskId, taskId));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const result = await db.insert(reports).values(insertReport).returning();
    return result[0];
  }

  async getFilesByTask(taskId: string): Promise<File[]> {
    return await db.select().from(files).where(eq(files.taskId, taskId));
  }

  async getFilesByReport(reportId: string): Promise<File[]> {
    return await db.select().from(files).where(eq(files.reportId, reportId));
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const result = await db.insert(files).values(insertFile).returning();
    return result[0];
  }

  async deleteFile(id: string): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }
}

export const storage = new DbStorage();
