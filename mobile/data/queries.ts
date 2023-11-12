import { BreakdownBill, BreakdownIssue, BreakdownRep, UserVote } from "../types/api";
import { baseFetch } from "./fetch";

export const QUERY_GET_ME = "QUERY_GET_ME";
export const getMe = async () => {
  const response = await baseFetch({
    url: "/users/me",
    method: "GET",
  });
  return response;
};

// TODO: Pagination
// Make sure to include pagination parameters in query key
export const QUERY_GET_BILLS = "QUERY_GET_BILLS";
export const getBills = async () => {
  const response = await baseFetch({
    url: "/bills",
    method: "GET",
  });
  return response;
};

export const QUERY_GET_BILL = "QUERY_GET_BILL";
export const getBillById = async (billId: string): Promise<BreakdownBill> => {
  const response = await baseFetch({
    url: `/bills/${billId}`,
    method: "GET",
  });
  return response.data?.data;
};

export const QUERY_GET_BILL_SPONSOR = "QUERY_GET_BILL_SPONSOR";
export const getBillSponsorById = async (billId: string): Promise<BreakdownBill> => {
  const response = await baseFetch({
    url: `/bills/${billId}/sponsor`,
    method: "GET",
  });
  return response.data?.data;
};

export const QUERY_GET_BILL_ISSUES = "QUERY_GET_BILL_ISSUES";
export const getBillIssuesById = async (billId: string): Promise<BreakdownIssue[]> => {
  const response = await baseFetch({
    url: `/bills/${billId}/issues`,
    method: "GET",
  });
  return response.data?.data;
};

interface GetYourRepsResponse {
  following: BreakdownRep[];
  local: BreakdownRep[];
}
export const QUERY_GET_YOUR_REPS = "QUERY_GET_YOUR_REPS";
export const getYourReps = async (): Promise<GetYourRepsResponse> => {
  const response = await baseFetch({
    url: "/users/representatives",
    method: "GET",
  });
  return response?.data?.data;
};

export const QUERY_GET_ALL_ISSUES = "QUERY_GET_ALL_ISSUES";
export const getAllIssues = async (): Promise<BreakdownIssue[]> => {
  const response = await baseFetch({
    url: "/issues",
    method: "GET",
  });
  return response?.data?.data;
}

export const QUERY_GET_YOUR_ISSUES = "QUERY_GET_YOUR_ISSUES";
export const getYourIssues = async (): Promise<BreakdownIssue[]> => {
  const response = await baseFetch({
    url: "/users/issues",
    method: "GET",
  });
  return response?.data?.data;
};

export const QUERY_GET_ISSUE = "QUERY_GET_ISSUE";
export const getIssueById = async (issueId: string): Promise<BreakdownIssue> => {
  const response = await baseFetch({
    url: `/issues/${issueId}`,
    method: "GET",
  });
  return response?.data?.data;
};

export const QUERY_GET_REP = "QUERY_GET_REP";
export const getRepById = async (repId: string): Promise<BreakdownRep> => {
  const response = await baseFetch({
    url: `/reps/${repId}`,
    method: "GET",
  });
  return response?.data?.data;
};

export const QUERY_GET_USER_VOTE_ON_BILL = "QUERY_GET_USER_VOTE_ON_BILL";
export const getUserVoteOnBill = async ({
  billId,
}: {
  billId: string;
}): Promise<{ vote: boolean }> => {
  const response = await baseFetch({
    url: `/votes/${billId}`,
    method: "GET",
  });
  return response?.data?.data;
}