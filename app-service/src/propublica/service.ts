import axios from "axios";
import InternalError from "../utils/errors/InternalError.js";
import {
  ProPublicaBill,
  ProPublicaCosponsor,
  PropublicaBillByIdResponse,
  PropublicaBillsResponse,
  PropublicaCosponsorsResponse,
  PropublicaMember,
  PropublicaMembersResponse,
  PropublicaRollCallVoteByIdResponse,
  PropublicaSubjectsResponse,
} from "./types.js";

class PropublicaService {
  pageSize: number = 20;
  apiKey: string;
  baseUrl: string = "https://api.propublica.org/congress/v1";
  constructor() {
    if (!process.env.PROPUBLICA_API_KEY) {
      throw new InternalError("Missing ProPublica API Key");
    }
    this.apiKey = process.env.PROPUBLICA_API_KEY;
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
    const response = await axios.get<PropublicaMembersResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    const members = data.results[0].members;
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
    const response = await axios.get<PropublicaBillsResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    const bills = data.results?.[0]?.bills;
    return bills;
  }

  async fetchSubjectsForBill(billId: string): Promise<string[]> {
    let offset = 0;
    let subjects = [];
    const url = `${this.baseUrl}/118/bills/${billId}/subjects.json?offset=${
      offset ?? 0
    }`;
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

    return subjects;
  }

  async fetchCosponsorsForBill(billId: string): Promise<ProPublicaCosponsor[]> {
    const url = `${this.baseUrl}/118/bills/${billId}/cosponsors.json`;
    const response = await axios.get<PropublicaCosponsorsResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    const members = data.results[0].cosponsors;
    return members;
  }

  async fetchVotesForBill(billCode: string) {
    const url = `${this.baseUrl}/118/bills/${billCode}.json`;
    const response = await axios.get<PropublicaBillByIdResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    return data.results?.[0]?.votes;
  }

  async fetchRepVotesForBillVote(voteUri: string) {
    const url = `${voteUri}`;
    const response = await axios.get<PropublicaRollCallVoteByIdResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    return data.results?.votes?.vote?.positions;
  }
}

export default PropublicaService;
