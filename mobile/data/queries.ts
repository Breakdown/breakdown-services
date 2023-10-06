import { BreakdownIssue } from "../types/api";
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
export const getBillById = async (billId: string) => {
  const response = await baseFetch({
    url: `/bills/${billId}`,
    method: "GET",
  });
  return response;
};

export const QUERY_GET_YOUR_REPS = "QUERY_GET_YOUR_REPS";
export const getYourReps = async () => {
  const response = await baseFetch({
    url: "/users/representatives",
    method: "GET",
  });
  return response;
};

export const QUERY_GET_ALL_ISSUES = "QUERY_GET_ALL_ISSUES";
export const getAllIssues = async (): Promise<BreakdownIssue[]> => {
  const response = await baseFetch({
    url: "/issues",
    method: "GET",
  });
  return response.data.data;
}

export const QUERY_GET_YOUR_ISSUES = "QUERY_GET_YOUR_ISSUES";
export const getYourIssues = async (): Promise<BreakdownIssue[]> => {
  const response = await baseFetch({
    url: "/users/issues",
    method: "GET",
  });
  return response.data.data;
};