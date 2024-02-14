import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { Environment, getEnv } from "../utils/env";
import { getDeviceId } from "../utils/device";
import {
  Bill,
  Issue,
  Representative,
  RepresentativeStats,
  RepresentativeVote,
  User,
  UserBillVote,
} from "./types";

interface BaseFetchOptions {
  url: string;
  method?: "GET" | "POST" | "PATCH";
  headers?: { [key: string]: string };
  body?: any;
}

// Query Constants
export const GET_BILL_BY_ID = "GET_BILL_BY_ID";
export const GET_BILL_SPONSOR = "GET_BILL_SPONSOR";
export const GET_FOLLOWING_BILLS = "GET_FOLLOWING_BILLS";
export const GET_ISSUES = "GET_ISSUES";
export const GET_ISSUE_BY_ID = "GET_ISSUE_BY_ID";
export const GET_BILLS_FOR_ISSUE_ID = "GET_BILLS_FOR_ISSUE_ID";
export const GET_FOLLOWING_ISSUES = "GET_FOLLOWING_ISSUES";
export const GET_REP_BY_ID = "GET_REP_BY_ID";
export const GET_REP_STATS_BY_ID = "GET_REP_STATS_BY_ID";
export const GET_REP_VOTES_BY_ID = "GET_REP_VOTES_BY_ID";
export const GET_REP_BILLS_SPONSORED = "GET_REP_BILLS_SPONSORED";
export const GET_REP_BILLS_COSPONSORED = "GET_REP_BILLS_COSPONSORED";
export const GET_FOLLOWING_REPS = "GET_FOLLOWING_REPS";
export const GET_LOCAL_REPS = "GET_LOCAL_REPS";
export const GET_REP_VOTE_ON_BILL = "GET_REP_VOTE_ON_BILL";
export const GET_MY_VOTE_ON_BILL = "GET_MY_VOTE_ON_BILL";
export const GET_ME = "GET_ME";

// Response interfaces
interface GenericSuccessBoolResponse {
  data: {
    success: boolean;
  };
}

class AppService {
  apiUrl: string;
  sessionCookie: string | null = null;
  constructor() {
    const env = getEnv();
    this.apiUrl = (() => {
      if (env === Environment.Production) {
        // TODO: Production URL
        return "https://api.example.com";
      }
      return `http://${Constants.expoGoConfig.debuggerHost
        .split(":")
        .shift()}:8080`;
    })();
  }

  async initialize() {
    this.sessionCookie = await SecureStore.getItemAsync("session");
  }

