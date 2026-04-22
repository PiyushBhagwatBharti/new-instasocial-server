import axios from "axios";
import { config } from "dotenv";
import { ApiError } from "../../utilities/asyncHandler.util";
config();

const CLIENT_ID = process.env.META_CLIENT_ID;
const CLIENT_SECRET = process.env.META_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:4000/auth/facebook/callback";

export const Facebook = {
  async callback(code) {
    // 1. Get USER access token
    const tokenRes = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          code,
        },
      },
    );

    const userAccessToken = tokenRes.data.access_token;

    // 2. Get PAGES (VERY IMPORTANT)
    const pagesRes = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts`,
      {
        params: { access_token: userAccessToken },
      },
    );

    console.log("pagesRes", pagesRes.data);

    if (!pagesRes.data.data.length) {
      throw new ApiError(400, "No pages found. Make sure you are ADMIN.");
    }

    const page = pagesRes.data.data[0];
    const pageId = page.id;
    const pageAccessToken = page.access_token;

    console.log({ pageId, pageAccessToken });

    // 👉 Save in DB in real app
    global.pageToken = pageAccessToken;
    global.pageId = pageId;
  },
};

const code = req.query.code;
