
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/dotenv/package.json
var require_package = __commonJS({
  "node_modules/dotenv/package.json"(exports, module) {
    module.exports = {
      name: "dotenv",
      version: "17.2.3",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        pretest: "npm run lint && npm run dts-check",
        test: "tap run tests/**/*.js --allow-empty-coverage --disable-coverage --timeout=60000",
        "test:coverage": "tap run tests/**/*.js --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      homepage: "https://github.com/motdotla/dotenv#readme",
      funding: "https://dotenvx.com",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@types/node": "^18.11.3",
        decache: "^4.6.2",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-version": "^9.5.0",
        tap: "^19.2.0",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports, module) {
    var fs = __require("fs");
    var path = __require("path");
    var os = __require("os");
    var crypto2 = __require("crypto");
    var packageJson = require_package();
    var version = packageJson.version;
    var TIPS = [
      "\u{1F510} encrypt with Dotenvx: https://dotenvx.com",
      "\u{1F510} prevent committing .env to code: https://dotenvx.com/precommit",
      "\u{1F510} prevent building .env in docker: https://dotenvx.com/prebuild",
      "\u{1F4E1} add observability to secrets: https://dotenvx.com/ops",
      "\u{1F465} sync secrets across teammates & machines: https://dotenvx.com/ops",
      "\u{1F5C2}\uFE0F backup and recover secrets: https://dotenvx.com/ops",
      "\u2705 audit secrets and track compliance: https://dotenvx.com/ops",
      "\u{1F504} add secrets lifecycle management: https://dotenvx.com/ops",
      "\u{1F511} add access controls to secrets: https://dotenvx.com/ops",
      "\u{1F6E0}\uFE0F  run anywhere with `dotenvx run -- yourcommand`",
      "\u2699\uFE0F  specify custom .env file path with { path: '/custom/path/.env' }",
      "\u2699\uFE0F  enable debug logging with { debug: true }",
      "\u2699\uFE0F  override existing env vars with { override: true }",
      "\u2699\uFE0F  suppress all logs with { quiet: true }",
      "\u2699\uFE0F  write to custom object with { processEnv: myObject }",
      "\u2699\uFE0F  load multiple .env files with { path: ['.env.local', '.env'] }"
    ];
    function _getRandomTip() {
      return TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    function parseBoolean(value) {
      if (typeof value === "string") {
        return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
      }
      return Boolean(value);
    }
    function supportsAnsi() {
      return process.stdout.isTTY;
    }
    function dim(text2) {
      return supportsAnsi() ? `\x1B[2m${text2}\x1B[0m` : text2;
    }
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.error(`[dotenv@${version}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version}][DEBUG] ${message}`);
    }
    function _log(message) {
      console.log(`[dotenv@${version}] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
      const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (debug || !quiet) {
        _log("Loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
      let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("No encoding is specified. UTF-8 is used by default");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      const populated = DotenvModule.populate(processEnv, parsedAll, options);
      debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
      quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
      if (debug || !quiet) {
        const keysCount = Object.keys(populated).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`Failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injecting env (${keysCount}) from ${shortPaths.join(",")} ${dim(`-- tip: ${_getRandomTip()}`)}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto2.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      const populated = {};
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
            populated[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }
      }
      return populated;
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module.exports.configDotenv = DotenvModule.configDotenv;
    module.exports._configVault = DotenvModule._configVault;
    module.exports._parseVault = DotenvModule._parseVault;
    module.exports.config = DotenvModule.config;
    module.exports.decrypt = DotenvModule.decrypt;
    module.exports.parse = DotenvModule.parse;
    module.exports.populate = DotenvModule.populate;
    module.exports = DotenvModule;
  }
});

// node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS({
  "node_modules/dotenv/lib/env-options.js"(exports, module) {
    var options = {};
    if (process.env.DOTENV_CONFIG_ENCODING != null) {
      options.encoding = process.env.DOTENV_CONFIG_ENCODING;
    }
    if (process.env.DOTENV_CONFIG_PATH != null) {
      options.path = process.env.DOTENV_CONFIG_PATH;
    }
    if (process.env.DOTENV_CONFIG_QUIET != null) {
      options.quiet = process.env.DOTENV_CONFIG_QUIET;
    }
    if (process.env.DOTENV_CONFIG_DEBUG != null) {
      options.debug = process.env.DOTENV_CONFIG_DEBUG;
    }
    if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
      options.override = process.env.DOTENV_CONFIG_OVERRIDE;
    }
    if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
      options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
    }
    module.exports = options;
  }
});

// node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS({
  "node_modules/dotenv/lib/cli-options.js"(exports, module) {
    var re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
    module.exports = function optionMatcher(args) {
      const options = args.reduce(function(acc, cur) {
        const matches = cur.match(re);
        if (matches) {
          acc[matches[1]] = matches[2];
        }
        return acc;
      }, {});
      if (!("quiet" in options)) {
        options.quiet = "true";
      }
      return options;
    };
  }
});

