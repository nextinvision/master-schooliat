/**
 * Test script to verify Docker services connectivity
 * Run with: node test-docker-services.js
 */

import pg from "pg";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import config from "./src/config.js";
import { createClient } from "redis";

const { Pool } = pg;

const results = {
  postgres: { status: "pending", message: "" },
  redis: { status: "pending", message: "" },
  minio: { status: "pending", message: "" },
};

// Test PostgreSQL
async function testPostgreSQL() {
  try {
    const pool = new Pool({
      connectionString: config.DATABASE_URL,
    });
    const client = await pool.connect();
    const result = await client.query("SELECT version(), current_database()");
    await client.release();
    await pool.end();
    results.postgres = {
      status: "success",
      message: `Connected to ${result.rows[0].current_database} - PostgreSQL ${result.rows[0].version.split(" ")[1]}`,
    };
  } catch (error) {
    results.postgres = {
      status: "error",
      message: error.message,
    };
  }
}

// Test Redis
async function testRedis() {
  try {
    const client = createClient({
      socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
      },
      password: config.REDIS_PASSWORD,
      database: config.REDIS_DB,
    });

    await client.connect();
    const pong = await client.ping();
    await client.quit();

    if (pong === "PONG") {
      results.redis = {
        status: "success",
        message: `Connected to Redis at ${config.REDIS_HOST}:${config.REDIS_PORT}`,
      };
    } else {
      results.redis = {
        status: "error",
        message: "Unexpected response from Redis",
      };
    }
  } catch (error) {
    results.redis = {
      status: "error",
      message: error.message,
    };
  }
}

// Test MinIO
async function testMinIO() {
  try {
    const s3Config = {
      region: config.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      },
    };

    if (config.MINIO_ENDPOINT) {
      s3Config.endpoint = config.MINIO_ENDPOINT;
      s3Config.forcePathStyle = config.MINIO_FORCE_PATH_STYLE !== false;
    }

    const s3 = new S3Client(s3Config);
    const command = new ListBucketsCommand({});
    const response = await s3.send(command);

    if (response.Buckets && response.Buckets.length > 0) {
      const bucketNames = response.Buckets.map((b) => b.Name).join(", ");
      results.minio = {
        status: "success",
        message: `Connected to ${config.MINIO_ENDPOINT || "AWS S3"} - Buckets: ${bucketNames}`,
      };
    } else {
      results.minio = {
        status: "warning",
        message: "Connected but no buckets found",
      };
    }
  } catch (error) {
    results.minio = {
      status: "error",
      message: error.message,
    };
  }
}

// Run all tests
async function runTests() {
  console.log("=".repeat(60));
  console.log("Testing Docker Services Connectivity");
  console.log("=".repeat(60));
  console.log("");

  console.log("Configuration:");
  console.log(`  Database: ${config.DATABASE_URL?.split("@")[1] || "Not set"}`);
  console.log(`  Redis: ${config.REDIS_HOST}:${config.REDIS_PORT}`);
  console.log(`  File Storage: ${config.FILE_STORAGE}`);
  console.log(`  MinIO Endpoint: ${config.MINIO_ENDPOINT || "Not set"}`);
  console.log("");

  await Promise.all([testPostgreSQL(), testRedis(), testMinIO()]);

  // Display results
  console.log("Results:");
  console.log("-".repeat(60));

  const statusColors = {
    success: "\x1b[32m✓\x1b[0m",
    error: "\x1b[31m✗\x1b[0m",
    warning: "\x1b[33m⚠\x1b[0m",
    pending: "\x1b[33m?\x1b[0m",
  };

  for (const [service, result] of Object.entries(results)) {
    const icon = statusColors[result.status] || "?";
    console.log(`${icon} ${service.toUpperCase().padEnd(10)} ${result.message}`);
  }

  console.log("-".repeat(60));

  const allSuccess = Object.values(results).every((r) => r.status === "success");
  if (allSuccess) {
    console.log("\n✅ All services are connected and working!");
    process.exit(0);
  } else {
    console.log("\n❌ Some services failed. Please check the errors above.");
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

