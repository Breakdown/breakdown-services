import { Queue, ConnectionOptions, Worker } from "bullmq";
import dbClient from "../utils/prisma.js";
import { Bill, Prisma, Representative } from "@prisma/client";
import PropublicaService from "../propublica/service.js";
import { ProPublicaBill, PropublicaMember } from "../propublica/types.js";

class JobService {
  queue: Queue;
  redisConnection: ConnectionOptions;
  constructor() {
    this.redisConnection = {
      host: process.env.REDIS_HOST || "redis",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    };
    this.queue = new Queue("app-service-queue", {
      connection: this.redisConnection,
    });
  }

  async queueRepsSyncScheduled() {
    // Add repsSync job to queue
    // Repeat every 12 hours at 03:00 and 15:00
    this.queue.add(
      "reps-sync-scheduled",
      {},
      { repeat: { pattern: "0 3,15 * * *" } }
    );
  }

  async queueBillsSyncScheduled() {
    // Add billsSync job to queue
    // Repeat every 12 hours at 06:00 and 18:00
    this.queue.add(
      "bills-sync-scheduled",
      {},
      { repeat: { pattern: "0 6,18 * * *" } }
    );
  }

  async queueBillFullTextsScheduled() {
    const pivotDate = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const allBillsWhereNecessary = await dbClient.bill.findMany({
      where: {
        OR: [
          {
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
                // Full text does not exist
                fullText: {
                  is: null,
                },
              },
            ],
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

  async queueBillSummariesScheduled() {
    const allBillsWhereNecessary = await dbClient.bill.findMany({
      where: {
        AND: [
          // AI Summary does not exist
          { aiSummary: null },
          // And full text is not null
          {
            fullText: {
              isNot: null,
            },
          },
        ],
      },
    });
    const allBillIds = allBillsWhereNecessary.map((bill: Bill) => bill.id);
    // Queue a billFullText job for each bill
    for (const billId of allBillIds) {
      this.queue.add("bill-summary", { billId });
    }
  }

  async queueMeilisearchSyncScheduled() {
    // TODO: Meilisearch connection and syncing here
  }

  transformPropublicaMemberToDbRep(
    member: PropublicaMember
  ): Partial<Representative> {
    const houseValue = member.short_title === "Sen." ? "senate" : "house";
    return {
      title: member.title,
      shortTitle: member.short_title,
      apiUri: member.api_uri,
      firstName: member.first_name,
      middleName: member.middle_name,
      lastName: member.last_name,
      suffix: member.suffix,
      dateOfBirth: member.date_of_birth
        ? new Date(member.date_of_birth)
        : undefined,
      gender: member.gender,
      party: member.party,
      propublicaId: member.id,
      twitter: member.twitter_account,
      facebook: member.facebook_account,
      govtrackId: member.id,
      cspanId: member.cspan_id,
      votesmartId: member.votesmart_id,
      icpsrId: member.icpsr_id,
      crpId: member.crp_id,
      googleEntityId: member.google_entity_id,
      fecCandidateId: member.fec_candidate_id,
      url: member.url,
      rssUrl: member.rss_url,
      contactForm: member.contact_form,
      inOffice: member.in_office,
      cookPvi: member.cook_pvi, // Not filling - not in the API response? Or mismapped?
      dwNominate: member.dw_nominate,
      seniority: member.seniority,
      nextElection: member.next_election
        ? new Date(member.next_election)
        : undefined,
      totalVotes: member.total_votes,
      missedVotes: member.missed_votes,
      totalPresent: member.total_present,
      lastUpdated: member.last_updated
        ? new Date(member.last_updated)
        : undefined,
      ocdId: member.ocd_id,
      office: member.office,
      phone: member.phone,
      fax: member.fax,
      state: member.state,
      district: member.district,
      senateClass: member.senate_class,
      stateRank: member.state_rank,
      lisId: member.lis_id,
      missedVotesPct: member.missed_votes_pct,
      votesWithPartyPct: member.votes_with_party_pct,
      votesAgainstPartyPct: member.votes_against_party_pct,
      house: houseValue,
    } as Partial<Representative>;
  }

  transformPropublicaBillToDbBill(bill: ProPublicaBill): Bill {
    return {
      propublicaId: bill.bill_id,
    } as Bill;
  }

  async scheduledRepsSync() {
    // Fetch all representatives from the house and senate
    // Upsert all of them matching on propublica ID
    const propubService = new PropublicaService();
    const houseMembers = await propubService.fetchMembers({
      chamber: "house",
      offset: 0,
    });
    const senateMembers = await propubService.fetchMembers({
      chamber: "senate",
      offset: 0,
    });
    const allMembers = [...houseMembers, ...senateMembers];
    allMembers.map((member) => {
      if (member.cook_pvi) {
        console.log("cook pvi", member.cook_pvi);
      } else {
        console.log("no cook pvi");
      }
    });
    await dbClient.$transaction(
      allMembers.map((propubMember) =>
        dbClient.representative.upsert({
          where: {
            propublicaId: propubMember.id,
          },
          update: this.transformPropublicaMemberToDbRep(propubMember),
          create: this.transformPropublicaMemberToDbRep(propubMember),
        })
      )
    );
  }

  async scheduledBillsSync() {
    // Fetch last 40 bills from the API
    const numBillsFetched = 60; // Keep in increments of 20
    const propubService = new PropublicaService();
    // Loop through chunks in incrememts of 20 and create fetch requests
    let introducedFetches = [];
    let updatedFetches = [];
    for (let i = 0; i < numBillsFetched; i += 20) {
      // If last chunk of size < 20, queue remaining at offset
      if (i >= numBillsFetched) {
        break;
      }
      // Fetch next 20 introduced
      introducedFetches.push(
        propubService.fetchBills({
          type: "introduced",
          offset: i,
        })
      );
      // Fetch next 20 updated
      updatedFetches.push(
        propubService.fetchBills({
          type: "updated",
          offset: i,
        })
      );
    }
    // Fetch all bills
    const introducedBills = await Promise.all(introducedFetches);
    const updatedBills = await Promise.all(updatedFetches);
    // Flatten arrays
    const allIntroducedBills = introducedBills.flat();
    const allUpdatedBills = updatedBills.flat();
    // Prioritize updates over introductions - OoO matters - if dupe updated will have most up to date data
    const allBills = [...allUpdatedBills, ...allIntroducedBills];
    let idToSeenMap: { [key: string]: boolean } = {};
    // Dedupe on bill.bill_id
    const allBillsDeduped = allBills.filter((bill) => {
      if (idToSeenMap[bill.bill_id]) {
        return false;
      } else {
        idToSeenMap[bill.bill_id] = true;
        return true;
      }
    });
    // TODO: Get sponsor DB ID for introduced bills
    const introducedBillPropubIdToSponsorDbIdMap: { [key: string]: string } =
      {};
    for (const bill of allIntroducedBills) {
      const sponsor = await dbClient.representative.findUnique({
        where: {
          propublicaId: bill.sponsor_id,
        },
      });
      if (sponsor) {
        introducedBillPropubIdToSponsorDbIdMap[bill.bill_id] = sponsor.id;
      }
    }
    // TODO: Get primary issue for bill

    // TODO: Trigger cosponsors sync job for this bill
    // TODO: Trigger votes sync job for this bill if it has been voted on (and set lastVotesSync on bill job data)
  }

  async createWorkers() {
    // Create workers
    // repsSync worker
    const repsWorker = new Worker(
      "app-service-queue",
      async (job) => {
        if (job.name === "reps-sync-scheduled") {
          await this.scheduledRepsSync();
        }
      },
      {
        connection: this.redisConnection,
      }
    );
    // billsSync worker
    const billsWorker = new Worker(
      "app-service-queue",
      async (job) => {
        console.log("bills-sync job started");
      },
      {
        connection: this.redisConnection,
      }
    );
    // billFullText worker
    const billFullTextWorker = new Worker(
      "app-service-queue",
      async (job) => {
        console.log("bill-full-text job started");
      },
      {
        connection: this.redisConnection,
      }
    );
    // billSummaries worker
    const billSummariesWorker = new Worker(
      "app-service-queue",
      async (job) => {
        console.log("bill-summary job started");
      },
      {
        connection: this.redisConnection,
      }
    );

    // cosponsors worker
    // votes for bill worker

    const allWorkers = [
      repsWorker,
      billsWorker,
      billFullTextWorker,
      billSummariesWorker,
    ];

    for (const worker of allWorkers) {
      worker.on("completed", (job) => {
        console.log(`${job.name} job completed`);
      });
      worker.on("failed", (job, err) => {
        console.error(`${job?.name} job failed: ${err}`);
      });
    }
  }

  async startScheduledJobRunners() {
    // Create workers
    await this.createWorkers();
    // Schedule repsSync and billsSync
    await this.queueRepsSyncScheduled();
    await this.queueBillsSyncScheduled();
    // Schedule billFullText runs
    await this.queueBillFullTextsScheduled();
    // Schedule billSummary runs
    await this.queueBillSummariesScheduled();
  }
}

export default JobService;