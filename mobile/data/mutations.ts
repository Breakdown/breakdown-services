import { baseFetch } from "./fetch";

export const MUTATION_SIGNUP_EMAIL = "MUTATION_SIGNUP_EMAIL";
export const signUpEmailPassword = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const response = await baseFetch({
    url: "/auth/signup",
    method: "POST",
    body: { email, password },
  });
  return response;
};

export const MUTATION_SIGNUP_SMS = "MUTATION_SIGNUP_SMS";
export const signUpSMS = async ({ phoneNumber }: { phoneNumber: string }) => {
  const response = await baseFetch({
    url: "/auth/signup-sms",
    method: "POST",
    // Needs to be in format "+11234567890"
    body: { phone: phoneNumber },
  });
  return response;
};

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

export const MUTATION_VERIFY_SMS = "MUTATION_VERIFY_SMS";
export const verifyCodeSMS = async ({
  phoneNumber,
  verificationCode,
}: {
  verificationCode: string;
  phoneNumber: string;
}) => {
  const response = await baseFetch({
    url: "/auth/verify-sms",
    method: "POST",
    body: { phone: phoneNumber, code: verificationCode },
  });
  return response;
};

export const MUTATION_SUBMIT_ISSUES = "MUTATION_SUBMIT_ISSUES";
export const submitIssuesInterests = async ({
  issueIds,
}: {
  issueIds: string[];
}) => {
  const requests = issueIds.map((issueId) =>
    baseFetch({
      url: `/issues/${issueId}/follow`,
      method: "POST",
    })
  );
  const response = await Promise.all(requests);
  
  return response;
}