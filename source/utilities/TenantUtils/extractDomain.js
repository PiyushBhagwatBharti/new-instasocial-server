import { parse } from "tldts";

export const extractDomain = (req) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (!host) return null;
  const parsed = parse(host);
  if (!parsed.domain) return null;
  return parsed.domain;
};
