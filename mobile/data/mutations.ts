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
  return response;
};

export const MUTATION_SIGNIN_SMS = "MUTATION_SIGNIN_SMS";
export const signInSMS = async ({ phoneNumber }: { phoneNumber: string }) => {
  const response = await baseFetch({
    url: "/auth/signin-sms",
    method: "POST",
    // Needs to be in format "+11234567890"
    body: { phone: phoneNumber },
  });
  return response;
};
