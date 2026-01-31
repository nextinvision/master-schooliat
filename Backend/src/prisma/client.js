import { PrismaClient } from "./generated/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import config from "../config.js";

const { Pool } = pg;

// Configure connection pool for Supabase
// Supabase recommends connection pooling for better performance
// Remove quotes from connection string if present
const connectionString = config.DATABASE_URL?.replace(/^["']|["']$/g, "").trim() || config.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  // Supabase connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: config.ENVIRONMENT === "development" ? ["query", "error", "warn"] : ["error"],
});

export default prisma;
