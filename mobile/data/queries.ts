import { baseFetch } from "./fetch";

export const QUERY_GET_ME = "QUERY_GET_ME";
export const getMe = async () => {
  console.log("fetching user");
  const response = await baseFetch({
    url: "/users/me",
    method: "GET",
  });
  return response;
};
