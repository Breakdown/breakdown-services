export interface BaseFetchOptions {
  url: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  headers?: { [key: string]: string };
  body?: any;
}

const BASE_API_URI = "http://10.0.0.217:8080";
// const BASE_API_URI = `http://${Constants.manifest.debuggerHost
//   .split(":")
//   .shift()}:8080`;

export const baseFetch = async ({
  url,
  method,
  headers,
  body,
}: BaseFetchOptions) => {
  console.log("fetching");
  const response = await fetch(`${BASE_API_URI}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  console.log("response", response);
  if (response.status === 200) {
    return response.json();
  } else {
    console.error("error", response.json());
    throw new Error(response.statusText);
  }
};
