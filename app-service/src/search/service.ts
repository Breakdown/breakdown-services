import { Meilisearch } from "meilisearch";
import InternalError from "../utils/errors/InternalError.js";
import { Bill, Issue, Representative } from "@prisma/client";
import dbClient from "../utils/prisma.js";
import stateCodes from "../seed/data/stateCodes.json" assert { type: "json" };

export enum MeiliSearchIndex {
  BILLS = "bills",
  REPRESENTATIVES = "reps",
  ISSUES = "issues",
}

export interface MeilisearchBill {
  id: string | null;
  title: string | null;
  shortTitle: string | null;
  summary: string | null;
  shortSummary: string | null;
  humanShortSummary: string | null;
  aiSummary: string | null;
  aiShortSummary: string | null;
  sponsorName: string | null;
  primaryIssue: string | null;
  issues: string[] | null;
}

export interface MeilisearchRep {
  firstName: string | null;
  lastName: string | null;
  district: string | null;
  state: string | null;
  party: string | null;
  title: string | null;
  shortTitle: string | null;
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

  getStateNameFromStateCode = (stateCode: string): string => {
    const stateName = stateCodes[stateCode as keyof typeof stateCodes];
    return stateName || stateCode;
  };

  getPartyNameFromPartyCode = (partyCode: string): string => {
    switch (partyCode) {
      case "D":
        return "Democrat";
      case "R":
        return "Republican";
      case "ID":
        return "Independent";
      default:
        return partyCode;
    }
  };

  transformDbBillToMeiliBill = (
    bill: Bill & {
      sponsor: Representative | null;
      issues: Issue[] | null;
      primaryIssue: Issue | null;
    }
  ): MeilisearchBill => {
    return {
      id: bill.id,
      title: bill.title,
      shortTitle: bill.shortTitle,
      summary: bill.summary,
      shortSummary: bill.summaryShort,
      humanShortSummary: bill.humanShortSummary,
      aiSummary: bill.aiSummary,
      aiShortSummary: bill.aiShortSummary,
      sponsorName: bill.sponsor
        ? `${bill.sponsor.firstName} ${bill.sponsor.lastName}`
        : null,
      issues: bill.issues?.map((issue: Issue) => issue.name) || null,
      primaryIssue: bill.primaryIssue?.name || null,
    };
  };

  transformDbRepToMeiliRep = (rep: Representative): MeilisearchRep => {
    return {
      firstName: rep.firstName,
      lastName: rep.lastName,
      district: rep.district,
      state: rep.state ? this.getStateNameFromStateCode(rep.state) : null,
      party: rep.party ? this.getPartyNameFromPartyCode(rep.party) : null,
      title: rep.title,
      shortTitle: rep.shortTitle,
    };
  };

  transformDbIssueToMeiliIssue = (issue: Issue): MeilisearchIssue => {
    return {
      id: issue.id,
      name: issue.name,
    };
  };

  createIndex = async (indexName: string) => {
    try {
      return await this.client.createIndex(indexName);
    } catch (error) {
      throw new InternalError((error as Error).message);
    }
  };

  addDocsToIndex = async (
    index: MeiliSearchIndex,
    documents: (MeilisearchRep | MeilisearchBill | MeilisearchIssue)[]
  ) => {
    try {
      const response = await this.client.index(index).addDocuments(documents);
      console.log("res", response);
      return response;
    } catch (error) {
      throw new InternalError((error as Error).message);
    }
  };

  search = async (query: string) => {
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
      return response;
    } catch (error) {
      throw new InternalError((error as Error).message);
    }
  };

  globalSync = async () => {
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

    // TODO: Add searchable attributes (ordered by priority)

    // Upsert bills
    await this.addDocsToIndex(MeiliSearchIndex.BILLS, meiliBills);
    // Upsert issues
    await this.addDocsToIndex(MeiliSearchIndex.ISSUES, meiliIssues);
    // Upsert reps
    await this.addDocsToIndex(MeiliSearchIndex.REPRESENTATIVES, meiliReps);

    return;
  };
}

export default MeilisearchService;