// api/index.ts
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pg from "pg";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  appliances: () => appliances,
  clients: () => clients,
  documents: () => documents,
  insertApplianceSchema: () => insertApplianceSchema,
  insertClientSchema: () => insertClientSchema,
  insertDocumentSchema: () => insertDocumentSchema,
  insertOrganizationSchema: () => insertOrganizationSchema,
  insertProfileSchema: () => insertProfileSchema,
  insertReportSchema: () => insertReportSchema,
  insertSparePartSchema: () => insertSparePartSchema,
  insertTaskSchema: () => insertTaskSchema,
  organizations: () => organizations,
  profiles: () => profiles,
  reports: () => reports,
  spareParts: () => spareParts,
  tasks: () => tasks
});
import { pgTable, text, varchar, timestamp, integer, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var organizations = pgTable("organizations", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  address: varchar("address"),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  pib: varchar("pib"),
  // Tax ID
  pdv: varchar("pdv"),
  // VAT number
  logo: varchar("logo"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
var profiles = pgTable("profiles", {
  id: varchar("user_id").primaryKey(),
  username: varchar("username").notNull(),
  passwordHash: varchar("password_hash").notNull(),
  fullName: varchar("full_name").notNull(),
  email: varchar("email"),
  userRole: varchar("user_role").default("technician"),
  // super_admin | org_admin | technician
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  // nullable for super_admin
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
var clients = pgTable("clients", {
  id: varchar("id").primaryKey(),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  address: varchar("address"),
  contactName: varchar("contact_name"),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  pib: varchar("pib"),
  pdv: varchar("pdv"),
  account: varchar("account"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
var appliances = pgTable("appliances", {
  id: varchar("id").primaryKey(),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  maker: varchar("maker"),
  type: varchar("type"),
  model: varchar("model"),
  serial: varchar("serial"),
  picture: varchar("picture"),
  city: varchar("city"),
  building: varchar("building"),
  room: varchar("room"),
  lastServiceDate: date("last_service_date"),
  nextServiceDate: date("next_service_date"),
  installDate: date("install_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
var tasks = pgTable("tasks", {
  id: varchar("id").primaryKey(),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  applianceId: varchar("appliance_id").references(() => appliances.id, { onDelete: "set null" }),
  userId: varchar("user_id").references(() => profiles.id, { onDelete: "set null" }),
  status: text("status").notNull().default("pending"),
  taskType: text("task_type").notNull().default("one-time"),
  description: text("description").notNull(),
  dueDate: date("due_date"),
  priority: text("priority").default("normal"),
  recurrencePattern: text("recurrence_pattern").default("none"),
  recurrenceInterval: integer("recurrence_interval").default(1),
  parentTaskId: varchar("parent_task_id").references(() => tasks.id, { onDelete: "set null" }),
  isAutoGenerated: integer("is_auto_generated").default(0),
  nextOccurrenceDate: date("next_occurrence_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  reportId: varchar("report_id")
});
var reports = pgTable("reports", {
  id: varchar("id").primaryKey(),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  sparePartsUsed: text("spare_parts_used"),
  workDuration: integer("work_duration"),
  photos: text("photos").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
var documents = pgTable("documents", {
  id: varchar("id").primaryKey(),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  type: varchar("type"),
  url: varchar("url").notNull(),
  relatedTo: varchar("related_to"),
  relatedId: varchar("related_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
var spareParts = pgTable("spare_parts", {
  id: varchar("id").primaryKey(),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  partNumber: varchar("part_number"),
  manufacturer: varchar("manufacturer"),
  quantityInStock: integer("quantity_in_stock").default(0),
  minimumStockLevel: integer("minimum_stock_level").default(0),
  unitPrice: integer("unit_price"),
  location: varchar("location"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
var insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true });
var insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true });
var insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
var insertApplianceSchema = createInsertSchema(appliances).omit({ id: true, createdAt: true });
var insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  reportId: true
}).refine(
  (data) => {
    if (data.taskType === "recurring") {
      return data.dueDate !== null && data.dueDate !== void 0 && data.recurrencePattern && data.recurrencePattern !== "none" && data.recurrenceInterval && data.recurrenceInterval >= 1;
    }
    return true;
  },
  {
    message: "Recurring tasks must have a due date, recurrence pattern, and interval >= 1"
  }
).refine(
  (data) => {
    if (data.taskType === "one-time") {
      return data.recurrencePattern === "none" || !data.recurrencePattern;
    }
    return true;
  },
  {
    message: "One-time tasks must not have recurrence settings"
  }
);
var insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true });
var insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
var insertSparePartSchema = createInsertSchema(spareParts).omit({ id: true, createdAt: true });

// node_modules/dotenv/config.js
(function() {
  require_main().config(
    Object.assign(
      {},
      require_env_options(),
      require_cli_options()(process.argv)
    )
  );
})();

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, and, lte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
var DbStorage = class {
  // ==================== ORGANIZATIONS ====================
  async getAllOrganizations() {
    return await db.select().from(organizations);
  }
  async getOrganization(id) {
    const result = await db.select().from(organizations).where(eq(organizations.id, id));
    return result[0];
  }
  async createOrganization(insertOrg) {
    const result = await db.insert(organizations).values({
      id: randomUUID(),
      ...insertOrg
    }).returning();
    return result[0];
  }
  async updateOrganization(id, org) {
    const result = await db.update(organizations).set(org).where(eq(organizations.id, id)).returning();
    return result[0];
  }
  async deleteOrganization(id) {
    await db.delete(organizations).where(eq(organizations.id, id));
  }
  // ==================== USERS ====================
  async getUser(id) {
    const result = await db.select().from(profiles).where(eq(profiles.id, id));
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(profiles).where(eq(profiles.username, username));
    return result[0];
  }
  async createUser(insertProfile) {
    const result = await db.insert(profiles).values({
      id: randomUUID(),
      ...insertProfile
    }).returning();
    return result[0];
  }
  async updateUser(id, user) {
    const result = await db.update(profiles).set(user).where(eq(profiles.id, id)).returning();
    return result[0];
  }
  async deleteUser(id) {
    await db.delete(profiles).where(eq(profiles.id, id));
  }
  async getAllUsers(organizationId) {
    if (organizationId) {
      return await db.select().from(profiles).where(eq(profiles.organizationId, organizationId));
    }
    return await db.select().from(profiles);
  }
  // ==================== CLIENTS ====================
  async getAllClients(organizationId) {
    return await db.select().from(clients).where(eq(clients.organizationId, organizationId));
  }
  async getClient(id, organizationId) {
    if (organizationId) {
      const result2 = await db.select().from(clients).where(
        and(
          eq(clients.id, id),
          eq(clients.organizationId, organizationId)
        )
      );
      return result2[0];
    }
    const result = await db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }
  async createClient(insertClient) {
    const result = await db.insert(clients).values({
      id: randomUUID(),
      ...insertClient
    }).returning();
    return result[0];
  }
  async updateClient(id, client, organizationId) {
    const result = await db.update(clients).set(client).where(
      and(
        eq(clients.id, id),
        eq(clients.organizationId, organizationId)
      )
    ).returning();
    return result[0];
  }
  async deleteClient(id, organizationId) {
    await db.delete(clients).where(
      and(
        eq(clients.id, id),
        eq(clients.organizationId, organizationId)
      )
    );
  }
  // ==================== APPLIANCES ====================
  async getAllAppliances(organizationId) {
    const result = await db.select({
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
      createdAt: appliances.createdAt
    }).from(appliances).innerJoin(clients, eq(appliances.clientId, clients.id)).where(eq(clients.organizationId, organizationId));
    return result;
  }
  async getAppliancesByClient(clientId, organizationId) {
    const result = await db.select({
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
      createdAt: appliances.createdAt
    }).from(appliances).innerJoin(clients, eq(appliances.clientId, clients.id)).where(
      and(
        eq(appliances.clientId, clientId),
        eq(clients.organizationId, organizationId)
      )
    );
    return result;
  }
  async getAppliance(id, organizationId) {
    if (organizationId) {
      const result2 = await db.select({
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
        createdAt: appliances.createdAt
      }).from(appliances).innerJoin(clients, eq(appliances.clientId, clients.id)).where(
        and(
          eq(appliances.id, id),
          eq(clients.organizationId, organizationId)
        )
      );
      return result2[0];
    }
    const result = await db.select().from(appliances).where(eq(appliances.id, id));
    return result[0];
  }
  async createAppliance(insertAppliance, organizationId) {
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
  async updateAppliance(id, appliance, organizationId) {
    const existing = await this.getAppliance(id, organizationId);
    if (!existing) {
      return void 0;
    }
    const result = await db.update(appliances).set(appliance).where(eq(appliances.id, id)).returning();
    return result[0];
  }
  async deleteAppliance(id, organizationId) {
    const existing = await this.getAppliance(id, organizationId);
    if (!existing) {
      return;
    }
    await db.delete(appliances).where(eq(appliances.id, id));
  }
  // ==================== TASKS ====================
  async getAllTasks(organizationId) {
    if (organizationId) {
      const result = await db.select({
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
        reportId: tasks.reportId
      }).from(tasks).innerJoin(clients, eq(tasks.clientId, clients.id)).where(eq(clients.organizationId, organizationId));
      return result;
    }
    return await db.select().from(tasks);
  }
  async getTask(id, organizationId) {
    if (organizationId) {
      const result2 = await db.select({
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
        reportId: tasks.reportId
      }).from(tasks).innerJoin(clients, eq(tasks.clientId, clients.id)).where(
        and(
          eq(tasks.id, id),
          eq(clients.organizationId, organizationId)
        )
      );
      return result2[0];
    }
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }
  async getTasksByStatus(status, organizationId) {
    const result = await db.select({
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
      reportId: tasks.reportId
    }).from(tasks).innerJoin(clients, eq(tasks.clientId, clients.id)).where(
      and(
        eq(tasks.status, status),
        eq(clients.organizationId, organizationId)
      )
    );
    return result;
  }
  async getTasksByClient(clientId, organizationId) {
    const result = await db.select({
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
      reportId: tasks.reportId
    }).from(tasks).innerJoin(clients, eq(tasks.clientId, clients.id)).where(
      and(
        eq(tasks.clientId, clientId),
        eq(clients.organizationId, organizationId)
      )
    );
    return result;
  }
  async getTasksByUser(userId, organizationId) {
    const result = await db.select({
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
      reportId: tasks.reportId
    }).from(tasks).innerJoin(clients, eq(tasks.clientId, clients.id)).where(
      and(
        eq(tasks.userId, userId),
        eq(clients.organizationId, organizationId)
      )
    );
    return result;
  }
  async getRecurringTasksDue(organizationId) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (organizationId) {
      const result = await db.select({
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
        reportId: tasks.reportId
      }).from(tasks).innerJoin(clients, eq(tasks.clientId, clients.id)).where(
        and(
          eq(tasks.taskType, "recurring"),
          lte(tasks.nextOccurrenceDate, today),
          eq(clients.organizationId, organizationId)
        )
      );
      return result;
    }
    return await db.select().from(tasks).where(
      and(
        eq(tasks.taskType, "recurring"),
        lte(tasks.nextOccurrenceDate, today)
      )
    );
  }
  async getTasksByParent(parentTaskId) {
    return await db.select().from(tasks).where(eq(tasks.parentTaskId, parentTaskId));
  }
  async createTask(insertTask) {
    const result = await db.insert(tasks).values({
      id: randomUUID(),
      ...insertTask
    }).returning();
    return result[0];
  }
  async updateTask(id, task) {
    const result = await db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return result[0];
  }
  async deleteTask(id) {
    await db.delete(tasks).where(eq(tasks.id, id));
  }
  async deleteTaskCascade(id) {
    const task = await this.getTask(id);
    if (!task) {
      return;
    }
    await db.transaction(async (tx) => {
      const tasksToDelete = [];
      const visited = /* @__PURE__ */ new Set();
      const MAX_DEPTH = 100;
      const rootParentId = id;
      async function collectNonCompletedDescendants(parentId, depth = 0) {
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
          sql`${tasks.id} IN (${sql.join(tasksToDelete.map((id2) => sql`${id2}`), sql`, `)})`
        );
      }
      if (task.status !== "completed") {
        await tx.delete(tasks).where(eq(tasks.id, id));
      }
    });
  }
  // ==================== REPORTS ====================
  async getAllReports(organizationId) {
    const result = await db.select({
      id: reports.id,
      taskId: reports.taskId,
      description: reports.description,
      sparePartsUsed: reports.sparePartsUsed,
      workDuration: reports.workDuration,
      photos: reports.photos,
      createdAt: reports.createdAt
    }).from(reports).innerJoin(tasks, eq(reports.taskId, tasks.id)).innerJoin(clients, eq(tasks.clientId, clients.id)).where(eq(clients.organizationId, organizationId));
    return result;
  }
  async getReport(id, organizationId) {
    if (organizationId) {
      const result2 = await db.select({
        id: reports.id,
        taskId: reports.taskId,
        description: reports.description,
        sparePartsUsed: reports.sparePartsUsed,
        workDuration: reports.workDuration,
        photos: reports.photos,
        createdAt: reports.createdAt
      }).from(reports).innerJoin(tasks, eq(reports.taskId, tasks.id)).innerJoin(clients, eq(tasks.clientId, clients.id)).where(
        and(
          eq(reports.id, id),
          eq(clients.organizationId, organizationId)
        )
      );
      return result2[0];
    }
    const result = await db.select().from(reports).where(eq(reports.id, id));
    return result[0];
  }
  async getReportsByTask(taskId) {
    return await db.select().from(reports).where(eq(reports.taskId, taskId));
  }
  async createReport(insertReport) {
    const result = await db.insert(reports).values({
      id: randomUUID(),
      ...insertReport
    }).returning();
    return result[0];
  }
  async updateReport(id, report) {
    const result = await db.update(reports).set(report).where(eq(reports.id, id)).returning();
    return result[0];
  }
  // ==================== DOCUMENTS ====================
  async getAllDocuments(organizationId) {
    return await db.select().from(documents).where(eq(documents.organizationId, organizationId));
  }
  async getDocument(id, organizationId) {
    const result = await db.select().from(documents).where(
      and(
        eq(documents.id, id),
        eq(documents.organizationId, organizationId)
      )
    );
    return result[0];
  }
  async createDocument(insertDocument) {
    const result = await db.insert(documents).values({
      id: randomUUID(),
      ...insertDocument
    }).returning();
    return result[0];
  }
  async deleteDocument(id, organizationId) {
    await db.delete(documents).where(
      and(
        eq(documents.id, id),
        eq(documents.organizationId, organizationId)
      )
    );
  }
  // ==================== SPARE PARTS ====================
  async getAllSpareParts(organizationId) {
    return await db.select().from(spareParts).where(eq(spareParts.organizationId, organizationId));
  }
  async getSparePart(id, organizationId) {
    const result = await db.select().from(spareParts).where(
      and(
        eq(spareParts.id, id),
        eq(spareParts.organizationId, organizationId)
      )
    );
    return result[0];
  }
  async createSparePart(insertSparePart) {
    const result = await db.insert(spareParts).values({
      id: randomUUID(),
      ...insertSparePart
    }).returning();
    return result[0];
  }
  async updateSparePart(id, sparePart, organizationId) {
    const result = await db.update(spareParts).set(sparePart).where(
      and(
        eq(spareParts.id, id),
        eq(spareParts.organizationId, organizationId)
      )
    ).returning();
    return result[0];
  }
  async deleteSparePart(id, organizationId) {
    await db.delete(spareParts).where(
      and(
        eq(spareParts.id, id),
        eq(spareParts.organizationId, organizationId)
      )
    );
  }
};
var storage = new DbStorage();

// server/recurringTasksService.ts
function calculateNextOccurrenceDate(baseDate, pattern, interval = 1) {
  if (pattern === "none") return null;
  const date2 = new Date(baseDate);
  switch (pattern) {
    case "weekly":
      date2.setDate(date2.getDate() + 7 * interval);
      break;
    case "monthly":
      date2.setMonth(date2.getMonth() + interval);
      break;
    case "quarterly":
      date2.setMonth(date2.getMonth() + 3 * interval);
      break;
    case "semi-annual":
      date2.setMonth(date2.getMonth() + 6 * interval);
      break;
    case "yearly":
      date2.setFullYear(date2.getFullYear() + interval);
      break;
    default:
      return null;
  }
  return date2.toISOString().split("T")[0];
}
async function generateUpcomingRecurringInstances(daysAhead = 30) {
  const allTasks = await storage.getAllTasks();
  const recurringParentTasks = allTasks.filter(
    (t) => t.taskType === "recurring" && t.recurrencePattern && t.recurrencePattern !== "none" && !t.isAutoGenerated
  );
  const newTasks = [];
  const today = /* @__PURE__ */ new Date();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + daysAhead);
  const horizonStr = horizon.toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];
  for (const parentTask of recurringParentTasks) {
    if (!parentTask.dueDate || !parentTask.recurrencePattern) continue;
    const existingInstances = allTasks.filter(
      (t) => t.parentTaskId === parentTask.id
    );
    const existingDueDates = new Set(
      existingInstances.map((t) => t.dueDate).filter((d) => d !== null)
    );
    let currentDate = parentTask.dueDate < todayStr ? todayStr : parentTask.dueDate;
    while (currentDate && currentDate <= horizonStr) {
      if (!existingDueDates.has(currentDate)) {
        const nextOccurrence = calculateNextOccurrenceDate(
          currentDate,
          parentTask.recurrencePattern,
          parentTask.recurrenceInterval || 1
        );
        const newTaskData = {
          clientId: parentTask.clientId,
          applianceId: parentTask.applianceId,
          userId: parentTask.userId,
          description: parentTask.description,
          status: "pending",
          priority: parentTask.priority,
          dueDate: currentDate,
          taskType: "recurring",
          recurrencePattern: parentTask.recurrencePattern,
          recurrenceInterval: parentTask.recurrenceInterval,
          parentTaskId: parentTask.id,
          isAutoGenerated: 1,
          nextOccurrenceDate: nextOccurrence
        };
        const newTask = await storage.createTask(newTaskData);
        newTasks.push(newTask);
        existingDueDates.add(currentDate);
      }
      const nextDate = calculateNextOccurrenceDate(
        currentDate,
        parentTask.recurrencePattern,
        parentTask.recurrenceInterval || 1
      );
      if (!nextDate || nextDate > horizonStr) break;
      currentDate = nextDate;
    }
  }
  return {
    generated: newTasks.length,
    tasks: newTasks
  };
}
async function generateRecurringTasks() {
  const tasksToRenew = await storage.getRecurringTasksDue();
  const newTasks = [];
  for (const task of tasksToRenew) {
    if (!task.nextOccurrenceDate || !task.recurrencePattern || task.recurrencePattern === "none") continue;
    if (task.isAutoGenerated && task.parentTaskId) {
      continue;
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (task.nextOccurrenceDate > today) continue;
    const nextDate = calculateNextOccurrenceDate(
      task.nextOccurrenceDate,
      task.recurrencePattern,
      task.recurrenceInterval || 1
    );
    const newTaskData = {
      clientId: task.clientId,
      applianceId: task.applianceId,
      userId: task.userId,
      description: task.description,
      status: "pending",
      priority: task.priority,
      dueDate: task.nextOccurrenceDate,
      taskType: "recurring",
      recurrencePattern: task.recurrencePattern,
      recurrenceInterval: task.recurrenceInterval,
      parentTaskId: task.parentTaskId || task.id,
      isAutoGenerated: 1,
      nextOccurrenceDate: nextDate
    };
    const newTask = await storage.createTask(newTaskData);
    newTasks.push(newTask);
    if (!task.parentTaskId) {
      await storage.updateTask(task.id, {
        nextOccurrenceDate: nextDate
      });
    }
  }
  return {
    generated: newTasks.length,
    tasks: newTasks
  };
}

// server/pdfGenerator.ts
import PDFDocument from "pdfkit";
async function fetchImageBuffer(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Failed to fetch image:", url, error);
    return null;
  }
}
async function generateReportPdf(reportId) {
  const report = await storage.getReport(reportId);
  if (!report) {
    throw new Error("Report not found");
  }
  const task = report.taskId ? await storage.getTask(report.taskId) : null;
  const client = task?.clientId ? await storage.getClient(task.clientId) : null;
  const appliance = task?.applianceId ? await storage.getAppliance(task.applianceId) : null;
  let technicianName;
  if (task?.userId) {
    const user = await storage.getUser(task.userId);
    technicianName = user?.fullName || user?.username;
  }
  const data = {
    taskDescription: task?.description || "N/A",
    clientName: client?.name || "N/A",
    clientAddress: client?.address || void 0,
    clientPhone: client?.contactPhone || void 0,
    applianceName: appliance ? [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(" - ") : void 0,
    applianceSerial: appliance?.serial || void 0,
    applianceLocation: appliance ? [appliance.city, appliance.building, appliance.room].filter(Boolean).join(" \u2022 ") : void 0,
    reportDescription: report.description,
    workDuration: report.workDuration || void 0,
    sparePartsUsed: report.sparePartsUsed || void 0,
    completedAt: task?.completedAt ? new Date(task.completedAt) : void 0,
    technicianName,
    photos: report.photos || void 0
  };
  return createPdf(data);
}
async function createPdf(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: "Servisni Izvje\u0161taj",
          Author: "Tehniko System"
        }
      });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;
      const primaryColor = "#1a365d";
      const accentColor = "#3182ce";
      const lightGray = "#f7fafc";
      const textGray = "#4a5568";
      doc.save();
      doc.fontSize(72).font("Helvetica-Bold").fillColor("#e2e8f0").opacity(0.15);
      doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] });
      doc.text("TEHNIKO", pageWidth / 2 - 150, pageHeight / 2 - 20);
      doc.restore();
      doc.rect(0, 0, pageWidth, 100).fill(primaryColor);
      doc.fontSize(24).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text("SERVISNI IZVJE\u0160TAJ", margin, 35, { align: "center", width: contentWidth });
      if (data.completedAt) {
        doc.fontSize(11).font("Helvetica").fillColor("#e2e8f0");
        doc.text(
          data.completedAt.toLocaleDateString("sr-Latn-RS", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }),
          margin,
          65,
          { align: "center", width: contentWidth }
        );
      }
      let yPos = 120;
      doc.rect(margin, yPos, contentWidth, 80).fill(lightGray).stroke("#e2e8f0");
      doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor);
      doc.text("KLIJENT", margin + 15, yPos + 12);
      doc.fontSize(10).font("Helvetica").fillColor(textGray);
      doc.text(data.clientName, margin + 15, yPos + 30);
      if (data.clientAddress) doc.text(data.clientAddress, margin + 15, yPos + 45);
      if (data.clientPhone) doc.text(`Tel: ${data.clientPhone}`, margin + 15, yPos + 60);
      yPos += 95;
      if (data.applianceName) {
        doc.rect(margin, yPos, contentWidth, 80).fill(lightGray).stroke("#e2e8f0");
        doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor);
        doc.text("URE\u0110AJ", margin + 15, yPos + 12);
        doc.fontSize(10).font("Helvetica").fillColor(textGray);
        doc.text(data.applianceName, margin + 15, yPos + 30);
        if (data.applianceSerial) doc.text(`S/N: ${data.applianceSerial}`, margin + 15, yPos + 45);
        if (data.applianceLocation) doc.text(`Lokacija: ${data.applianceLocation}`, margin + 15, yPos + 60);
        yPos += 95;
      }
      doc.rect(margin, yPos, contentWidth, 50).fill(accentColor);
      doc.fontSize(12).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text("ZADATAK", margin + 15, yPos + 12);
      doc.fontSize(10).font("Helvetica").fillColor("#ffffff");
      doc.text(data.taskDescription, margin + 15, yPos + 30, { width: contentWidth - 30 });
      yPos += 65;
      doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor);
      doc.text("IZVJE\u0160TAJ O RADU", margin, yPos);
      yPos += 20;
      doc.moveTo(margin, yPos).lineTo(margin + contentWidth, yPos).strokeColor(accentColor).lineWidth(2).stroke();
      yPos += 15;
      doc.fontSize(10).font("Helvetica").fillColor(textGray);
      if (data.reportDescription) {
        doc.text(data.reportDescription, margin, yPos, { width: contentWidth });
        yPos = doc.y + 15;
      }
      if (data.workDuration || data.sparePartsUsed) {
        doc.rect(margin, yPos, contentWidth, data.sparePartsUsed ? 50 : 30).fill(lightGray);
        if (data.workDuration) {
          doc.fontSize(10).font("Helvetica-Bold").fillColor(primaryColor);
          doc.text("Trajanje rada: ", margin + 15, yPos + 10, { continued: true });
          doc.font("Helvetica").fillColor(textGray);
          doc.text(`${data.workDuration} minuta`);
        }
        if (data.sparePartsUsed) {
          doc.fontSize(10).font("Helvetica-Bold").fillColor(primaryColor);
          doc.text("Utro\u0161eni dijelovi: ", margin + 15, yPos + (data.workDuration ? 30 : 10), { continued: true });
          doc.font("Helvetica").fillColor(textGray);
          doc.text(data.sparePartsUsed);
        }
        yPos += data.sparePartsUsed ? 60 : 40;
      }
      if (data.photos && data.photos.length > 0) {
        yPos += 10;
        doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor);
        doc.text("FOTOGRAFIJE", margin, yPos);
        yPos += 20;
        doc.moveTo(margin, yPos).lineTo(margin + contentWidth, yPos).strokeColor(accentColor).lineWidth(2).stroke();
        yPos += 15;
        const imageSize = 120;
        const imagesPerRow = 3;
        const spacing = (contentWidth - imageSize * imagesPerRow) / (imagesPerRow + 1);
        let currentRow = 0;
        let currentCol = 0;
        let photosBaseY = yPos;
        for (let i = 0; i < Math.min(data.photos.length, 6); i++) {
          const photoUrl = data.photos[i];
          const imageBuffer = await fetchImageBuffer(photoUrl);
          if (imageBuffer) {
            const xPos = margin + spacing + currentCol * (imageSize + spacing);
            let imgYPos = photosBaseY + currentRow * (imageSize + 10);
            if (imgYPos + imageSize > pageHeight - 100) {
              doc.addPage();
              photosBaseY = 50;
              currentRow = 0;
              imgYPos = photosBaseY;
            }
            try {
              doc.image(imageBuffer, xPos, imgYPos, {
                width: imageSize,
                height: imageSize,
                fit: [imageSize, imageSize],
                align: "center",
                valign: "center"
              });
              doc.rect(xPos, imgYPos, imageSize, imageSize).strokeColor("#e2e8f0").lineWidth(1).stroke();
            } catch (imgError) {
              console.error("Failed to add image to PDF:", imgError);
            }
            currentCol++;
            if (currentCol >= imagesPerRow) {
              currentCol = 0;
              currentRow++;
            }
          }
        }
        const totalRows = currentCol > 0 ? currentRow + 1 : currentRow;
        yPos = photosBaseY + totalRows * (imageSize + 10) + 10;
      }
      const signatureY = Math.max(yPos + 30, pageHeight - 150);
      if (signatureY > pageHeight - 100) {
        doc.addPage();
      }
      const finalY = signatureY > pageHeight - 100 ? 50 : signatureY;
      doc.moveTo(margin, finalY).lineTo(margin + 200, finalY).strokeColor(textGray).lineWidth(0.5).stroke();
      doc.fontSize(9).font("Helvetica").fillColor(textGray);
      if (data.technicianName) {
        doc.text(`Tehni\u010Dar: ${data.technicianName}`, margin, finalY + 5);
      } else {
        doc.text("Potpis tehni\u010Dara", margin, finalY + 5);
      }
      doc.moveTo(margin + 295, finalY).lineTo(margin + contentWidth, finalY).strokeColor(textGray).lineWidth(0.5).stroke();
      doc.text("Potpis klijenta", margin + 295, finalY + 5);
      doc.fontSize(8).font("Helvetica").fillColor("#a0aec0");
      doc.text(
        "Ovaj dokument je automatski generisan putem Tehniko System aplikacije.",
        margin,
        pageHeight - 40,
        { align: "center", width: contentWidth }
      );
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// server/routes.ts
import crypto from "crypto";
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}
function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    if (!salt || !key) {
      resolve(password === hash);
      return;
    }
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex") === key);
    });
  });
}
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}
function requireOrg(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.session.userRole === "super_admin" && !req.session.organizationId) {
    return res.status(400).json({ message: "Please select an organization" });
  }
  if (!req.session.organizationId && req.session.userRole !== "super_admin") {
    return res.status(403).json({ message: "No organization context" });
  }
  next();
}
function requireOrgAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.session.userRole !== "org_admin" && req.session.userRole !== "super_admin") {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  next();
}
function requireSuperAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.session.userRole !== "super_admin") {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
}
async function registerRoutes(app2) {
  app2.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      req.session.userRole = user.userRole || "technician";
      req.session.organizationId = user.organizationId || void 0;
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
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/user/me", async (req, res) => {
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
  app2.get("/api/organizations", requireSuperAdmin, async (req, res) => {
    const organizations2 = await storage.getAllOrganizations();
    res.json(organizations2);
  });
  app2.get("/api/organizations/:id", requireAuth, async (req, res) => {
    if (req.session.userRole !== "super_admin" && req.session.organizationId !== req.params.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    const org = await storage.getOrganization(req.params.id);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    res.json(org);
  });
  app2.post("/api/organizations", requireSuperAdmin, async (req, res) => {
    try {
      const { organization, admin } = req.body;
      if (organization) {
        if (!organization.name) {
          return res.status(400).json({ message: "Naziv organizacije je obavezan" });
        }
        const orgData = {
          name: organization.name,
          address: organization.address || null,
          contactEmail: organization.contactEmail || null,
          contactPhone: organization.contactPhone || null,
          pib: organization.pib || null,
          pdv: organization.pdv || null
        };
        const org = await storage.createOrganization(orgData);
        if (admin && admin.username && admin.password && admin.fullName) {
          const passwordHash = await hashPassword(admin.password);
          const adminData = {
            username: admin.username,
            passwordHash,
            fullName: admin.fullName,
            email: admin.email || null,
            userRole: "org_admin",
            organizationId: org.id
          };
          await storage.createUser(adminData);
        }
        res.status(201).json(org);
      } else {
        const validatedData = insertOrganizationSchema.parse(req.body);
        const org = await storage.createOrganization(validatedData);
        res.status(201).json(org);
      }
    } catch (error) {
      console.error("Create organization error:", error);
      res.status(400).json({ message: error.message || "Gre\u0161ka pri kreiranju organizacije" });
    }
  });
  app2.patch("/api/organizations/:id", requireSuperAdmin, async (req, res) => {
    const org = await storage.updateOrganization(req.params.id, req.body);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    res.json(org);
  });
  app2.delete("/api/organizations/:id", requireSuperAdmin, async (req, res) => {
    await storage.deleteOrganization(req.params.id);
    res.status(204).send();
  });
  app2.post("/api/organizations/:id/switch", requireSuperAdmin, async (req, res) => {
    const org = await storage.getOrganization(req.params.id);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    req.session.organizationId = org.id;
    res.json({ message: "Switched to organization", organization: org });
  });
  app2.get("/api/technicians", requireOrg, async (req, res) => {
    const users = await storage.getAllUsers(req.session.organizationId);
    const assignableUsers = users.filter((u) => u.userRole !== "super_admin");
    res.json(assignableUsers);
  });
  app2.get("/api/users", requireOrgAdmin, async (req, res) => {
    if (req.session.userRole === "super_admin") {
      const orgId = req.query.organizationId || req.session.organizationId;
      const users = await storage.getAllUsers(orgId);
      res.json(users);
    } else {
      const users = await storage.getAllUsers(req.session.organizationId);
      const filteredUsers = users.filter((u) => u.userRole !== "super_admin");
      res.json(filteredUsers);
    }
  });
  app2.get("/api/users/:id", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (req.session.userRole !== "super_admin") {
      if (user.organizationId !== req.session.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    res.json(user);
  });
  app2.post("/api/users", requireOrgAdmin, async (req, res) => {
    try {
      const { username, password, fullName, email, userRole } = req.body;
      if (userRole === "super_admin" && req.session.userRole !== "super_admin") {
        return res.status(403).json({ message: "Cannot create super_admin users" });
      }
      let organizationId = req.body.organizationId;
      if (req.session.userRole !== "super_admin") {
        organizationId = req.session.organizationId;
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        passwordHash: hashedPassword,
        fullName,
        email,
        userRole: userRole || "technician",
        organizationId
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.patch("/api/users/:id", requireOrgAdmin, async (req, res) => {
    const existingUser = await storage.getUser(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (req.session.userRole !== "super_admin") {
      if (existingUser.organizationId !== req.session.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (req.body.organizationId && req.body.organizationId !== req.session.organizationId) {
        return res.status(403).json({ message: "Cannot change user's organization" });
      }
      if (req.body.userRole === "super_admin") {
        return res.status(403).json({ message: "Cannot promote to super_admin" });
      }
    }
    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.passwordHash = await hashPassword(updateData.password);
      delete updateData.password;
    }
    const user = await storage.updateUser(req.params.id, updateData);
    res.json(user);
  });
  app2.delete("/api/users/:id", requireOrgAdmin, async (req, res) => {
    const existingUser = await storage.getUser(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (req.session.userRole !== "super_admin") {
      if (existingUser.organizationId !== req.session.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    if (existingUser.id === req.session.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    await storage.deleteUser(req.params.id);
    res.status(204).send();
  });
  app2.get("/api/clients", requireOrg, async (req, res) => {
    const clients2 = await storage.getAllClients(req.session.organizationId);
    res.json(clients2);
  });
  app2.get("/api/clients/:id", requireOrg, async (req, res) => {
    const client = await storage.getClient(req.params.id, req.session.organizationId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  });
  app2.post("/api/clients", requireOrg, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse({
        ...req.body,
        organizationId: req.session.organizationId
      });
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.patch("/api/clients/:id", requireOrg, async (req, res) => {
    const client = await storage.updateClient(req.params.id, req.body, req.session.organizationId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  });
  app2.delete("/api/clients/:id", requireOrg, async (req, res) => {
    await storage.deleteClient(req.params.id, req.session.organizationId);
    res.status(204).send();
  });
  app2.get("/api/appliances", requireOrg, async (req, res) => {
    const { clientId } = req.query;
    if (clientId) {
      const appliances3 = await storage.getAppliancesByClient(clientId, req.session.organizationId);
      return res.json(appliances3);
    }
    const appliances2 = await storage.getAllAppliances(req.session.organizationId);
    res.json(appliances2);
  });
  app2.get("/api/appliances/:id", requireOrg, async (req, res) => {
    const appliance = await storage.getAppliance(req.params.id, req.session.organizationId);
    if (!appliance) {
      return res.status(404).json({ message: "Appliance not found" });
    }
    res.json(appliance);
  });
  app2.post("/api/appliances", requireOrg, async (req, res) => {
    try {
      const validatedData = insertApplianceSchema.parse(req.body);
      const appliance = await storage.createAppliance(validatedData, req.session.organizationId);
      res.status(201).json(appliance);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.patch("/api/appliances/:id", requireOrg, async (req, res) => {
    const appliance = await storage.updateAppliance(req.params.id, req.body, req.session.organizationId);
    if (!appliance) {
      return res.status(404).json({ message: "Appliance not found" });
    }
    res.json(appliance);
  });
  app2.delete("/api/appliances/:id", requireOrg, async (req, res) => {
    await storage.deleteAppliance(req.params.id, req.session.organizationId);
    res.status(204).send();
  });
  app2.get("/api/tasks", requireOrg, async (req, res) => {
    const { status, clientId, userId } = req.query;
    if (status) {
      const tasks3 = await storage.getTasksByStatus(status, req.session.organizationId);
      return res.json(tasks3);
    }
    if (clientId) {
      const tasks3 = await storage.getTasksByClient(clientId, req.session.organizationId);
      return res.json(tasks3);
    }
    if (userId) {
      const tasks3 = await storage.getTasksByUser(userId, req.session.organizationId);
      return res.json(tasks3);
    }
    const tasks2 = await storage.getAllTasks(req.session.organizationId);
    res.json(tasks2);
  });
  app2.get("/api/tasks/:id", requireOrg, async (req, res) => {
    const task = await storage.getTask(req.params.id, req.session.organizationId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  });
  app2.post("/api/tasks", requireOrg, async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      if (validatedData.taskType === "recurring" && validatedData.dueDate && validatedData.recurrencePattern && validatedData.recurrencePattern !== "none") {
        validatedData.nextOccurrenceDate = calculateNextOccurrenceDate(
          validatedData.dueDate,
          validatedData.recurrencePattern,
          validatedData.recurrenceInterval || 1
        );
      }
      const task = await storage.createTask(validatedData);
      if (task.taskType === "recurring" && task.recurrencePattern && task.recurrencePattern !== "none") {
        await generateUpcomingRecurringInstances(90);
      }
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.patch("/api/tasks/:id", requireOrg, async (req, res) => {
    try {
      const existingTask = await storage.getTask(req.params.id, req.session.organizationId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      const updateData = { ...req.body };
      if (updateData.completedAt && typeof updateData.completedAt === "string") {
        updateData.completedAt = new Date(updateData.completedAt);
      }
      const task = await storage.updateTask(req.params.id, updateData);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: error.message || "Failed to update task" });
    }
  });
  app2.delete("/api/tasks/:id", requireOrg, async (req, res) => {
    const task = await storage.getTask(req.params.id, req.session.organizationId);
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
  app2.delete("/api/tasks/:id/recurring", requireOrg, async (req, res) => {
    const task = await storage.getTask(req.params.id, req.session.organizationId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    await storage.deleteTaskCascade(req.params.id);
    res.status(204).send();
  });
  app2.get("/api/tasks/recurring/due", requireOrg, async (req, res) => {
    const tasks2 = await storage.getRecurringTasksDue(req.session.organizationId);
    res.json(tasks2);
  });
  app2.post("/api/tasks/recurring/generate-upcoming", requireOrg, async (req, res) => {
    try {
      const daysAhead = req.body?.daysAhead || 90;
      const result = await generateUpcomingRecurringInstances(daysAhead);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/tasks/recurring/generate", requireOrg, async (req, res) => {
    try {
      const result = await generateRecurringTasks();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/reports", requireOrg, async (req, res) => {
    const reports2 = await storage.getAllReports(req.session.organizationId);
    res.json(reports2);
  });
  app2.get("/api/reports/with-details", requireOrg, async (req, res) => {
    const reports2 = await storage.getAllReports(req.session.organizationId);
    const tasks2 = await storage.getAllTasks(req.session.organizationId);
    const clients2 = await storage.getAllClients(req.session.organizationId);
    const appliances2 = await storage.getAllAppliances(req.session.organizationId);
    const reportsWithDetails = reports2.map((report) => {
      const task = tasks2.find((t) => t.id === report.taskId);
      const client = task ? clients2.find((c) => c.id === task.clientId) : null;
      const appliance = task?.applianceId ? appliances2.find((a) => a.id === task.applianceId) : null;
      const applianceName = appliance ? [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(" - ") : "Unknown appliance";
      return {
        ...report,
        clientName: client?.name || "Unknown client",
        applianceName,
        taskDescription: task?.description || "N/A"
      };
    });
    res.json(reportsWithDetails);
  });
  app2.get("/api/reports/:id", requireOrg, async (req, res) => {
    const report = await storage.getReport(req.params.id, req.session.organizationId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json(report);
  });
  app2.get("/api/reports/:id/pdf", requireOrg, async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id, req.session.organizationId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      const pdfBuffer = await generateReportPdf(req.params.id);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="izvjestaj-${req.params.id}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      if (error.message === "Report not found") {
        return res.status(404).json({ message: "Report not found" });
      }
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });
  app2.get("/api/tasks/:taskId/reports", requireOrg, async (req, res) => {
    const task = await storage.getTask(req.params.taskId, req.session.organizationId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const reports2 = await storage.getReportsByTask(req.params.taskId);
    res.json(reports2);
  });
  app2.post("/api/reports", requireOrg, async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const task = await storage.getTask(validatedData.taskId, req.session.organizationId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      const report = await storage.createReport(validatedData);
      if (validatedData.taskId) {
        const completedTask = await storage.getTask(validatedData.taskId);
        await storage.updateTask(validatedData.taskId, { status: "completed" });
        if (completedTask && completedTask.taskType === "recurring" && completedTask.nextOccurrenceDate && completedTask.recurrencePattern && completedTask.recurrencePattern !== "none") {
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
            status: "pending",
            priority: completedTask.priority,
            dueDate: nextOccurrenceDate,
            taskType: "recurring",
            recurrencePattern: completedTask.recurrencePattern,
            recurrenceInterval: completedTask.recurrenceInterval,
            parentTaskId: parentId,
            isAutoGenerated: 1,
            nextOccurrenceDate: futureOccurrence
          };
          await storage.createTask(nextTaskData);
        }
      }
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.patch("/api/reports/:id", requireOrg, async (req, res) => {
    try {
      const existingReport = await storage.getReport(req.params.id, req.session.organizationId);
      if (!existingReport) {
        return res.status(404).json({ message: "Report not found" });
      }
      const report = await storage.updateReport(req.params.id, req.body);
      res.json(report);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/documents", requireOrg, async (req, res) => {
    const documents2 = await storage.getAllDocuments(req.session.organizationId);
    res.json(documents2);
  });
  app2.get("/api/documents/:id", requireOrg, async (req, res) => {
    const document = await storage.getDocument(req.params.id, req.session.organizationId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(document);
  });
  app2.post("/api/documents", requireOrg, async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        organizationId: req.session.organizationId
      });
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/documents/:id", requireOrg, async (req, res) => {
    await storage.deleteDocument(req.params.id, req.session.organizationId);
    res.status(204).send();
  });
  app2.get("/api/spare-parts", requireOrg, async (req, res) => {
    const spareParts2 = await storage.getAllSpareParts(req.session.organizationId);
    res.json(spareParts2);
  });
  app2.get("/api/spare-parts/:id", requireOrg, async (req, res) => {
    const sparePart = await storage.getSparePart(req.params.id, req.session.organizationId);
    if (!sparePart) {
      return res.status(404).json({ message: "Spare part not found" });
    }
    res.json(sparePart);
  });
  app2.post("/api/spare-parts", requireOrg, async (req, res) => {
    try {
      const validatedData = insertSparePartSchema.parse({
        ...req.body,
        organizationId: req.session.organizationId
      });
      const sparePart = await storage.createSparePart(validatedData);
      res.status(201).json(sparePart);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.patch("/api/spare-parts/:id", requireOrg, async (req, res) => {
    const sparePart = await storage.updateSparePart(req.params.id, req.body, req.session.organizationId);
    if (!sparePart) {
      return res.status(404).json({ message: "Spare part not found" });
    }
    res.json(sparePart);
  });
  app2.delete("/api/spare-parts/:id", requireOrg, async (req, res) => {
    await storage.deleteSparePart(req.params.id, req.session.organizationId);
    res.status(204).send();
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// api/index.ts
var app = express();
app.set("trust proxy", 1);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || origin.includes("vercel.app") || origin.includes("localhost")) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
var PgStore = pgSession(session);
var pool2 = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
app.use(session({
  store: new PgStore({
    pool: pool2,
    tableName: "session",
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 1e3 * 60 * 60 * 24 * 7
    // 7 days
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
var routesRegistered = false;
var routePromise = null;
async function ensureRoutes() {
  if (routesRegistered) return;
  if (routePromise) return routePromise;
  routePromise = (async () => {
    await registerRoutes(app);
    routesRegistered = true;
  })();
  return routePromise;
}
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});
async function handler(req, res) {
  await ensureRoutes();
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(void 0);
      }
    });
  });
}
export {
  handler as default
};
