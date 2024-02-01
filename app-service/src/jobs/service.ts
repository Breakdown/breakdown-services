import { Queue, ConnectionOptions } from "bullmq";
import dbClient from "../utils/prisma.js";
import { Bill } from "@prisma/client";

class JobService {
  queue: Queue;
  redisConnection: ConnectionOptions;
  constructor() {
    this.queue = new Queue("app-service-queue");
    this.redisConnection = {
      host: process.env.REDIS_HOST || "redis",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    };
  }

  async queueRepsSyncScheduled() {
    // Add repsSync job to queue
    // Repeat every 12 hours at 03:00 and 15:00
    this.queue.add("reps-sync", {}, { repeat: { pattern: "0 3,15 * * *" } });
  }

  async queueBillsSyncScheduled() {
    // Add billsSync job to queue
    // Repeat every 12 hours at 06:00 and 18:00
    this.queue.add("bills-sync", {}, { repeat: { pattern: "0 6,18 * * *" } });
  }

  async queueBillFullTextsScheduled() {
    const pivotDate = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const allBillsWhereNecessary = await dbClient.bill.findMany({
      where: {
        OR: [
          {
            // Full text does not exist
            fullText: {
              is: null,
            },
          },
          {
            // Or, full text has not been synced in the last 3 days
            // And updatedAt is less than 3 days ago
            AND: [
              {
                jobData: {
                  // Greater than 3 days ago
                  lastFullTextSync: {
                    lt: pivotDate,
                  },
                },
              },
              {
                // Updated less than 3 days ago
                updatedAt: {
                  gt: pivotDate,
                },
              },
            ],
          },
        ],
      },
    });
    const allBillIds = allBillsWhereNecessary.map((bill: Bill) => bill.id);
    // Queue a billFullText job for each bill
    for (const billId of allBillIds) {
      this.queue.add("bill-full-text", { billId });
    }
  }

  async queueMeilisearchSyncScheduled() {
    // TODO: Meilisearch connection and syncing here
  }

  async startJobRunners() {
    // Schedule repsSync and billsSync
    await this.queueRepsSyncScheduled();
    await this.queueBillsSyncScheduled();
    // Schedule billFullText runs
    await this.queueBillFullTextsScheduled();
  }
}

export default JobService;
