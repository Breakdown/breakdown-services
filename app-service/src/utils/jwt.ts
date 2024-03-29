import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "secret";

export interface SignedJWT {
  id: string;
}

export const generateJwt = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, {
    algorithm: "HS256",
    allowInsecureKeySizes: true,
    expiresIn: 86400 * 30, // 30 days
  });
};
