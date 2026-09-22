import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PORT: number;
  NODE_ENV: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  EMAIL_HOST?: string;
  EMAIL_PORT?: number;
  EMAIL_USER?: string;
  EMAIL_PASSWORD?: string;
}

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

export const config: EnvConfig = {
  DATABASE_URL: getEnvVariable("DATABASE_URL"),
  JWT_SECRET: getEnvVariable("JWT_SECRET"),
  JWT_EXPIRES_IN: getEnvVariable("JWT_EXPIRES_IN", "7d"),
  PORT: parseInt(getEnvVariable("PORT", "5000"), 10),
  NODE_ENV: getEnvVariable("NODE_ENV", "development"),
  RATE_LIMIT_WINDOW_MS: parseInt(
    getEnvVariable("RATE_LIMIT_WINDOW_MS", "900000"),
    10
  ),
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    getEnvVariable("RATE_LIMIT_MAX_REQUESTS", "100"),
    10
  ),
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT
    ? parseInt(process.env.EMAIL_PORT, 10)
    : undefined,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
};
