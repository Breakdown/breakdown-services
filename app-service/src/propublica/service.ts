import axios from "axios";
import InternalError from "../utils/errors/InternalError.js";
import {
  ProPublicaBill,
  PropublicaBillsResponse,
  PropublicaMember,
  PropublicaMembersResponse,
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
    const bills = data.results[0].bills;
    return bills;
  }

  async fetchSubjectsForBill(billId: string): Promise<string[]> {
    const url = `${this.baseUrl}/bills/${billId}/subjects.json`;
    const response = await axios.get<PropublicaSubjectsResponse>(url, {
      headers: {
        "X-API-Key": this.apiKey,
      },
    });
    const data = response.data;
    const bill = data.results[0];
    return bill.subjects.map((subject) => subject.name);
  }
}

export default PropublicaService;
