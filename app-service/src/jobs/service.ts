import { Queue, ConnectionOptions, Worker } from "bullmq";
import dbClient from "../utils/prisma.js";
import { Bill, BillVote, Prisma, Representative } from "@prisma/client";
import PropublicaService from "../propublica/service.js";
import { ProPublicaBill, PropublicaMember } from "../propublica/types.js";
import InternalError from "../utils/errors/InternalError.js";
import axios from "axios";
import AiService from "../ai/service.js";

enum HouseEnum {
  House,
  Senate,
  Joint,
  Unknown,
}

class JobService {
  repsSyncScheduledQueue: Queue;
  billsSyncScheduledQueue: Queue;
  subjectsSyncQueue: Queue;
  cosponsorsSyncQueue: Queue;
  votesSyncQueue: Queue;
  repVotesSyncQueue: Queue;
  issuesAssociationQueue: Queue;
  billFullTextQueue: Queue;
  billAiSummaryQueue: Queue;
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
    this.repVotesSyncQueue = new Queue("votes-for-rep-queue", {
      connection: this.redisConnection,
    });
    this.issuesAssociationQueue = new Queue("issues-association-queue", {
      connection: this.redisConnection,
    });
    this.billFullTextQueue = new Queue("bill-full-text-queue", {
      connection: this.redisConnection,
    });
    this.billAiSummaryQueue = new Queue("bill-ai-summary-queue", {
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
    const allBillCodes = allBillsWhereNecessary.map(
      (bill: Bill) => bill.billCode
    );
    // Trigger bill full text job for each bill
    for (const billCode of allBillCodes) {
      this.billFullTextQueue.add("bill-full-text", {
        billCode,
      });
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
    // TODO: Queue a billSummary job for each bill
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

    // FOR TESTING OR BULK APPLYING CHILD SYNCS
    // const allBillsForExtendedSyncs = await dbClient.bill.findMany({
    //   where: {
    //     propublicaId: {
    //       not: undefined,
    //     },
    //   },
    // });
    // for (const bill of allBillsForExtendedSyncs) {
    //   this.subjectsSyncQueue.add("subjects-sync", {
    //     propublicaId: bill.billCode,
    //   });
    // }
    // for (const bill of allBillsForExtendedSyncs) {
    //   this.cosponsorsSyncQueue.add("cosponsors-for-bill", {
    //     propublicaId: bill.billCode,
    //   });
    // }
    // for (const bill of allBillsForExtendedSyncs) {
    //   this.votesSyncQueue.add("votes-for-bill", {
    //     propublicaId: bill.billCode,
    //   });
    // }
    // for (const bill of allBillsForExtendedSyncs) {
    //   this.billFullTextQueue.add("bill-full-text", {
    //     billCode: bill.billCode,
    //   });
    // }

    // Trigger subjects sync job for all bills
    for (const bill of allBillsDeduped) {
      this.subjectsSyncQueue.add("subjects-sync", {
        billCode: bill.bill_slug,
      });
    }
    // Trigger cosponsors sync job for all bills
    for (const bill of allBillsDeduped) {
      this.cosponsorsSyncQueue.add("cosponsors-for-bill", {
        billCode: bill.bill_slug,
      });
    }
    // Trigger votes sync job for this bill
    for (const bill of allBillsDeduped) {
      this.votesSyncQueue.add("votes-for-bill", {
        billCode: bill.bill_slug,
      });
    }
    // Trigger bill full text job for each bill
    for (const bill of allBillsDeduped) {
      this.billFullTextQueue.add("bill-full-text", {
        billCode: bill.bill_slug,
      });
    }

    return true;
  }

  async syncCosponsorsForBill(billCode: string) {
    // Fetch cosponsors for bill from API
    const propubService = new PropublicaService();
    const existingBill = await dbClient.bill.findUnique({
      where: {
        billCode: billCode,
      },
      include: {
        cosponsors: true,
      },
    });
    // If bill already has cosponsors, do not fetch
    if (existingBill?.cosponsors?.length) {
      return true;
    }
    const cosponsors = await propubService.fetchCosponsorsForBill(billCode);
    // Upsert all cosponsors
    await dbClient.bill.update({
      where: {
        billCode: billCode,
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

  async syncBillSubjects(billCode: string) {
    // Fetch subjects for bill from API
    const propubService = new PropublicaService();
    const subjects = await propubService.fetchSubjectsForBill(billCode);
    // Upsert all subjects
    const bill = await dbClient.bill.update({
      where: {
        billCode,
      },
      data: {
        subjects: {
          set: subjects,
        },
      },
    });
    this.issuesAssociationQueue.add("issues-association", {
      propublicaId: bill.propublicaId,
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

    const allCompleteBillVotes = await dbClient.billVote.findMany({
      where: {
        billId: fullBill.id,
      },
    });
    // Queue repVotesSync for each vote
    for (const vote of allCompleteBillVotes) {
      this.repVotesSyncQueue.add("votes-for-rep", {
        billVoteId: vote.id,
      });
    }

    return true;
  }

  getHouseFromBillType(billType: string): HouseEnum {
    switch (billType) {
      case "hr":
        return HouseEnum.House;
      case "s":
        return HouseEnum.Senate;
      case "hjres":
        return HouseEnum.Joint;
      case "sconres":
        return HouseEnum.Joint;
      case "hconres":
        return HouseEnum.Joint;
      case "sjres":
        return HouseEnum.Joint;
      case "hres":
        return HouseEnum.House;
      case "sres":
        return HouseEnum.Senate;
      default:
        return HouseEnum.Unknown;
    }
  }

  async syncBillFullText(billCode: string) {
    // Fetch full text for bill from API
    const existingBill = await dbClient.bill.findUnique({
      where: {
        billCode,
      },
      include: {
        fullText: true,
        jobData: true,
      },
    });

    if (!existingBill) {
      throw new InternalError(`Bill not found for bill code ${billCode}`);
    }

    // If bill already has full text and has been synced in the last week
    if (
      existingBill?.fullText &&
      existingBill?.jobData?.lastFullTextSync &&
      Date.now() - existingBill?.jobData?.lastFullTextSync.getTime() <
        7 * 24 * 60 * 60 * 1000
    ) {
      return true;
    }

    // Fetch full text
    const billType = existingBill.billType;
    const houseEnum = this.getHouseFromBillType(billType);

    // If resolution, we probably won't care
    if (!["hr", "s"].includes(billType)) {
      return true;
    }

    const urlParam = (() => {
      switch (houseEnum) {
        case HouseEnum.House:
          return "h";
        case HouseEnum.Senate:
          return "s";
        default:
          return "h";
      }
    })();

    const billXmlUrl = `https://www.congress.gov/118/bills/${billCode}/BILLS-118${billCode}i${urlParam}.xml`;
    // Second option: https://www.govinfo.gov/content/pkg/BILLS-116hr502eh/xml/BILLS-116hr502eh.xml
    const xmlResponse = await axios.get(billXmlUrl);
    const xmlData = xmlResponse.data;
    const fullText = xmlData;
    if (fullText) {
      // Upsert full text
      await dbClient.billFullText.upsert({
        where: {
          billId: existingBill.id,
        },
        update: {
          fullText,
        },
        create: {
          fullText,
          billId: existingBill.id,
        },
      });
      await dbClient.billJobData.upsert({
        where: {
          billId: existingBill.id,
        },
        update: {
          lastFullTextSync: new Date(),
        },
        create: {
          lastFullTextSync: new Date(),
          billId: existingBill.id,
        },
      });
      // Queue summary sync for bill
      this.billAiSummaryQueue.add("bill-ai-summary", {
        billId: existingBill.id,
      });
    }

    return true;
  }

  async syncBillSummary(billId: string) {
    // TODO: Short summmary
    const aiService = new AiService();
    const summary = await aiService.getBillSummary(billId);
    // Save the response as aiSummary on the bill
    await dbClient.bill.update({
      where: {
        id: billId,
      },
      data: {
        aiSummary: summary,
      },
    });
  }

  async syncRepVotesForBillVote(billVoteId: string) {
    const propubService = new PropublicaService();
    const billVote = await dbClient.billVote.findUnique({
      where: {
        id: billVoteId,
      },
    });
    const repVotes = await propubService.fetchRepVotesForBillVote(
      billVote?.apiUrl
    );
    // Format and upsert all repVotes
    if (!repVotes.length) {
      return true;
    }
    let upsertInputs: Prisma.RepresentativeVoteUpsertArgs[] = [];
    for (const repVote of repVotes) {
      const billId = billVote?.billId;
      const representative = await dbClient.representative.findUnique({
        where: {
          propublicaId: repVote.member_id,
        },
      });
      const representativeId = representative?.id;
      const formattedVote = {
        representativeId,
        billId,
        billVoteId,
        position: repVote.vote_position,
        date: billVote.dateTime,
      };
      if (representative) {
        upsertInputs.push({
          where: {
            unique_representative_vote: {
              representativeId,
              billVoteId,
              billId,
            },
          },
          update: formattedVote,
          create: formattedVote,
        });
      }
    }

    // Upsert
    await dbClient.$transaction(
      upsertInputs.map((input) => dbClient.representativeVote.upsert(input))
    );
  }

  async associateBillWithIssues(propublicaId: string) {
    const bill = await dbClient.bill.findUnique({
      where: {
        propublicaId,
      },
    });
    if (!bill.primarySubject && !bill.subjects?.length) {
      return true;
    }
    // Find issue that matches bill's primary subject
    const issue = await dbClient.issue.findFirst({
      where: {
        subjects: {
          hasSome: [bill?.primarySubject],
        },
      },
    });
    // Find issues that match any of the bill's subjects
    const issues = await dbClient.issue.findMany({
      where: {
        subjects: {
          hasSome: bill?.subjects,
        },
      },
    });
    // Connect bill to primary issue and issues
    await dbClient.bill.update({
      where: {
        propublicaId,
      },
      data: {
        issues: {
          connect: issues,
        },
        primaryIssue: {
          connect: issue,
        },
      },
    });
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
    const billFullTextWorker = new Worker(
      "bill-full-text-queue",
      async (job) => {
        await this.syncBillFullText(job.data.billCode as string);
      },
      {
        connection: this.redisConnection,
        concurrency: 3,
      }
    );
    // AI summary worker
    const billAiSummaryWorker = new Worker(
      "bill-ai-summary-queue",
      async (job) => {
        await this.syncBillSummary(job.data.billId as string);
      },
      {
        connection: this.redisConnection,
        concurrency: 3,
      }
    );
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
        concurrency: 3,
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
    // votesSync worker (for single bill)
    const votesSyncWorker = new Worker(
      "votes-for-bill-queue",
      async (job) => {
        if (job.data.propublicaId) {
          await this.syncBillVotes(job.data.propublicaId as string);
        }
      },
      {
        connection: this.redisConnection,
        concurrency: 3,
      }
    );

    // repVotesSync worker (for single bill vote)
    const repVotesSyncWorker = new Worker(
      "votes-for-rep-queue",
      async (job) => {
        if (job.data.billVoteId) {
          await this.syncRepVotesForBillVote(job.data.billVoteId as string);
        }
      },
      {
        connection: this.redisConnection,
        concurrency: 3,
      }
    );

    const issuesAssociationWorker = new Worker(
      "issues-association-queue",
      async (job) => {
        await this.associateBillWithIssues(job.data.propublicaId as string);
      },
      {
        connection: this.redisConnection,
        concurrency: 3,
      }
    );

    const allWorkers = [
      repsWorker,
      billsWorker,
      subjectsSyncWorker,
      cosponsorsSyncWorker,
      votesSyncWorker,
      repVotesSyncWorker,
      issuesAssociationWorker,
      billFullTextWorker,
      billAiSummaryWorker,
    ];

    for (const worker of allWorkers) {
      worker.on("active", (job) => {
        console.info(`job started`, {
          jobId: job.id,
          name: job.name,
          data: job.data,
        });
      });
      worker.on("completed", (job) => {
        console.info(`job completed`, {
          jobId: job.id,
          name: job.name,
          data: job.data,
        });
      });
      worker.on("failed", (job, err) => {
        console.error(`job failed: ${err}`, {
          jobId: job?.id,
          name: job?.name,
          data: job?.data,
        });
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
