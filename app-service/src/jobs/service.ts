import { Queue, ConnectionOptions, Worker } from "bullmq";
import dbClient from "../utils/prisma.js";
import { Bill, BillVote, Prisma, Representative } from "@prisma/client";
import PropublicaService from "../propublica/service.js";
import { ProPublicaBill, PropublicaMember } from "../propublica/types.js";

class JobService {
  repsSyncScheduledQueue: Queue;
  billsSyncScheduledQueue: Queue;
  subjectsSyncQueue: Queue;
  cosponsorsSyncQueue: Queue;
  votesSyncQueue: Queue;
  redisConnection: ConnectionOptions;
  constructor() {
    this.redisConnection = {
      host: process.env.REDIS_HOST || "redis",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    };
    this.repsSyncScheduledQueue = new Queue("reps-sync-queue", {
      connection: this.redisConnection,
    });
    this.billsSyncScheduledQueue = new Queue("bills-sync-queue", {
      connection: this.redisConnection,
    });
    this.subjectsSyncQueue = new Queue("subjects-sync-queue", {
      connection: this.redisConnection,
    });
    this.cosponsorsSyncQueue = new Queue("cosponsors-for-bill-queue", {
      connection: this.redisConnection,
    });
    this.votesSyncQueue = new Queue("votes-for-bill-queue", {
      connection: this.redisConnection,
    });
  }

  async queueRepsSyncScheduled() {
    // Add repsSync job to queue
    // Repeat every 12 hours at 03:00 and 15:00
    this.repsSyncScheduledQueue.add(
      "reps-sync-scheduled",
      {},
      { repeat: { pattern: "0 3,15 * * *" } }
    );
  }

