import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { Environment } from "../utils/env";
import { getDeviceId } from "../utils/device";
import {
  AccessTokenResponse,
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
  deviceId?: string;
}

// Query Constants
export const GET_BILL_BY_ID = "GET_BILL_BY_ID";
export const GET_BILL_SPONSOR = "GET_BILL_SPONSOR";
export const GET_FOLLOWING_BILLS = "GET_FOLLOWING_BILLS";
export const GET_ISSUES = "GET_ISSUES";
export const GET_ISSUE_BY_ID = "GET_ISSUE_BY_ID";
export const GET_UPCOMING_BILLS = "GET_UPCOMING_BILLS";
export const GET_USER_REP_SPONSORED_BILLS = "GET_USER_REP_SPONSORED_BILLS";
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

interface AppServiceResponse<T> {
  data: T;
}

const API_URL =
  process.env.NODE_ENV === Environment.Production
    ? ""
    : `http://${Constants.expoGoConfig.debuggerHost.split(":").shift()}:8080`;

const getJWT = async () => {
  return await SecureStore.getItemAsync("jwt");
};

const fetch = async <T>({
  url,
  method,
  headers,
  body,
  deviceId,
}: BaseFetchOptions): Promise<T> => {
  try {
    // Get cookie in async storage
    // If we're doing an auth request, don't include the cookie - no need to fetch
    const jwt = await getJWT();

    if (!deviceId) {
      const newDeviceId = await getDeviceId();
      deviceId = newDeviceId;
    }

    const response = await axios(`${API_URL}${url}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(jwt && { "x-access-token": jwt }),
        ...(deviceId && { "x-device-id": deviceId }),
        ...headers,
      },
      data: JSON.stringify(body),
    }).catch((err) => {
      // TODO: Display error here?
      throw new Error(err);
    });
    if (response.data?.data?.accessToken) {
      await SecureStore.setItemAsync("jwt", response.data.data.accessToken);
    }
    return response.data;
  } catch (err) {
    console.error(`error fetching url ${API_URL}${url}`, err);
    throw new Error(err);
  }
};

// Auth Module

// Email Signup
export const emailSignup = async ({
  email,
  password,
  receivePromotions,
}: {
  email: string;
  password: string;
  receivePromotions: boolean;
}) => {
  return fetch<AccessTokenResponse>({
    url: "/auth/email/signup",
    method: "POST",
    body: { email, password, receivePromotions },
  });
};
// Email Signin
export const emailSignin = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  return fetch<AccessTokenResponse>({
    url: "/auth/email/signin",
    method: "POST",
    body: { email, password },
  });
};
// SMS Signin
export const smsSignin = async ({ phone }: { phone: string }) => {
  return fetch<GenericSuccessBoolResponse>({
    url: "/auth/sms/signin",
    method: "POST",
    body: { phone },
  });
};
// SMS Signup
export const smsSignup = async ({ phone }: { phone: string }) => {
  return fetch<GenericSuccessBoolResponse>({
    url: "/auth/sms/signup",
    method: "POST",
    body: { phone },
  });
};
// SMS Signin Verify
export const smsSignupVerify = async ({ code }: { code: string }) => {
  return fetch<AccessTokenResponse>({
    url: "/auth/sms/signup/verify",
    method: "POST",
    body: { code },
  });
};
// SMS Signup Verify
export const smsSigninVerify = async ({ code }: { code: string }) => {
  return fetch<AccessTokenResponse>({
    url: "/auth/sms/signin/verify",
    method: "POST",
    body: { code },
  });
};
// Signout
export const signout = async () => {
  return fetch<GenericSuccessBoolResponse>({
    url: "/auth/signout",
    method: "POST",
  });
};

// Bills Module

// Get Bill by ID
export const getBillById = async ({
  id,
}: {
  id: string;
}): Promise<AppServiceResponse<Bill>> => {
  return fetch({
    url: `/bills/${id}`,
    method: "GET",
  });
};
// Get bill sponsor by bill ID
export const getBillSponsor = async ({
  id,
}: {
  id: string;
}): Promise<AppServiceResponse<Representative>> => {
  return fetch({
    url: `/bills/${id}/sponsor`,
    method: "GET",
  });
};
// Mark bill as seen by user
export const markBillAsSeen = async ({
  id,
}: {
  id: string;
}): Promise<GenericSuccessBoolResponse> => {
  return fetch({
    url: `/bills/${id}/seen`,
    method: "POST",
  });
};
// Following bill
export const setFollowingBill = async ({
  id,
  following,
}: {
  id: string;
  following: boolean;
}): Promise<GenericSuccessBoolResponse> => {
  return fetch({
    url: `/bills/${id}/follow`,
    method: "POST",
    body: { following },
  });
};
// Get following bills
export const getFollowingBills = async (): Promise<
  AppServiceResponse<Bill[]>
> => {
  return fetch({
    url: `/bills/following`,
    method: "GET",
  });
};
// Get user rep sponsored bills
export const getUserRepSponsoredBills = async (): Promise<
  AppServiceResponse<Bill[]>
> => {
  return fetch({
    url: `/bills/rep-sponsored`,
    method: "GET",
  });
};
// Get upcoming bills
export const getUpcomingBills = async (): Promise<
  AppServiceResponse<Bill[]>
> => {
  return fetch({
    url: `/bills/upcoming`,
    method: "GET",
  });
};

// Issues Module

// Get issues
export const getIssues = async (): Promise<AppServiceResponse<Issue[]>> => {
  return fetch({
    url: "/issues",
    method: "GET",
  });
};
// Get issue by ID
export const getIssueById = async ({
  id,
}: {
  id: string;
}): Promise<AppServiceResponse<Issue>> => {
  return fetch({
    url: `/issues/${id}`,
    method: "GET",
  });
};
// Get bills for issue by ID
export const getBillsForIssueId = async ({
  id,
}: {
  id: string;
}): Promise<AppServiceResponse<Bill[]>> => {
  return fetch({
    url: `/issues/${id}/bills`,
    method: "GET",
  });
};
// Get following issues
export const getFollowingIssues = async (): Promise<
  AppServiceResponse<Issue[]>
> => {
  return fetch({
    url: "/issues/following",
    method: "GET",
  });
};

// Location module

// Submit user location lat lon
export const submitUserLocationLatLon = async ({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
}): Promise<GenericSuccessBoolResponse> => {
  return fetch({
    url: "/location/latlon",
    method: "POST",
    body: { lat, lon },
  });
};
// Submit user location address
export const submitUserLocationAddress = async ({
  address,
}: {
  address: string;
}): Promise<GenericSuccessBoolResponse> => {
  return fetch({
    url: "/location/address",
    method: "POST",
    body: { address },
  });
};

// Reps Module

// Get rep by ID
export const getRepById = async ({
  id,
}: {
  id: string;
}): Promise<AppServiceResponse<Representative>> => {
  return fetch({
    url: `/reps/${id}`,
    method: "GET",
  });
};
// Get rep stats by ID
export const getRepStatsById = async ({
  id,
}: {
  id: string;
}): Promise<AppServiceResponse<RepresentativeStats>> => {
  return fetch({
    url: `/reps/${id}/stats`,
    method: "GET",
  });
};
// Get rep votes by ID
export const getRepVotesById = async ({
  id,
}: {
  id: string;
}): Promise<AppServiceResponse<RepresentativeVote[]>> => {
  return fetch({
    url: `/reps/${id}/votes`,
    method: "GET",
  });
};
// Get rep bills sponsored by ID
export const getRepBillsSponsored = async ({
  id,
}: {
  id: string;
}): Promise<AppServiceResponse<Bill[]>> => {
  return fetch({
    url: `/reps/${id}/bills/sponsored`,
    method: "GET",
  });
};
// Get rep bills cosponsored by ID
export const getRepBillsCosponsored = async ({
  id,
}: {
  id: string;
}): Promise<AppServiceResponse<Bill[]>> => {
  return fetch({
    url: `/reps/${id}/bills/cosponsored`,
    method: "GET",
  });
};
// Following rep
export const setFollowingRep = async ({
  id,
  following,
}: {
  id: string;
  following: boolean;
}): Promise<GenericSuccessBoolResponse> => {
  return fetch({
    url: `/reps/${id}/following`,
    method: "POST",
    body: { following },
  });
};
// Get following reps
export const getFollowingReps = async (): Promise<
  AppServiceResponse<Representative[]>
> => {
  return fetch({
    url: "/reps/following",
    method: "GET",
  });
};
// Get local reps
export const getLocalReps = async (): Promise<
  AppServiceResponse<Representative[]>
> => {
  return fetch({
    url: "/reps/local",
    method: "GET",
  });
};
// Get rep vote on bill
export const getRepVoteOnBill = async ({
  id,
  billId,
}: {
  id: string;
  billId: string;
}): Promise<AppServiceResponse<RepresentativeVote | null>> => {
  return fetch({
    url: `/reps/${id}/bills/${billId}/vote`,
    method: "GET",
  });
};

// Users Module

// Get me
export const getMe = async (): Promise<AppServiceResponse<User>> => {
  return fetch({
    url: "/users/me",
    method: "GET",
  });
};
// Patch me
export const patchMe = async ({
  name,
}: {
  name: string;
}): Promise<AppServiceResponse<User>> => {
  return fetch({
    url: "/users/me",
    method: "PATCH",
    body: { name },
  });
};

// Votes Module

// Vote on bill
export const voteOnBill = async ({
  billId,
  position,
}: {
  billId: string;
  position: boolean;
}): Promise<AppServiceResponse<UserBillVote>> => {
  return fetch({
    url: `/votes/${billId}`,
    method: "POST",
    body: { position },
  });
};

// Get my vote on bill
export const getMyVoteOnBill = async ({
  billId,
}: {
  billId: string;
}): Promise<AppServiceResponse<UserBillVote>> => {
  return fetch({
    url: `/votes/${billId}/me`,
    method: "GET",
  });
};
