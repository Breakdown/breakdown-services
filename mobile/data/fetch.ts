import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Constants from "expo-constants";

export interface BaseFetchOptions {
  url: string;
  method?: "GET" | "POST" | "PATCH";
  headers?: { [key: string]: string };
  body?: any;
}

// TODO: Prod vs Local
const BASE_API_URI = `http://${Constants.manifest.debuggerHost
  .split(":")
  .shift()}:8080`;

export const baseFetch = async ({
  url,
  method,
  headers,
  body,
}: BaseFetchOptions) => {
  try {
    const cookieInAsyncStorage = await SecureStore.getItemAsync("session");
    const response = await axios(`${BASE_API_URI}${url}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookieInAsyncStorage && { Cookie: cookieInAsyncStorage }),
        ...headers,
      },
      data: JSON.stringify(body),
    });
    // Set cookies if they exist
    // TODO: Remove from async storage when a user is logged out
    if (response.headers["set-cookie"]?.[0]) {
      const cookie = response.headers["set-cookie"]?.[0];
      await SecureStore.setItemAsync("session", cookie);
    }
    return response;
  } catch (err) {
    console.error("error fetching", err);
    throw new Error(err);
  }
};