import { Meilisearch } from "meilisearch";
import InternalError from "../utils/errors/InternalError.js";
import { Bill, Issue, Representative } from "@prisma/client";
import dbClient from "../utils/prisma.js";

export enum MeiliSearchIndex {
  BILLS = "bills",
  REPRESENTATIVES = "representatives",
  ISSUES = "issues",
}

export interface MeilisearchBill {
  id: string;
  title: string | null;
  short_title: string | null;
  summary: string | null;
  short_summary: string | null;
  human_short_summary: string | null;
  ai_summary: string | null;
  ai_short_summary: string | null;
  sponsor_name: string | null;
  primary_issue: string | null;
  issues: string[] | null;
}

export interface MeilisearchRep {
  firstName: string | null;
  lastName: string | null;
  district: string | null;
  state: string | null;
  party: string | null;
  title: string | null;
  short_title: string | null;
}

export interface MeilisearchIssue {
  id: string;
  name: string;
}

class MeilisearchService {
  client: Meilisearch;
  constructor() {
    if (!process.env.MEILI_HOST || !process.env.MEILI_MASTER_KEY) {
      throw new InternalError("Meilisearch host and master key are required");
    }
    this.client = new Meilisearch({
      host: process.env.MEILI_HOST,
      apiKey: process.env.MEILI_MASTER_KEY,
    });
  }

  transformDbBillToMeiliBill(
    bill: Bill & {
      sponsor: Representative | null;
      issues: Issue[] | null;
      primaryIssue: Issue | null;
    }
  ): MeilisearchBill {
    return {
      id: bill.id,
      title: bill.title,
      short_title: bill.shortTitle,
      summary: bill.summary,
      short_summary: bill.summaryShort,
      human_short_summary: bill.humanShortSummary,
      ai_summary: bill.aiSummary,
      ai_short_summary: bill.aiShortSummary,
      sponsor_name: bill.sponsor
        ? `${bill.sponsor.firstName} ${bill.sponsor.lastName}`
        : null,
      issues: bill.issues?.map((issue: Issue) => issue.name) || null,
      primary_issue: bill.primaryIssue?.name || null,
    };
  }

  transformDbRepToMeiliRep(rep: Representative): MeilisearchRep {
    return {
      firstName: rep.firstName,
      lastName: rep.lastName,
      district: rep.district,
      state: rep.state,
      party: rep.party,
      title: rep.title,
      short_title: rep.shortTitle,
    };
  }

  transformDbIssueToMeiliIssue(issue: Issue): MeilisearchIssue {
    return {
      id: issue.id,
      name: issue.name,
    };
  }

  async createIndex(indexName: string) {
    try {
      return await this.client.createIndex(indexName);
    } catch (error) {
      throw new InternalError((error as Error).message);
    }
  }

  async upsertBills(bills: MeilisearchBill[]) {
    try {
      return await this.client
        .index(MeiliSearchIndex.BILLS)
        .addDocuments(bills);
    } catch (error) {
      throw new InternalError((error as Error).message);
    }
  }

  async upsertRepresentatives(representatives: MeilisearchRep[]) {
    try {
      return await this.client
        .index(MeiliSearchIndex.REPRESENTATIVES)
        .addDocuments(representatives);
    } catch (error) {
      throw new InternalError((error as Error).message);
    }
  }

  async upsertIssues(issues: MeilisearchIssue[]) {
    try {
      return await this.client
        .index(MeiliSearchIndex.ISSUES)
        .addDocuments(issues);
    } catch (error) {
      throw new InternalError((error as Error).message);
    }
  }

  async search(query: string) {
    try {
      const response = await this.client.multiSearch({
        queries: [
          {
            indexUid: MeiliSearchIndex.BILLS,
            q: query,
          },
          {
            indexUid: MeiliSearchIndex.REPRESENTATIVES,
            q: query,
          },
          {
            indexUid: MeiliSearchIndex.ISSUES,
            q: query,
          },
        ],
      });
    } catch (error) {
      throw new InternalError((error as Error).message);
    }
  }

  async globalSync() {
    // All bills
    const allBills = await dbClient.bill.findMany({
      include: {
        sponsor: true,
        issues: true,
        primaryIssue: true,
      },
    });
    // All issues
    const allIssues = await dbClient.issue.findMany();
    // All representatives
    const allReps = await dbClient.representative.findMany();

    // Format bills
    const meiliBills = allBills.map(this.transformDbBillToMeiliBill);
    // Format issues
    const meiliIssues = allIssues.map(this.transformDbIssueToMeiliIssue);
    // Format reps
    const meiliReps = allReps.map(this.transformDbRepToMeiliRep);

    // Create indices
    await this.createIndex(MeiliSearchIndex.BILLS);
    await this.createIndex(MeiliSearchIndex.REPRESENTATIVES);
    await this.createIndex(MeiliSearchIndex.ISSUES);

    // Upsert bills
    await this.upsertBills(meiliBills);
    // Upsert issues
    await this.upsertIssues(meiliIssues);
    // Upsert reps
    await this.upsertRepresentatives(meiliReps);

    return;
  }
}

export default MeilisearchService;
