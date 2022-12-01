import { baseFetch } from "./fetch";

export const MUTATION_SIGNIN_EMAIL = "MUTATION_SIGNIN_EMAIL";
export const signInEmailPassword = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const response = await baseFetch({
    url: "/auth/signin",
    method: "POST",
    body: { email, password },
  });
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(response.statusText);
  }
};

export const signInSMS = async (phoneNumber: string) => {};
