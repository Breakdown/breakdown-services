import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { Environment, getEnv } from "../utils/env";
import { getDeviceId } from "../utils/device";

interface BaseFetchOptions {
  url: string;
  method?: "GET" | "POST" | "PATCH";
  headers?: { [key: string]: string };
  body?: any;
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

  async fetch({ url, method, headers, body }: BaseFetchOptions) {
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
      return response;
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
    return this.fetch({
      url: "/auth/email/signup",
      method: "POST",
      body: { email, password, receivePromotions },
    });
  }
  // Email Signin
  async emailSignin({ email, password }: { email: string; password: string }) {
    return this.fetch({
      url: "/auth/email/signin",
      method: "POST",
      body: { email, password },
    });
  }
  // SMS Signin
  async smsSignin({ phone }: { phone: string }) {
    const deviceId = await getDeviceId();
    return this.fetch({
      url: "/auth/sms/signin",
      method: "POST",
      body: { phone, deviceId },
    });
  }
  // SMS Signup
  async smsSignup({ phone }: { phone: string }) {
    const deviceId = await getDeviceId();
    return this.fetch({
      url: "/auth/sms/signup",
      method: "POST",
      body: { phone, deviceId },
    });
  }
  // SMS Signin Verify
  async smsSignupVerify({ code }: { code: string }) {
    const deviceId = await getDeviceId();
    return this.fetch({
      url: "/auth/sms/signup/verify",
      method: "POST",
      body: { deviceId, code },
    });
  }
  // SMS Signup Verify
  async smsSigninVerify({ code }: { code: string }) {
    const deviceId = await getDeviceId();
    return this.fetch({
      url: "/auth/sms/signin/verify",
      method: "POST",
      body: { deviceId, code },
    });
  }
  // Signout
  async signout() {
    return this.fetch({
      url: "/auth/signout",
      method: "POST",
    });
  }

  // Bills Module

  // Get Bill by ID
  async getBillById({ id }: { id: string }) {
    return this.fetch({
      url: `/bills/${id}`,
      method: "GET",
    });
  }
  // Get bill sponsor by bill ID
  async getBillSponsor({ id }: { id: string }) {
    return this.fetch({
      url: `/bills/${id}/sponsor`,
      method: "GET",
    });
  }
  // Mark bill as seen by user
  async markBillAsSeen({ id }: { id: string }) {
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
  }) {
    return this.fetch({
      url: `/bills/${id}/follow`,
      method: "POST",
      body: { following },
    });
  }
  // Get following bills
  async getFollowingBills() {
    return this.fetch({
      url: `/bills/following`,
      method: "GET",
    });
  }

  // Issues Module

  // Get issues
  async getIssues() {
    return this.fetch({
      url: "/issues",
      method: "GET",
    });
  }
  // Get issue by ID
  async getIssueById({ id }: { id: string }) {
    return this.fetch({
      url: `/issues/${id}`,
      method: "GET",
    });
  }
  // Get bills for issue by ID
  async getBillsForIssueId({ id }: { id: string }) {
    return this.fetch({
      url: `/issues/${id}/bills`,
      method: "GET",
    });
  }
  // Get following issues
  async getFollowingIssues() {
    return this.fetch({
      url: "/issues/following",
      method: "GET",
    });
  }

  // Location module

  // Submit user location lat lon
  async submitUserLocationLatLon({ lat, lon }: { lat: number; lon: number }) {
    return this.fetch({
      url: "/location/latlon",
      method: "POST",
      body: { lat, lon },
    });
  }
  // Submit user location address
  async submitUserLocationAddress({ address }: { address: string }) {
    return this.fetch({
      url: "/location/address",
      method: "POST",
      body: { address },
    });
  }

  // Reps Module

  // Get rep by ID
  async getRepById({ id }: { id: string }) {
    return this.fetch({
      url: `/reps/${id}`,
      method: "GET",
    });
  }
  // Get rep stats by ID
  async getRepStatsById({ id }: { id: string }) {
    return this.fetch({
      url: `/reps/${id}/stats`,
      method: "GET",
    });
  }
  // Get rep votes by ID
  async getRepVotesById({ id }: { id: string }) {
    return this.fetch({
      url: `/reps/${id}/votes`,
      method: "GET",
    });
  }
  // Get rep bills sponsored by ID
  async getRepBillsSponsored({ id }: { id: string }) {
    return this.fetch({
      url: `/reps/${id}/bills/sponsored`,
      method: "GET",
    });
  }
  // Get rep bills cosponsored by ID
  async getRepBillsCosponsored({ id }: { id: string }) {
    return this.fetch({
      url: `/reps/${id}/bills/cosponsored`,
      method: "GET",
    });
  }
  // Following rep
  async setFollowingRep({ id, following }: { id: string; following: boolean }) {
    return this.fetch({
      url: `/reps/${id}/follow`,
      method: "POST",
      body: { following },
    });
  }
  // Get following reps
  async getFollowingReps() {
    return this.fetch({
      url: "/reps/following",
      method: "GET",
    });
  }
  // Get local reps
  async getLocalReps() {
    return this.fetch({
      url: "/reps/local",
      method: "GET",
    });
  }
  // Get rep vote on bill
  async getRepVoteOnBill({ id, billId }: { id: string; billId: string }) {
    return this.fetch({
      url: `/reps/${id}/bills/${billId}/vote`,
      method: "GET",
    });
  }

  // Users Module

  // Get me
  async getMe() {
    return this.fetch({
      url: "/users/me",
      method: "GET",
    });
  }
  // Patch me
  async patchMe({ name }: { name: string }) {
    return this.fetch({
      url: "/users/me",
      method: "PATCH",
      body: { name },
    });
  }
}

export default AppService;