  async fetch<T>({ url, method, headers, body }: BaseFetchOptions): Promise<T> {
    try {
      // Get cookie in async storage
      // If we're doing an auth request, don't include the cookie - no need to fetch
      // Should be stashed in this.sessionCookie
      // If not, get it from async storage and set it to this.sessionCookie for next request
      const cookieInAsyncStorage = await (async () => {
        if (url.includes("/auth") && !url.includes("/signout")) {
          return null;
        }
        return (
          this.sessionCookie ||
          // Set if not defined already, since we're doing the request anyway
          (await (async () => {
            this.sessionCookie = await SecureStore.getItemAsync("session");
            return this.sessionCookie;
          })())
        );
      })();

      const response = await axios(`${this.apiUrl}${url}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(cookieInAsyncStorage && { Cookie: cookieInAsyncStorage }),
          ...headers,
        },
        data: JSON.stringify(body),
      }).catch((err) => {
        throw new Error(err);
      });
      // Set cookies if they exist
      // TODO: Remove from async storage when a user is logged out
      if (response.headers["set-cookie"]?.[0]) {
        // TODO: Find correct cookie, not just first
        const cookie = response.headers["set-cookie"]?.[0];
        await SecureStore.setItemAsync("session", cookie);
      }
      return response.data;
    } catch (err) {
      console.error(`error fetching url ${this.apiUrl}${url}`, err);
      throw new Error(err);
    }
  }

  // Auth Module

  // Email Signup
  async emailSignup({
    email,
    password,
    receivePromotions,
  }: {
    email: string;
    password: string;
    receivePromotions: boolean;
  }) {
    return this.fetch<GenericSuccessBoolResponse>({
      url: "/auth/email/signup",
      method: "POST",
      body: { email, password, receivePromotions },
    });
  }
  // Email Signin
  async emailSignin({ email, password }: { email: string; password: string }) {
    return this.fetch<GenericSuccessBoolResponse>({
      url: "/auth/email/signin",
      method: "POST",
      body: { email, password },
    });
  }
  // SMS Signin
  async smsSignin({ phone }: { phone: string }) {
    const deviceId = await getDeviceId();
    return this.fetch<GenericSuccessBoolResponse>({
      url: "/auth/sms/signin",
      method: "POST",
      body: { phone, deviceId },
    });
  }
  // SMS Signup
  async smsSignup({ phone }: { phone: string }) {
    const deviceId = await getDeviceId();
    return this.fetch<GenericSuccessBoolResponse>({
      url: "/auth/sms/signup",
      method: "POST",
      body: { phone, deviceId },
    });
  }
  // SMS Signin Verify
  async smsSignupVerify({ code }: { code: string }) {
    const deviceId = await getDeviceId();
    return this.fetch<GenericSuccessBoolResponse>({
      url: "/auth/sms/signup/verify",
      method: "POST",
      body: { deviceId, code },
    });
  }
  // SMS Signup Verify
  async smsSigninVerify({ code }: { code: string }) {
    const deviceId = await getDeviceId();
    return this.fetch<GenericSuccessBoolResponse>({
      url: "/auth/sms/signin/verify",
      method: "POST",
      body: { deviceId, code },
    });
  }
  // Signout
  async signout() {
    return this.fetch<GenericSuccessBoolResponse>({
      url: "/auth/signout",
      method: "POST",
    });
  }

  // Bills Module

  // Get Bill by ID
  async getBillById({ id }: { id: string }): Promise<Bill> {
    return this.fetch({
      url: `/bills/${id}`,
      method: "GET",
    });
  }
  // Get bill sponsor by bill ID
  async getBillSponsor({ id }: { id: string }): Promise<Representative> {
    return this.fetch({
      url: `/bills/${id}/sponsor`,
      method: "GET",
    });
  }
  // Mark bill as seen by user
  async markBillAsSeen({
    id,
  }: {
    id: string;
  }): Promise<GenericSuccessBoolResponse> {
    return this.fetch({
      url: `/bills/${id}/seen`,
      method: "POST",
    });
  }
  // Following bill
  async setFollowingBill({
    id,
    following,
  }: {
    id: string;
    following: boolean;
  }): Promise<GenericSuccessBoolResponse> {
    return this.fetch({
      url: `/bills/${id}/follow`,
      method: "POST",
      body: { following },
    });
  }
  // Get following bills
  async getFollowingBills(): Promise<Bill[]> {
    return this.fetch({
      url: `/bills/following`,
      method: "GET",
    });
  }

  // Issues Module

  // Get issues
  async getIssues(): Promise<Issue[]> {
    return this.fetch({
      url: "/issues",
      method: "GET",
    });
  }
  // Get issue by ID
  async getIssueById({ id }: { id: string }): Promise<Issue> {
    return this.fetch({
      url: `/issues/${id}`,
      method: "GET",
    });
  }
  // Get bills for issue by ID
  async getBillsForIssueId({ id }: { id: string }): Promise<Bill[]> {
    return this.fetch({
      url: `/issues/${id}/bills`,
      method: "GET",
    });
  }
  // Get following issues
  async getFollowingIssues(): Promise<Issue[]> {
    return this.fetch({
      url: "/issues/following",
      method: "GET",
    });
  }

  // Location module

  // Submit user location lat lon
  async submitUserLocationLatLon({
    lat,
    lon,
  }: {
    lat: number;
    lon: number;
  }): Promise<GenericSuccessBoolResponse> {
    return this.fetch({
      url: "/location/latlon",
      method: "POST",
      body: { lat, lon },
    });
  }
  // Submit user location address
  async submitUserLocationAddress({
    address,
  }: {
    address: string;
  }): Promise<GenericSuccessBoolResponse> {
    return this.fetch({
      url: "/location/address",
      method: "POST",
      body: { address },
    });
  }

  // Reps Module

  // Get rep by ID
  async getRepById({ id }: { id: string }): Promise<Representative> {
    return this.fetch({
      url: `/reps/${id}`,
      method: "GET",
    });
  }
  // Get rep stats by ID
  async getRepStatsById({ id }: { id: string }): Promise<RepresentativeStats> {
    return this.fetch({
      url: `/reps/${id}/stats`,
      method: "GET",
    });
  }
  // Get rep votes by ID
  async getRepVotesById({ id }: { id: string }): Promise<RepresentativeVote[]> {
    return this.fetch({
      url: `/reps/${id}/votes`,
      method: "GET",
    });
  }
  // Get rep bills sponsored by ID
  async getRepBillsSponsored({ id }: { id: string }): Promise<Bill[]> {
    return this.fetch({
      url: `/reps/${id}/bills/sponsored`,
      method: "GET",
    });
  }
  // Get rep bills cosponsored by ID
  async getRepBillsCosponsored({ id }: { id: string }): Promise<Bill[]> {
    return this.fetch({
      url: `/reps/${id}/bills/cosponsored`,
      method: "GET",
    });
  }
  // Following rep
  async setFollowingRep({
    id,
    following,
  }: {
    id: string;
    following: boolean;
  }): Promise<GenericSuccessBoolResponse> {
    return this.fetch({
      url: `/reps/${id}/follow`,
      method: "POST",
      body: { following },
    });
  }
  // Get following reps
  async getFollowingReps(): Promise<Representative[]> {
    return this.fetch({
      url: "/reps/following",
      method: "GET",
    });
  }
  // Get local reps
  async getLocalReps(): Promise<Representative[]> {
    return this.fetch({
      url: "/reps/local",
      method: "GET",
    });
  }
  // Get rep vote on bill
  async getRepVoteOnBill({
    id,
    billId,
  }: {
    id: string;
    billId: string;
  }): Promise<RepresentativeVote | null> {
    return this.fetch({
      url: `/reps/${id}/bills/${billId}/vote`,
      method: "GET",
    });
  }

  // Users Module

  // Get me
  async getMe(): Promise<User> {
    return this.fetch({
      url: "/users/me",
      method: "GET",
    });
  }
  // Patch me
  async patchMe({ name }: { name: string }): Promise<User> {
    return this.fetch({
      url: "/users/me",
      method: "PATCH",
      body: { name },
    });
  }

  // Votes Module

  // Vote on bill
  async voteOnBill({
    billId,
    position,
  }: {
    billId: string;
    position: boolean;
  }): Promise<UserBillVote> {
    return this.fetch({
      url: `/votes/${billId}`,
      method: "POST",
      body: { position },
    });
  }

  // Get my vote on bill
  async getMyVoteOnBill({ billId }: { billId: string }): Promise<UserBillVote> {
    return this.fetch({
      url: `/votes/${billId}/me`,
      method: "GET",
    });
  }
}

export default AppService;
