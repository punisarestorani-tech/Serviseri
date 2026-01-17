import {
  type User, type Profile, type InsertProfile,
  type Client, type InsertClient,
  type Appliance, type InsertAppliance,
  type Task, type InsertTask,
  type Report, type InsertReport,
  type Document, type InsertDocument,
  type SparePart, type InsertSparePart,
  type Organization, type InsertOrganization,
  profiles, clients, appliances, tasks, reports, documents, spareParts, organizations
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, ne, sql, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Organizations
  getAllOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization | undefined>;
  deleteOrganization(id: string): Promise<void>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Partial<InsertProfile>): Promise<User>;
  updateUser(id: string, user: Partial<InsertProfile>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(organizationId?: string): Promise<User[]>;

  // Clients
  getAllClients(organizationId: string): Promise<Client[]>;
  getClient(id: string, organizationId?: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>, organizationId: string): Promise<Client | undefined>;
  deleteClient(id: string, organizationId: string): Promise<void>;

  // Appliances
  getAllAppliances(organizationId: string): Promise<Appliance[]>;
  getAppliancesByClient(clientId: string, organizationId: string): Promise<Appliance[]>;
  getAppliance(id: string, organizationId?: string): Promise<Appliance | undefined>;
  createAppliance(appliance: InsertAppliance, organizationId: string): Promise<Appliance>;
  updateAppliance(id: string, appliance: Partial<InsertAppliance>, organizationId: string): Promise<Appliance | undefined>;
  deleteAppliance(id: string, organizationId: string): Promise<void>;

  // Tasks
  getAllTasks(organizationId?: string): Promise<Task[]>;
  getTask(id: string, organizationId?: string): Promise<Task | undefined>;
  getTasksByStatus(status: string, organizationId: string): Promise<Task[]>;
  getTasksByClient(clientId: string, organizationId: string): Promise<Task[]>;
  getTasksByUser(userId: string, organizationId: string): Promise<Task[]>;
  getRecurringTasksDue(organizationId?: string): Promise<Task[]>;
  getTasksByParent(parentTaskId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  deleteTaskCascade(id: string): Promise<void>;

  // Reports
  getAllReports(organizationId: string): Promise<Report[]>;
  getReport(id: string, organizationId?: string): Promise<Report | undefined>;
  getReportsByTask(taskId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, report: Partial<InsertReport>): Promise<Report | undefined>;

  // Documents
  getAllDocuments(organizationId: string): Promise<Document[]>;
  getDocument(id: string, organizationId: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string, organizationId: string): Promise<void>;

  // Spare Parts
  getAllSpareParts(organizationId: string): Promise<SparePart[]>;
  getSparePart(id: string, organizationId: string): Promise<SparePart | undefined>;
  createSparePart(sparePart: InsertSparePart): Promise<SparePart>;
  updateSparePart(id: string, sparePart: Partial<InsertSparePart>, organizationId: string): Promise<SparePart | undefined>;
  deleteSparePart(id: string, organizationId: string): Promise<void>;
}

export class DbStorage implements IStorage {
  // ==================== ORGANIZATIONS ====================

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id));
    return result[0];
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const result = await db.insert(organizations).values({
      id: randomUUID(),
      ...insertOrg
    }).returning();
    return result[0];
  }

  async updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const result = await db.update(organizations).set(org).where(eq(organizations.id, id)).returning();
    return result[0];
  }

  async deleteOrganization(id: string): Promise<void> {
    await db.delete(organizations).where(eq(organizations.id, id));
  }

  // ==================== USERS ====================

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

  async updateUser(id: string, user: Partial<InsertProfile>): Promise<User | undefined> {
    const result = await db.update(profiles).set(user).where(eq(profiles.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(profiles).where(eq(profiles.id, id));
  }

  async getAllUsers(organizationId?: string): Promise<User[]> {
    if (organizationId) {
      return await db.select().from(profiles).where(eq(profiles.organizationId, organizationId));
    }
    // For super_admin - get all users
    return await db.select().from(profiles);
  }

  // ==================== CLIENTS ====================

  async getAllClients(organizationId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.organizationId, organizationId));
  }

  async getClient(id: string, organizationId?: string): Promise<Client | undefined> {
    if (organizationId) {
      const result = await db.select().from(clients).where(
        and(
          eq(clients.id, id),
          eq(clients.organizationId, organizationId)
        )
      );
      return result[0];
    }
    // Without organizationId - internal use only
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

  async updateClient(id: string, client: Partial<InsertClient>, organizationId: string): Promise<Client | undefined> {
    const result = await db.update(clients)
      .set(client)
      .where(
        and(
          eq(clients.id, id),
          eq(clients.organizationId, organizationId)
        )
      )
      .returning();
    return result[0];
  }

  async deleteClient(id: string, organizationId: string): Promise<void> {
    await db.delete(clients).where(
      and(
        eq(clients.id, id),
        eq(clients.organizationId, organizationId)
      )
    );
  }

  // ==================== APPLIANCES ====================

  async getAllAppliances(organizationId: string): Promise<Appliance[]> {
    // Join with clients to filter by organization
    const result = await db
      .select({
        id: appliances.id,
        clientId: appliances.clientId,
        maker: appliances.maker,
        type: appliances.type,
        model: appliances.model,
        serial: appliances.serial,
        picture: appliances.picture,
        city: appliances.city,
        building: appliances.building,
        room: appliances.room,
        lastServiceDate: appliances.lastServiceDate,
        nextServiceDate: appliances.nextServiceDate,
        installDate: appliances.installDate,
        createdAt: appliances.createdAt,
      })
      .from(appliances)
      .innerJoin(clients, eq(appliances.clientId, clients.id))
      .where(eq(clients.organizationId, organizationId));
    return result;
  }

  async getAppliancesByClient(clientId: string, organizationId: string): Promise<Appliance[]> {
    // Verify client belongs to organization
    const result = await db
      .select({
        id: appliances.id,
        clientId: appliances.clientId,
        maker: appliances.maker,
        type: appliances.type,
        model: appliances.model,
        serial: appliances.serial,
        picture: appliances.picture,
        city: appliances.city,
        building: appliances.building,
        room: appliances.room,
        lastServiceDate: appliances.lastServiceDate,
        nextServiceDate: appliances.nextServiceDate,
        installDate: appliances.installDate,
        createdAt: appliances.createdAt,
      })
      .from(appliances)
      .innerJoin(clients, eq(appliances.clientId, clients.id))
      .where(
        and(
          eq(appliances.clientId, clientId),
          eq(clients.organizationId, organizationId)
        )
      );
    return result;
  }

  async getAppliance(id: string, organizationId?: string): Promise<Appliance | undefined> {
    if (organizationId) {
      const result = await db
        .select({
          id: appliances.id,
          clientId: appliances.clientId,
          maker: appliances.maker,
          type: appliances.type,
          model: appliances.model,
          serial: appliances.serial,
          picture: appliances.picture,
          city: appliances.city,
          building: appliances.building,
          room: appliances.room,
          lastServiceDate: appliances.lastServiceDate,
          nextServiceDate: appliances.nextServiceDate,
          installDate: appliances.installDate,
          createdAt: appliances.createdAt,
        })
        .from(appliances)
        .innerJoin(clients, eq(appliances.clientId, clients.id))
        .where(
          and(
            eq(appliances.id, id),
            eq(clients.organizationId, organizationId)
          )
        );
      return result[0];
    }
    // Without organizationId - internal use only
    const result = await db.select().from(appliances).where(eq(appliances.id, id));
    return result[0];
  }

  async createAppliance(insertAppliance: InsertAppliance, organizationId: string): Promise<Appliance> {
    // Verify client belongs to organization before creating
    const client = await this.getClient(insertAppliance.clientId, organizationId);
    if (!client) {
      throw new Error("Client not found or does not belong to this organization");
    }

    const result = await db.insert(appliances).values({
      id: randomUUID(),
      ...insertAppliance
    }).returning();
    return result[0];
  }

  async updateAppliance(id: string, appliance: Partial<InsertAppliance>, organizationId: string): Promise<Appliance | undefined> {
    // Verify appliance belongs to organization
    const existing = await this.getAppliance(id, organizationId);
    if (!existing) {
      return undefined;
    }

    const result = await db.update(appliances).set(appliance).where(eq(appliances.id, id)).returning();
    return result[0];
  }

  async deleteAppliance(id: string, organizationId: string): Promise<void> {
    // Verify appliance belongs to organization
    const existing = await this.getAppliance(id, organizationId);
    if (!existing) {
      return;
    }

    await db.delete(appliances).where(eq(appliances.id, id));
  }

  // ==================== TASKS ====================

  async getAllTasks(organizationId?: string): Promise<Task[]> {
    if (organizationId) {
      const result = await db
        .select({
          id: tasks.id,
          clientId: tasks.clientId,
          applianceId: tasks.applianceId,
          userId: tasks.userId,
          status: tasks.status,
          taskType: tasks.taskType,
          description: tasks.description,
          dueDate: tasks.dueDate,
          priority: tasks.priority,
          recurrencePattern: tasks.recurrencePattern,
          recurrenceInterval: tasks.recurrenceInterval,
          parentTaskId: tasks.parentTaskId,
          isAutoGenerated: tasks.isAutoGenerated,
          nextOccurrenceDate: tasks.nextOccurrenceDate,
          createdAt: tasks.createdAt,
          completedAt: tasks.completedAt,
          reportId: tasks.reportId,
        })
        .from(tasks)
        .innerJoin(clients, eq(tasks.clientId, clients.id))
        .where(eq(clients.organizationId, organizationId));
      return result;
    }
    // Without organizationId - get all tasks (for recurring tasks service)
    return await db.select().from(tasks);
  }

  async getTask(id: string, organizationId?: string): Promise<Task | undefined> {
    if (organizationId) {
      const result = await db
        .select({
          id: tasks.id,
          clientId: tasks.clientId,
          applianceId: tasks.applianceId,
          userId: tasks.userId,
          status: tasks.status,
          taskType: tasks.taskType,
          description: tasks.description,
          dueDate: tasks.dueDate,
          priority: tasks.priority,
          recurrencePattern: tasks.recurrencePattern,
          recurrenceInterval: tasks.recurrenceInterval,
          parentTaskId: tasks.parentTaskId,
          isAutoGenerated: tasks.isAutoGenerated,
          nextOccurrenceDate: tasks.nextOccurrenceDate,
          createdAt: tasks.createdAt,
          completedAt: tasks.completedAt,
          reportId: tasks.reportId,
        })
        .from(tasks)
        .innerJoin(clients, eq(tasks.clientId, clients.id))
        .where(
          and(
            eq(tasks.id, id),
            eq(clients.organizationId, organizationId)
          )
        );
      return result[0];
    }

    // Without organizationId - internal use only (for recurring tasks service)
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async getTasksByStatus(status: string, organizationId: string): Promise<Task[]> {
    const result = await db
      .select({
        id: tasks.id,
        clientId: tasks.clientId,
        applianceId: tasks.applianceId,
        userId: tasks.userId,
        status: tasks.status,
        taskType: tasks.taskType,
        description: tasks.description,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        recurrencePattern: tasks.recurrencePattern,
        recurrenceInterval: tasks.recurrenceInterval,
        parentTaskId: tasks.parentTaskId,
        isAutoGenerated: tasks.isAutoGenerated,
        nextOccurrenceDate: tasks.nextOccurrenceDate,
        createdAt: tasks.createdAt,
        completedAt: tasks.completedAt,
        reportId: tasks.reportId,
      })
      .from(tasks)
      .innerJoin(clients, eq(tasks.clientId, clients.id))
      .where(
        and(
          eq(tasks.status, status),
          eq(clients.organizationId, organizationId)
        )
      );
    return result;
  }

  async getTasksByClient(clientId: string, organizationId: string): Promise<Task[]> {
    const result = await db
      .select({
        id: tasks.id,
        clientId: tasks.clientId,
        applianceId: tasks.applianceId,
        userId: tasks.userId,
        status: tasks.status,
        taskType: tasks.taskType,
        description: tasks.description,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        recurrencePattern: tasks.recurrencePattern,
        recurrenceInterval: tasks.recurrenceInterval,
        parentTaskId: tasks.parentTaskId,
        isAutoGenerated: tasks.isAutoGenerated,
        nextOccurrenceDate: tasks.nextOccurrenceDate,
        createdAt: tasks.createdAt,
        completedAt: tasks.completedAt,
        reportId: tasks.reportId,
      })
      .from(tasks)
      .innerJoin(clients, eq(tasks.clientId, clients.id))
      .where(
        and(
          eq(tasks.clientId, clientId),
          eq(clients.organizationId, organizationId)
        )
      );
    return result;
  }

  async getTasksByUser(userId: string, organizationId: string): Promise<Task[]> {
    const result = await db
      .select({
        id: tasks.id,
        clientId: tasks.clientId,
        applianceId: tasks.applianceId,
        userId: tasks.userId,
        status: tasks.status,
        taskType: tasks.taskType,
        description: tasks.description,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        recurrencePattern: tasks.recurrencePattern,
        recurrenceInterval: tasks.recurrenceInterval,
        parentTaskId: tasks.parentTaskId,
        isAutoGenerated: tasks.isAutoGenerated,
        nextOccurrenceDate: tasks.nextOccurrenceDate,
        createdAt: tasks.createdAt,
        completedAt: tasks.completedAt,
        reportId: tasks.reportId,
      })
      .from(tasks)
      .innerJoin(clients, eq(tasks.clientId, clients.id))
      .where(
        and(
          eq(tasks.userId, userId),
          eq(clients.organizationId, organizationId)
        )
      );
    return result;
  }

  async getRecurringTasksDue(organizationId?: string): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];

    if (organizationId) {
      const result = await db
        .select({
          id: tasks.id,
          clientId: tasks.clientId,
          applianceId: tasks.applianceId,
          userId: tasks.userId,
          status: tasks.status,
          taskType: tasks.taskType,
          description: tasks.description,
          dueDate: tasks.dueDate,
          priority: tasks.priority,
          recurrencePattern: tasks.recurrencePattern,
          recurrenceInterval: tasks.recurrenceInterval,
          parentTaskId: tasks.parentTaskId,
          isAutoGenerated: tasks.isAutoGenerated,
          nextOccurrenceDate: tasks.nextOccurrenceDate,
          createdAt: tasks.createdAt,
          completedAt: tasks.completedAt,
          reportId: tasks.reportId,
        })
        .from(tasks)
        .innerJoin(clients, eq(tasks.clientId, clients.id))
        .where(
          and(
            eq(tasks.taskType, "recurring"),
            lte(tasks.nextOccurrenceDate, today),
            eq(clients.organizationId, organizationId)
          )
        );
      return result;
    }

    // Without organizationId - get all recurring tasks (for background service)
    return await db.select().from(tasks).where(
      and(
        eq(tasks.taskType, "recurring"),
        lte(tasks.nextOccurrenceDate, today)
      )
    );
  }

  async getTasksByParent(parentTaskId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.parentTaskId, parentTaskId));
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

  async deleteTaskCascade(id: string): Promise<void> {
    const task = await this.getTask(id);
    if (!task) {
      return;
    }

    await db.transaction(async (tx) => {
      const tasksToDelete: string[] = [];
      const visited = new Set<string>();
      const MAX_DEPTH = 100;
      const rootParentId = id;

      async function collectNonCompletedDescendants(parentId: string, depth: number = 0) {
        if (depth >= MAX_DEPTH) {
          throw new Error(`Task hierarchy exceeds maximum depth of ${MAX_DEPTH} levels`);
        }

        if (visited.has(parentId)) {
          return;
        }
        visited.add(parentId);

        const children = await tx.select().from(tasks).where(eq(tasks.parentTaskId, parentId));

        for (const child of children) {
          if (child.status === "completed") {
            continue;
          }

          if (child.id === rootParentId) {
            continue;
          }

          if (visited.has(child.id)) {
            continue;
          }

          tasksToDelete.push(child.id);
          await collectNonCompletedDescendants(child.id, depth + 1);
        }
      }

      if (task.taskType === "recurring" && !task.isAutoGenerated) {
        await collectNonCompletedDescendants(id);
      }

      if (tasksToDelete.length > 0) {
        await tx.delete(tasks).where(
          sql`${tasks.id} IN (${sql.join(tasksToDelete.map(id => sql`${id}`), sql`, `)})`
        );
      }

      if (task.status !== "completed") {
        await tx.delete(tasks).where(eq(tasks.id, id));
      }
    });
  }

  // ==================== REPORTS ====================

  async getAllReports(organizationId: string): Promise<Report[]> {
    const result = await db
      .select({
        id: reports.id,
        taskId: reports.taskId,
        description: reports.description,
        sparePartsUsed: reports.sparePartsUsed,
        workDuration: reports.workDuration,
        photos: reports.photos,
        createdAt: reports.createdAt,
      })
      .from(reports)
      .innerJoin(tasks, eq(reports.taskId, tasks.id))
      .innerJoin(clients, eq(tasks.clientId, clients.id))
      .where(eq(clients.organizationId, organizationId));
    return result;
  }

  async getReport(id: string, organizationId?: string): Promise<Report | undefined> {
    if (organizationId) {
      const result = await db
        .select({
          id: reports.id,
          taskId: reports.taskId,
          description: reports.description,
          sparePartsUsed: reports.sparePartsUsed,
          workDuration: reports.workDuration,
          photos: reports.photos,
          createdAt: reports.createdAt,
        })
        .from(reports)
        .innerJoin(tasks, eq(reports.taskId, tasks.id))
        .innerJoin(clients, eq(tasks.clientId, clients.id))
        .where(
          and(
            eq(reports.id, id),
            eq(clients.organizationId, organizationId)
          )
        );
      return result[0];
    }

    // Without organizationId - internal use
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

  async updateReport(id: string, report: Partial<InsertReport>): Promise<Report | undefined> {
    const result = await db.update(reports).set(report).where(eq(reports.id, id)).returning();
    return result[0];
  }

  // ==================== DOCUMENTS ====================

  async getAllDocuments(organizationId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.organizationId, organizationId));
  }

  async getDocument(id: string, organizationId: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(
      and(
        eq(documents.id, id),
        eq(documents.organizationId, organizationId)
      )
    );
    return result[0];
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values({
      id: randomUUID(),
      ...insertDocument
    }).returning();
    return result[0];
  }

  async deleteDocument(id: string, organizationId: string): Promise<void> {
    await db.delete(documents).where(
      and(
        eq(documents.id, id),
        eq(documents.organizationId, organizationId)
      )
    );
  }

  // ==================== SPARE PARTS ====================

  async getAllSpareParts(organizationId: string): Promise<SparePart[]> {
    return await db.select().from(spareParts).where(eq(spareParts.organizationId, organizationId));
  }

  async getSparePart(id: string, organizationId: string): Promise<SparePart | undefined> {
    const result = await db.select().from(spareParts).where(
      and(
        eq(spareParts.id, id),
        eq(spareParts.organizationId, organizationId)
      )
    );
    return result[0];
  }

  async createSparePart(insertSparePart: InsertSparePart): Promise<SparePart> {
    const result = await db.insert(spareParts).values({
      id: randomUUID(),
      ...insertSparePart
    }).returning();
    return result[0];
  }

  async updateSparePart(id: string, sparePart: Partial<InsertSparePart>, organizationId: string): Promise<SparePart | undefined> {
    const result = await db.update(spareParts)
      .set(sparePart)
      .where(
        and(
          eq(spareParts.id, id),
          eq(spareParts.organizationId, organizationId)
        )
      )
      .returning();
    return result[0];
  }

  async deleteSparePart(id: string, organizationId: string): Promise<void> {
    await db.delete(spareParts).where(
      and(
        eq(spareParts.id, id),
        eq(spareParts.organizationId, organizationId)
      )
    );
  }
}

export const storage = new DbStorage();
