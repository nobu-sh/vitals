import { resolve } from 'node:path'
import { config } from 'dotenv'

const Path = resolve(__dirname, '../.env');
config({ path: Path });

function getVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export const Key = getVar('KEY');
export const RtcUrl = getVar('RTC_URL');
export const RtcKey = getVar('RTC_KEY');
export const Port = parseInt(getVar('PORT'));
