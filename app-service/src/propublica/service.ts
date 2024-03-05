import axios from "axios";
import InternalError from "../utils/errors/InternalError.js";
import {
  ProPublicaBill,
  ProPublicaCosponsor,
  ProPublicaPosition,
  PropublicaBillByIdResponse,
  PropublicaBillVote,
  PropublicaBillsResponse,
  PropublicaCosponsorsResponse,
  PropublicaMember,
  PropublicaMembersResponse,
  PropublicaRollCallVoteByIdResponse,
  PropublicaSubjectsResponse,
  PropublicaUpcomingBill,
  PropublicaUpcomingBillsResponse,
} from "./types.js";
import CacheService, { CacheDataKeys } from "../cache/service.js";

class PropublicaService {
  pageSize: number = 20;
  apiKey: string;
  baseUrl: string = "https://api.propublica.org/congress/v1";
  cacheService: CacheService;
  constructor() {
    if (!process.env.PROPUBLICA_API_KEY) {
      throw new InternalError("Missing ProPublica API Key");
    }
    this.apiKey = process.env.PROPUBLICA_API_KEY;
    this.cacheService = new CacheService();
  }

  async fetchMembers({
    chamber,
    offset,
  }: {
    chamber: "house" | "senate";
    offset: number;
  }): Promise<PropublicaMember[]> {
    const url = `${this.baseUrl}/118/${chamber}/members.json${
      offset ? `?offset=${offset}` : ""
    }`;
    const cachedResponse = await this.cacheService.getData<PropublicaMember[]>(
      CacheDataKeys.PROPUBLICA_FETCH_MEMBERS,
      { propublicaUrl: url }
    );
    if (cachedResponse) {
      return cachedResponse;
    }
    const response = await axios.get<PropublicaMembersResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    const members = data.results[0].members;
    await this.cacheService.setData(
      CacheDataKeys.PROPUBLICA_FETCH_MEMBERS,
      members,
      {
        propublicaUrl: url,
      }
    );
    return members;
  }

  async fetchBills({
    chamber,
    offset,
    type,
  }: {
    chamber?: "house" | "senate";
    type: "introduced" | "updated";
    offset: number;
  }): Promise<ProPublicaBill[]> {
    const url = `${this.baseUrl}/118/${chamber ?? "both"}/bills/${type}.json${
      offset ? `?offset=${offset}` : ""
    }`;
    const cachedResponse = await this.cacheService.getData<ProPublicaBill[]>(
      CacheDataKeys.PROPUBLICA_FETCH_BILLS,
      { propublicaUrl: url }
    );
    if (cachedResponse) {
      return cachedResponse;
    }
    const response = await axios.get<PropublicaBillsResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    const bills = data.results?.[0]?.bills;
    await this.cacheService.setData(
      CacheDataKeys.PROPUBLICA_FETCH_BILLS,
      bills,
      {
        propublicaUrl: url,
      }
    );
    return bills;
  }

  async fetchSubjectsForBill(billId: string): Promise<string[]> {
    let offset = 0;
    let subjects = [];
    const url = `${this.baseUrl}/118/bills/${billId}/subjects.json?offset=${
      offset ?? 0
    }`;
    const cachedResponse = await this.cacheService.getData<string[]>(
      CacheDataKeys.PROPUBLICA_SUBJECTS_FOR_BILL,
      { propublicaUrl: url }
    );
    if (cachedResponse) {
      return cachedResponse;
    }
    const response = await axios.get<PropublicaSubjectsResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    const bill = data.results[0];
    subjects = bill.subjects.map((subject) => subject.name);
    let lastFetchedSubjectsLength = subjects.length;
    // Loop over until get all subjects
    while (lastFetchedSubjectsLength === 20) {
      offset += 20;
      const response = await axios.get<PropublicaSubjectsResponse>(url, {
        headers: {
          "X-API-Key": this.apiKey,
        },
      });
      const data = response.data;
      const bill = data.results[0];
      lastFetchedSubjectsLength = bill.subjects.length;
      subjects = subjects.concat(bill.subjects.map((subject) => subject.name));
    }

    await this.cacheService.setData(
      CacheDataKeys.PROPUBLICA_SUBJECTS_FOR_BILL,
      subjects,
      {
        propublicaUrl: url,
      }
    );

    return subjects;
  }

  async fetchCosponsorsForBill(billId: string): Promise<ProPublicaCosponsor[]> {
    const url = `${this.baseUrl}/118/bills/${billId}/cosponsors.json`;
    const cachedResponse = await this.cacheService.getData<
      ProPublicaCosponsor[]
    >(CacheDataKeys.PROPUBLICA_FETCH_COSPONSORS_FOR_BILL, {
      propublicaUrl: url,
    });
    if (cachedResponse) {
      return cachedResponse;
    }
    const response = await axios.get<PropublicaCosponsorsResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    const members = data.results[0].cosponsors;

    await this.cacheService.setData(
      CacheDataKeys.PROPUBLICA_FETCH_COSPONSORS_FOR_BILL,
      members,
      {
        propublicaUrl: url,
      }
    );
    return members;
  }

  async fetchVotesForBill(billCode: string) {
    const url = `${this.baseUrl}/118/bills/${billCode}.json`;
    const cachedResponse = await this.cacheService.getData<
      PropublicaBillVote[]
    >(CacheDataKeys.PROPUBLICA_FETCH_VOTES_FOR_BILL, { propublicaUrl: url });
    if (cachedResponse) {
      return cachedResponse;
    }
    const response = await axios.get<PropublicaBillByIdResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    const votes = data.results?.[0]?.votes;
    await this.cacheService.setData(
      CacheDataKeys.PROPUBLICA_FETCH_VOTES_FOR_BILL,
      votes,
      {
        propublicaUrl: url,
      }
    );
    return votes;
  }

  async fetchRepVotesForBillVote(voteUri: string) {
    const url = `${voteUri}`;
    const cachedResponse = await this.cacheService.getData<
      ProPublicaPosition[]
    >(CacheDataKeys.PROPUBLICA_FETCH_REP_VOTES_FOR_BILL_VOTE, {
      propublicaUrl: url,
    });
    if (cachedResponse) {
      return cachedResponse;
    }
    const response = await axios.get<PropublicaRollCallVoteByIdResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    const positions = data.results?.votes?.vote?.positions;
    await this.cacheService.setData(
      CacheDataKeys.PROPUBLICA_FETCH_REP_VOTES_FOR_BILL_VOTE,
      positions,
      {
        propublicaUrl: url,
      }
    );
    return positions;
  }

  async fetchUpcomingBills({
    chamber,
    offset = 0,
  }: {
    chamber: "house" | "senate";
    offset?: number;
  }): Promise<PropublicaUpcomingBill[]> {
    const url = `${this.baseUrl}/bills/upcoming/${chamber}.json${
      offset ? `?offset=${offset}` : ""
    }`;
    // Caching? Why?
    const response = await axios.get<PropublicaUpcomingBillsResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    const bills = data.results?.[0]?.bills;
    return bills;
  }
}

export default PropublicaService;
