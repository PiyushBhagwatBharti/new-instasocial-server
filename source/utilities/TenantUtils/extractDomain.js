import { parse } from "tldts";

export const extractDomain = (req) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  console.log({ host });
  if (!host) return null;
  const parsed = parse(host);
  // console.log({ parsed });
  if (!parsed.subdomain) return null;
  return parsed.subdomain;
};
