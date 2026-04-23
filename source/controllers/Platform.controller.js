import { asyncHandler } from "../utilities/asyncHandler.util";
const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=pages_manage_posts,pages_read_engagement,pages_show_list,business_management,instagram_basic,instagram_content_publish`;
res.redirect(url);

export const PlatformController = {
  create: asyncHandler(async (req, res) => {}),
};