  async queueBillsSyncScheduled() {
    // Add billsSync job to queue
    // Repeat every 12 hours at 06:00 and 18:00
    this.billsSyncScheduledQueue.add(
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
      // TODO:  this.queue.add("bill-full-text", { billId });
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
      // TODO: this.queue.add("bill-summary", { billId });
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
      billCode: bill.bill_slug,
      billUri: bill.bill_uri,
      billType: bill.bill_type,
      title: bill.title,
      shortTitle: bill.short_title,
      sponsorPropublicaId: bill.sponsor_id,
      sponsorState: bill.sponsor_state,
      sponsorParty: bill.sponsor_party,
      gpoPdfUri: bill.gpo_pdf_uri,
      congressdotgovUrl: bill.congressdotgov_url,
      govtrackUrl: bill.govtrack_url,
      introducedDate: bill.introduced_date
        ? new Date(bill.introduced_date)
        : undefined,
      lastVote: bill.last_vote ? new Date(bill.last_vote) : undefined,
      housePassage: bill.house_passage
        ? new Date(bill.house_passage)
        : undefined,
      senatePassage: bill.senate_passage
        ? new Date(bill.senate_passage)
        : undefined,
      enacted: bill.enacted ? new Date(bill.enacted) : undefined,
      vetoed: bill.vetoed ? new Date(bill.vetoed) : undefined,
      primarySubject: bill.primary_subject,
      summary: bill.summary,
      summaryShort: bill.summary_short,
      latestMajorActionDate: bill.latest_major_action_date
        ? new Date(bill.latest_major_action_date)
        : undefined,
      latestMajorAction: bill.latest_major_action,
      committees:
        typeof bill.committees === "object"
          ? bill.committees
          : bill.committees?.length
          ? [bill.committees]
          : [],
      committeeCodes: bill.committee_codes,
      cosponsorsD: bill.cosponsors_by_party?.D,
      cosponsorsR: bill.cosponsors_by_party?.R,
      active: bill.active,
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
    // TODO: Trigger cosponsors sync job for all reps
  }

  async scheduledBillsSync() {
    // Fetch last 60 updated and 60 introduced bills from the API
    const numBillsFetched = 40; // Keep in increments of 20
    const propubService = new PropublicaService();
    // Loop through chunks in incrememts of 20 and create fetch requests
    let introducedFetches = [];
    let updatedFetches = [];
    for (let i = 0; i <= numBillsFetched; i += 20) {
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
    // Dedupe on bill.bill_id
    let idToSeenMap: { [key: string]: boolean } = {};
    const allBillsDeduped = allBills.filter((bill) => {
      if (idToSeenMap[bill.bill_id]) {
        return false;
      } else {
        idToSeenMap[bill.bill_id] = true;
        return true;
      }
    });
    // Get sponsor DB ID for introduced bills
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
    // Upsert all bills matching on propublica ID
    await dbClient.$transaction(
      allBillsDeduped.map((bill) =>
        dbClient.bill.upsert({
          where: {
            propublicaId: bill.bill_id,
          },
          update: this.transformPropublicaBillToDbBill(bill),
          create: this.transformPropublicaBillToDbBill(bill),
        })
      )
    );

    // Trigger subjects sync job for all bills
    for (const bill of allBillsDeduped) {
      this.subjectsSyncQueue.add("subjects-sync", {
        propublicaId: bill.bill_slug,
      });
    }
    // Trigger cosponsors sync job for all bills
    for (const bill of allBillsDeduped) {
      this.cosponsorsSyncQueue.add("cosponsors-for-bill", {
        propublicaId: bill.bill_slug,
      });
    }

    // Trigger votes sync job for this bill
    for (const bill of allBillsDeduped) {
      this.votesSyncQueue.add("votes-for-bill", {
        propublicaId: bill.bill_slug,
      });
    }

    return true;
  }

  async syncCosponsorsForBill(propublicaId: string) {
    // Fetch cosponsors for bill from API
    const propubService = new PropublicaService();
    const existingBill = await dbClient.bill.findUnique({
      where: {
        billCode: propublicaId,
      },
      include: {
        cosponsors: true,
      },
    });
    // If bill already has cosponsors, do not fetch
    if (existingBill?.cosponsors?.length) {
      return true;
    }
    const cosponsors = await propubService.fetchCosponsorsForBill(propublicaId);
    // Upsert all cosponsors
    await dbClient.bill.update({
      where: {
        billCode: propublicaId,
      },
      data: {
        cosponsors: {
          connect: cosponsors.map((cosponsor) => ({
            propublicaId: cosponsor.cosponsor_id,
          })),
        },
      },
    });
    return true;
  }

  async syncBillSubjects(propublicaId: string) {
    // Fetch subjects for bill from API
    const propubService = new PropublicaService();
    const subjects = await propubService.fetchSubjectsForBill(propublicaId);
    // Upsert all subjects
    await dbClient.bill.update({
      where: {
        billCode: propublicaId,
      },
      data: {
        subjects: {
          set: subjects,
        },
      },
    });
    return true;
  }

  async syncBillVotes(billCode: string) {
    // Fetch votes for bill from API
    const propubService = new PropublicaService();
    const fullBill = await dbClient.bill.findFirst({
      where: {
        billCode: billCode,
      },
    });
    if (!fullBill.lastVote) {
      return true;
    }
    const votes = await propubService.fetchVotesForBill(billCode);
    // Format all votes and construct DB records
    if (!votes.length) {
      return true;
    }
    const formattedVotes: BillVote[] = votes.map((vote) => {
      return {
        chamber: vote.chamber,
        dateTime: new Date(`${vote.date}T${vote.time}`),
        question: vote.question,
        result: vote.result,
        totalYes: vote.total_yes,
        totalNo: vote.total_no,
        totalNotVoting: vote.total_not_voting,
        apiUrl: vote.api_url,
        billId: fullBill.id,
      };
    });
    // Upsert all votes
    await dbClient.$transaction(
      formattedVotes.map((vote) =>
        dbClient.billVote.upsert({
          where: {
            apiUrl: vote.apiUrl,
          },
          update: vote,
          create: vote,
        })
      )
    );

    return true;
  }

  async createWorkers() {
    // Create workers
    // repsSync worker
    const repsWorker = new Worker(
      "reps-sync-queue",
      async (job) => {
        await this.scheduledRepsSync();
      },
      {
        connection: this.redisConnection,
      }
    );
    // billsSync worker
    const billsWorker = new Worker(
      "bills-sync-queue",
      async (job) => {
        await this.scheduledBillsSync();
      },
      {
        connection: this.redisConnection,
      }
    );
    // billFullText worker
    // const billFullTextWorker = new Worker(
    //   "app-service-queue",
    //   async (job) => {
    //     console.log("bill-full-text job started");
    //   },
    //   {
    //     connection: this.redisConnection,
    //   }
    // );
    // // billSummaries worker
    // const billSummariesWorker = new Worker(
    //   "app-service-queue",
    //   async (job) => {
    //     console.log("bill-summary job started");
    //   },
    //   {
    //     connection: this.redisConnection,
    //   }
    // );
    // subjectsSync worker (for single bill)
    const subjectsSyncWorker = new Worker(
      "subjects-sync-queue",
      async (job) => {
        if (job.data.propublicaId) {
          await this.syncBillSubjects(job.data.propublicaId as string);
        }
      },
      {
        connection: this.redisConnection,
      }
    );
    // cosponsors worker (for single bill)
    const cosponsorsSyncWorker = new Worker(
      "cosponsors-for-bill-queue",
      async (job) => {
        if (job.data.propublicaId) {
          await this.syncCosponsorsForBill(job.data.propublicaId as string);
        }
      },
      {
        connection: this.redisConnection,
        concurrency: 3,
      }
    );
    // // votesSync worker (for single bill)
    const votesSyncWorker = new Worker(
      "votes-for-bill-queue",
      async (job) => {
        if (job.data.propublicaId) {
          await this.syncBillVotes(job.data.propublicaId as string);
        }
      },
      {
        connection: this.redisConnection,
      }
    );

    const allWorkers = [
      repsWorker,
      billsWorker,
      subjectsSyncWorker,
      // billFullTextWorker,
      // billSummariesWorker,
      cosponsorsSyncWorker,
      votesSyncWorker,
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
