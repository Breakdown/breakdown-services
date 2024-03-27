export enum Environment {
  Local = "local",
  Production = "production",
}

export const getEnv = () => {
  const env = process.env.NODE_ENV;
  if (env === "production") {
    return Environment.Production;
  }
  return Environment.Local;
};
