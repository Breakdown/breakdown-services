import { Queue, Worker } from "bullmq";
import dbClient from "../utils/prisma.js";
import { Bill, Prisma, User } from "@prisma/client";
import PropublicaService from "../propublica/service.js";
import { ProPublicaBill, PropublicaMember } from "../propublica/types.js";
import InternalError from "../utils/errors/InternalError.js";
import axios from "axios";
import AiService from "../ai/service.js";
import NotificationService, {
  NotificationJobData,
  NotificationType,
} from "../notifications/service.js";
import MeilisearchService from "../meilisearch/service.js";
import { XMLParser } from "fast-xml-parser";
import CacheService, { CacheDataKeys } from "../cache/service.js";

enum HouseEnum {
  House,
  Senate,
  Joint,
  Unknown,
}

const isArray = function (a: any) {
  return !!a && a.constructor === Array;
};

const isObject = function (a: any) {
  return !!a && a.constructor === Object;
};

const redisConnection = {
  host: process.env.REDIS_HOST || "redis",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

const repsSyncScheduledQueue = new Queue("reps-sync-queue", {
  connection: redisConnection,
});
const billsSyncScheduledQueue = new Queue("bills-sync-queue", {
  connection: redisConnection,
});
const subjectsSyncQueue = new Queue("subjects-sync-queue", {
  connection: redisConnection,
});
const cosponsorsSyncQueue = new Queue("cosponsors-for-bill-queue", {
  connection: redisConnection,
});
const votesSyncQueue = new Queue("votes-for-bill-queue", {
  connection: redisConnection,
});
const repVotesSyncQueue = new Queue("votes-for-rep-queue", {
  connection: redisConnection,
});
const issuesAssociationQueue = new Queue("issues-association-queue", {
  connection: redisConnection,
});
const billFullTextQueue = new Queue("bill-full-text-queue", {
  connection: redisConnection,
});
const billAiSummaryQueue = new Queue("bill-ai-summary-queue", {
  connection: redisConnection,
});
const notificationQueue = new Queue("notification-queue", {
  connection: redisConnection,
});
const meilisearchSyncQueue = new Queue("meilisearch-sync-queue", {
  connection: redisConnection,
});
const upcomingBillsSyncQueue = new Queue("upcoming-bills-sync-queue", {
  connection: redisConnection,
});

class JobService {
  cacheService: CacheService;
  constructor() {
    this.cacheService = new CacheService();
  }
  async queueRepsSyncScheduled() {
    // Add repsSync job to queue
    // Repeat every 12 hours at 03:00 and 15:00
    repsSyncScheduledQueue.add(
      "reps-sync-scheduled",
      {},
      { repeat: { pattern: "0 3,15 * * *" } }
    );
  }

  async queueBillsSyncScheduled() {
    // Add billsSync job to queue
    // Repeat every 12 hours at 06:00 and 18:00
    billsSyncScheduledQueue.add(
      "bills-sync-scheduled",
      {},
      { repeat: { pattern: "0 6,18 * * *" } }
    );
  }

  async queueMeilisearchSyncScheduled() {
    // Add meilisearchSync job to queue
    // Repeat every 12 hours at 09:00 and 21:00
    meilisearchSyncQueue.add(
      "global-sync-meilisearch",
      {},
      { repeat: { pattern: "0 9,21 * * *" } }
    );
  }

  async queueUpcomingBillsSyncScheduled() {
    // Add upcomingBillsSync job to queue
    // Repeat every 12 hours at 12:00 and 00:00
    upcomingBillsSyncQueue.add(
      "upcoming-bills-sync-scheduled",
      {},
      { repeat: { pattern: "0 0,12 * * *" } }
    );
  }

  async queueBillFullTextsScheduled() {
    const pivotDate = new Date(Date.now() - 72 * 60 * 60 * 1000);
    // TODO: Factor out
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
      billFullTextQueue.add("bill-full-text", {
        billCode,
      });
    }
  }

  transformPropublicaMemberToDbRep(
    member: PropublicaMember
  ): Prisma.RepresentativeCreateInput {
    const houseValue = member.short_title === "Sen." ? "senate" : "house";
    return {
      title: member.title,
      shortTitle: member.short_title,
      apiUri: member.api_uri,
      firstName: member.first_name,
      middleName: member.middle_name || null,
      lastName: member.last_name,
      suffix: member.suffix || null,
      dateOfBirth: member.date_of_birth ? new Date(member.date_of_birth) : null,
      gender: member.gender,
      party: member.party,
      propublicaId: member.id,
      twitter: member.twitter_account || null,
      facebook: member.facebook_account || null,
      govtrackId: member.id,
      cspanId: member.cspan_id || null,
      votesmartId: member.votesmart_id || null,
      icpsrId: member.icpsr_id || null,
      crpId: member.crp_id || null,
      googleEntityId: member.google_entity_id || null,
      fecCandidateId: member.fec_candidate_id || null,
      url: member.url || null,
      rssUrl: member.rss_url || null,
      contactForm: member.contact_form || null,
      inOffice: member.in_office || null,
      cookPvi: member.cook_pvi || null, // Not filling - not in the API response? Or mismapped?
      dwNominate: member.dw_nominate || null,
      seniority: member.seniority || null,
      nextElection: member.next_election
        ? new Date(member.next_election)
        : null,
      totalVotes: member.total_votes || null,
      missedVotes: member.missed_votes || null,
      totalPresent: member.total_present || null,
      lastUpdated: member.last_updated ? new Date(member.last_updated) : null,
      ocdId: member.ocd_id || null,
      office: member.office || null,
      phone: member.phone || null,
      fax: member.fax || null,
      state: member.state || null,
      district: member.district || null,
      senateClass: member.senate_class || null,
      stateRank: member.state_rank || null,
      lisId: member.lis_id || null,
      missedVotesPct: member.missed_votes_pct || null,
      votesWithPartyPct: member.votes_with_party_pct || null,
      votesAgainstPartyPct: member.votes_against_party_pct || null,
      house: houseValue,
    };
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
    const allRepsPrev = await dbClient.representative.findMany();
    await dbClient.$transaction(
      allMembers.map((propubMember) => {
        const transformedMember =
          this.transformPropublicaMemberToDbRep(propubMember);
        transformedMember.imageUrl = `https://theunitedstates.io/images/congress/450x550/${transformedMember.propublicaId}.jpg`;

        return dbClient.representative.upsert({
          where: {
            propublicaId: propubMember.id,
          },
          update: transformedMember,
          create: transformedMember,
        });
      })
    );
    const allReps = await dbClient.representative.findMany();

    // Bust cache for all reps where their stats have been updated
    for (const rep of allReps) {
      const previousRep = allRepsPrev.find(
        (prevRep) => prevRep.propublicaId === rep.propublicaId
      );
      if (
        previousRep &&
        (previousRep.totalVotes !== rep.totalVotes ||
          previousRep.missedVotes !== rep.missedVotes ||
          previousRep.totalPresent !== rep.totalPresent ||
          previousRep.missedVotesPct !== rep.missedVotesPct ||
          previousRep.votesWithPartyPct !== rep.votesWithPartyPct ||
          previousRep.votesAgainstPartyPct !== rep.votesAgainstPartyPct)
      ) {
        // Bust cache for rep stats
        await this.cacheService.bustCache(CacheDataKeys.REP_STATS_BY_ID, {
          representativeId: rep.id,
        });
      }
    }
  }

  async scheduledBillsSync() {
    // Fetch last 60 updated and 60 introduced bills from the API
    const numBillsFetched = 20; // Keep in increments of 20
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
    for (const bill of allBills) {
      const sponsor = await dbClient.representative.findUnique({
        where: {
          propublicaId: bill.sponsor_id,
        },
      });
      if (sponsor) {
        introducedBillPropubIdToSponsorDbIdMap[bill.bill_id] = sponsor.id;
      }
    }

    const previousBills = await dbClient.bill.findMany({
      where: {
        propublicaId: {
          in: allBillsDeduped.map((bill) => bill.bill_id),
        },
      },
    });

    // Upsert all bills matching on propublica ID
    await dbClient.$transaction(
      allBillsDeduped.map((bill) =>
        dbClient.bill.upsert({
          where: {
            propublicaId: bill.bill_id,
          },
          update: {
            ...this.transformPropublicaBillToDbBill(bill),
            sponsorId: introducedBillPropubIdToSponsorDbIdMap[bill.bill_id],
          },
          create: {
            ...this.transformPropublicaBillToDbBill(bill),
            sponsorId: introducedBillPropubIdToSponsorDbIdMap[bill.bill_id],
          },
        })
      )
    );
    // Get all bills that have been updated
    const newlySavedBills = await dbClient.bill.findMany({
      where: {
        propublicaId: {
          in: allUpdatedBills.map((bill) => bill.bill_id),
        },
      },
    });
    // Notifications: Check if summary has been updated for each bill, and if it has then send
    // Get all users to be notified
    const notifService = new NotificationService();
    const usersPromises = newlySavedBills.map((bill: Bill) =>
      notifService.getUsersInterestedInNotification(
        NotificationType.BILL_SUMMARY_UPDATED,
        {
          billId: bill.id,
          billTitle: bill.title,
        }
      )
    );
    const users = await Promise.all(usersPromises);
    const userIdMap: { [key: string]: boolean } = {};
    const dedupedUsers = users.flat().filter((user: User) => {
      if (userIdMap[user.id]) {
        return false;
      } else {
        userIdMap[user.id] = true;
        return true;
      }
    });

    // Send Notifications
    for (const bill of newlySavedBills) {
      // TODO: Filter bills more for only user-relevant ones
      // Notifications: Check if bill is a new one with a recently saved summary
      if (bill.summary) {
        const previousBill = previousBills.find(
          (prevBill: Bill) => prevBill.propublicaId === bill.propublicaId
        );
        if (previousBill?.summary !== bill.summary) {
          // Queue notification job for every user
          for (const user of dedupedUsers) {
            notificationQueue.add("notification", {
              userId: user.id,
              notificationType: NotificationType.BILL_SUMMARY_UPDATED,
              data: {
                billId: bill.id,
                billTitle: bill.title,
              },
            });
          }
        }
      }
      // Notifications: Check if bill last_vote has been updated, if so send
      if (bill.lastVote) {
        const previousBill = previousBills.find(
          (prevBill: Bill) => prevBill.propublicaId === bill.propublicaId
        );
        if (previousBill?.lastVote !== bill.lastVote) {
          for (const user of dedupedUsers) {
            notificationQueue.add("notification", {
              userId: user.id,
              notificationType: NotificationType.BILL_VOTED_ON,
              data: {
                billId: bill.id,
                billTitle: bill.title,
              },
            });
          }
        }
      }
      continue;
    }

    // Child jobs other than notifications

    // Trigger subjects sync job for all bills
    for (const bill of allBillsDeduped) {
      subjectsSyncQueue.add("subjects-sync", {
        billCode: bill.bill_slug,
      });
    }
    // Trigger cosponsors sync job for all bills
    for (const bill of allBillsDeduped) {
      cosponsorsSyncQueue.add("cosponsors-for-bill", {
        billCode: bill.bill_slug,
      });
    }
    // Trigger votes sync job for this bill
    for (const bill of allBillsDeduped) {
      votesSyncQueue.add("votes-for-bill", {
        billCode: bill.bill_slug,
      });
    }
    // Trigger bill full text job for each bill
    for (const bill of allBillsDeduped) {
      billFullTextQueue.add("bill-full-text", {
        billCode: bill.bill_slug,
      });
    }

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

    return true;
  }

  async scheduledUpcomingBillsSync() {
    // Fetch upcoming bills from the API
    const propubService = new PropublicaService();
    const upcomingBillsHouse = await propubService.fetchUpcomingBills({
      chamber: "house",
    });
    const upcomingBillsSenate = await propubService.fetchUpcomingBills({
      chamber: "senate",
    });
    const upcomingBills = [...upcomingBillsHouse, ...upcomingBillsSenate];

    let upcomingBillUpdatesFormatted: Prisma.BillUpdateArgs[] = [];
    // 40 bills at this point
    for (const bill of upcomingBills) {
      const existingBill = await dbClient.bill.findUnique({
        where: {
          propublicaId: bill.bill_id,
        },
      });
      if (!existingBill) {
        continue;
      }
      upcomingBillUpdatesFormatted.push({
        where: {
          propublicaId: bill.bill_id,
        },
        data: {
          scheduledAt: new Date(bill.scheduled_at),
          legislativeDay: bill.legislative_day,
          scheduledAtRange: bill.range,
          nextConsideration: bill.consideration,
        },
      });
    }

    if (!upcomingBillUpdatesFormatted.length) {
      return true;
    }

    // Upsert all upcoming bills
    await dbClient.$transaction(
      upcomingBillUpdatesFormatted.map((args) => dbClient.bill.update(args))
    );
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
    issuesAssociationQueue.add("issues-association", {
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
    if (!fullBill?.lastVote) {
      return true;
    }
    const votes = await propubService.fetchVotesForBill(billCode);
    // Format all votes and construct DB records
    if (!votes.length) {
      return true;
    }
    const formattedVotes: Prisma.BillVoteCreateInput[] = votes.map((vote) => {
      return {
        chamber: vote.chamber,
        dateTime: new Date(`${vote.date}T${vote.time}`),
        question: vote.question,
        result: vote.result,
        totalYes: vote.total_yes,
        totalNo: vote.total_no,
        totalNotVoting: vote.total_not_voting,
        apiUrl: vote.api_url,
        bill: {
          connect: {
            id: fullBill.id,
          },
        },
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
      repVotesSyncQueue.add("votes-for-rep", {
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

  convertXmlNodeToText(node: any): string {
    let fullText = "";
    if (isArray(node)) {
      const text = node.map((n: any) => this.convertXmlNodeToText(n)).join(" ");
      fullText = `${fullText} ${text}`;
    }
    if (isObject(node)) {
      return Object.keys(node)
        .map((key) => this.convertXmlNodeToText(node[key]))
        .join(" ");
    }
    if (typeof node === "string") {
      fullText = `${fullText} ${node}`;
    }
    return `${fullText}\n`;
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

    // If bill already has full text and has been synced in the last 3 days
    if (
      existingBill?.fullText &&
      existingBill?.jobData?.lastFullTextSync &&
      Date.now() - existingBill?.jobData?.lastFullTextSync.getTime() <
        72 * 60 * 60 * 1000
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

    // Parse XML into text
    const parser = new XMLParser();
    const jObj = parser.parse(xmlData);
    const legisBody = jObj["bill"]?.["legis-body"];
    let fullText = "";
    for (const section of legisBody?.["section"]) {
      let sectionText = "";
      for (const sectionObjKey of Object.keys(section)) {
        const value = section[sectionObjKey];
        const text = this.convertXmlNodeToText(value);
        sectionText = `${sectionText}\n${text}`;
      }
      fullText = `${fullText}\n${sectionText}`;
    }

    if (fullText) {
      // Upsert full text
      if (existingBill.fullText?.fullText === fullText) {
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
        return true;
      } else {
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
        // Queue AI summary sync for bill
        billAiSummaryQueue.add("bill-ai-summary", {
          billId: existingBill.id,
        });
      }
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
        jobData: {
          update: {
            lastSummarySync: new Date(),
          },
        },
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
    if (!billVote) {
      throw new InternalError(
        `Bill vote not found for bill vote ID ${billVoteId}`
      );
    }
    const repVotes = await propubService.fetchRepVotesForBillVote(
      billVote?.apiUrl
    );
    // Format and upsert all repVotes
    if (!repVotes.length) {
      return true;
    }
    let upsertInputs: Prisma.RepresentativeVoteUpsertArgs[] = [];
    let repVotesBustIds = [];
    for (const repVote of repVotes) {
      const billId = billVote?.billId;
      const representative = await dbClient.representative.findUnique({
        where: {
          propublicaId: repVote.member_id,
        },
      });
      if (!representative) {
        continue;
      }
      const representativeId = representative?.id;
      const formattedVote = {
        representativeId,
        billId,
        billVoteId,
        position: repVote.vote_position,
        date: billVote.dateTime,
      };
      if (representative) {
        repVotesBustIds.push(representative.id);
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
    // Bust caches
    const cacheBustPromises = [];
    for (const repId of repVotesBustIds) {
      cacheBustPromises.push(
        this.cacheService.bustCache(CacheDataKeys.REP_VOTES_BY_ID, {
          representativeId: repId,
        })
      );
      cacheBustPromises.push(
        this.cacheService.bustCache(CacheDataKeys.REP_VOTE_ON_BILL, {
          representativeId: repId,
          billId: billVote.billId,
        })
      );
    }
    await Promise.all(cacheBustPromises);
  }

  async associateBillWithIssues(propublicaId: string) {
    const bill = await dbClient.bill.findUnique({
      where: {
        propublicaId,
      },
    });
    if (!bill) {
      throw new InternalError(
        `Bill not found for propublica ID ${propublicaId}`
      );
    }
    if (!bill.primarySubject && !bill.subjects?.length) {
      return true;
    }
    // Find issue that matches bill's primary subject
    let primaryIssue;
    if (bill.primarySubject) {
      primaryIssue = await dbClient.issue.findFirst({
        where: {
          subjects: {
            hasSome: [bill?.primarySubject],
          },
        },
      });
    }
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
          connect: issues.map((issue) => ({
            id: issue.id,
          })),
        },
        primaryIssue: {
          connect: {
            id: primaryIssue?.id,
          },
        },
      },
    });
    return true;
  }

  async sendNotification(data: NotificationJobData) {
    const notifService = new NotificationService();

    await notifService.sendNotification(
      data.userId,
      data.notificationType,
      data.data
    );
    return;
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
        connection: redisConnection,
      }
    );
    // billsSync worker
    const billsWorker = new Worker(
      "bills-sync-queue",
      async (job) => {
        await this.scheduledBillsSync();
      },
      {
        connection: redisConnection,
      }
    );
    // billFullText worker
    const billFullTextWorker = new Worker(
      "bill-full-text-queue",
      async (job) => {
        await this.syncBillFullText(job.data.billCode as string);
      },
      {
        connection: redisConnection,
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
        connection: redisConnection,
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
        connection: redisConnection,
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
        connection: redisConnection,
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
        connection: redisConnection,
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
        connection: redisConnection,
        concurrency: 3,
      }
    );

    const issuesAssociationWorker = new Worker(
      "issues-association-queue",
      async (job) => {
        await this.associateBillWithIssues(job.data.propublicaId as string);
      },
      {
        connection: redisConnection,
        concurrency: 3,
      }
    );

    const notificationsWorker = new Worker(
      "notification-queue",
      async (job) => {
        await this.sendNotification(job.data as NotificationJobData);
        return;
      },
      {
        connection: redisConnection,
        concurrency: 10,
      }
    );

    const meilisearchSyncWorker = new Worker(
      "meilisearch-sync-queue",
      async (job) => {
        if (job.name === "global-sync-meilisearch") {
          const meilisearchService = new MeilisearchService();
          await meilisearchService.globalSync();
        }
        return;
      },
      {
        connection: redisConnection,
        concurrency: 10,
      }
    );

    const upcomingBillsSyncWorker = new Worker(
      "upcoming-bills-sync-queue",
      async () => {
        await this.scheduledUpcomingBillsSync();
      },
      {
        connection: redisConnection,
        concurrency: 1,
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
      notificationsWorker,
      meilisearchSyncWorker,
      upcomingBillsSyncWorker,
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

  async start() {
    // Create workers
    await this.createWorkers();
    // Schedule repsSync and billsSync
    await this.queueRepsSyncScheduled();
    await this.queueBillsSyncScheduled();
    // Schedule billFullText runs
    await this.queueBillFullTextsScheduled();
    await this.queueMeilisearchSyncScheduled();
    await this.queueUpcomingBillsSyncScheduled();
  }
}

export default JobService;
