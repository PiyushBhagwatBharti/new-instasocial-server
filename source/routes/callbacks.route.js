import { Router } from "express";
import {
  connectFB,
  connectWhatsApp,
} from "../services/socialServices/facebook.service.js";
import { asyncHandler } from "../utilities/asyncHandler.util.js";
import { TenantModel } from "../models/tenant.model.js";
import { PlatformService } from "../services/Platform.service.js";
import { setTenantContext } from "../utilities/TenantUtils/tenantContext.js";

export const CallbackRouter = Router();

CallbackRouter.get(
  "/facebook",
  asyncHandler(async (req, res) => {
    const { code, state } = req.query;
    console.log({ state });

    const parsedState = JSON.parse(decodeURIComponent(state));
    const { tenantId, userId } = parsedState;
    const tenant = await TenantModel.findById({ _id: tenantId });

    console.log("This code belongs to user:", tenantId);

    const { pageId, pageAccessToken, userAccessToken } = await connectFB(code);

    const { facebookPlatform, instaPlatform, whatsappPlatform } =
      await setTenantContext(tenantId, async () => {
        const facebookPlatform = await PlatformService.create({
          meta: { pageId, pageAccessToken },
          auth: { accessToken: pageAccessToken },
          platform: "facebook",
          tenantId,
          connectedBy: userId,
        });
        console.log("[META CALLBACK] Facebook added");

        const instaPlatform = await PlatformService.create({
          meta: { pageId, pageAccessToken },
          auth: { accessToken: pageAccessToken },
          platform: "instagram",
          tenantId,
          connectedBy: userId,
        });
        console.log("[META CALLBACK] Instagram added");

        const { wabaId, phoneNumberId, displayNumber } =
          await connectWhatsApp(userAccessToken);

        const whatsappPlatform = await PlatformService.create({
          platform: "whatsapp",
          tenantId,
          connectedBy: userId,
          auth: {
            accessToken: userAccessToken,
          },
          meta: {
            wabaId,
            phoneNumberId,
            displayNumber,
          },
          profile: {
            name: displayNumber, // shown in frontend platform cards
            handle: displayNumber,
          },
        });
        console.log("[META CALLBACK] Whatsapp added");

        return { facebookPlatform, instaPlatform, whatsappPlatform };
      });
    res.redirect(`http://${tenant.domain}.localhost:5173/home/`);
  }),
);

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN; // any string you set

// ================================================
// STEP 1: Verification handshake (one time setup)
// Meta calls this when you register the webhook URL
// ================================================
WebhookRouter.get(
  "/whatsapp",
  asyncHandler(async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WhatsApp webhook verified");
      return res.status(200).send(challenge);
    }

    res.sendStatus(403);
  }),
);

// ================================================
// STEP 2: Incoming events
// ================================================
WebhookRouter.post(
  "/whatsapp",
  asyncHandler(async (req, res) => {
    // Always return 200 immediately — Meta will retry if you don't
    res.sendStatus(200);

    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;

        // Find which tenant this phone number belongs to
        const phoneNumberId = value.metadata?.phone_number_id;
        const platform = await PlatformModel.findOne({
          platform: "whatsapp",
          "meta.phoneNumberId": phoneNumberId,
        });

        if (!platform) {
          console.warn(
            "[WA WEBHOOK] No tenant found for phoneNumberId:",
            phoneNumberId,
          );
          continue;
        }

        const tenantId = platform.tenantId;

        // ── Incoming messages from users ──────────────────
        if (value.messages) {
          for (const msg of value.messages) {
            await handleIncomingMessage({ msg, tenantId, platform });
          }
        }

        // ── Delivery / read status updates ────────────────
        if (value.statuses) {
          for (const status of value.statuses) {
            await handleStatusUpdate({ status, tenantId });
          }
        }

        // ── Template approved / rejected ──────────────────
        if (change.field === "message_template_status_update") {
          await handleTemplateStatus({ value, tenantId });
        }
      }
    }
  }),
);

// ================================================
// Handlers
// ================================================

async function handleIncomingMessage({ msg, tenantId, platform }) {
  console.log("[WA WEBHOOK] Incoming message:", {
    tenantId,
    from: msg.from,
    type: msg.type,
    messageId: msg.id,
    text: msg.text?.body,
  });

  // Handle different message types
  switch (msg.type) {
    case "text":
      // msg.text.body
      break;

    case "image":
    case "video":
    case "audio":
    case "document":
      // msg[msg.type].id  ← media ID, fetch separately if needed
      break;

    case "interactive":
      // button reply: msg.interactive.button_reply.id
      // list reply:   msg.interactive.list_reply.id
      const replyId =
        msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id;
      console.log("[WA WEBHOOK] Button/list reply:", replyId);
      break;

    case "location":
      // msg.location.latitude, msg.location.longitude
      break;
  }

  // 👉 Save to DB, emit via socket, trigger auto-reply, etc.
  // await MessageModel.create({ tenantId, from: msg.from, ... })
  // io.to(tenantId).emit("whatsapp:message", msg)
}

async function handleStatusUpdate({ status, tenantId }) {
  console.log("[WA WEBHOOK] Status update:", {
    tenantId,
    messageId: status.id,
    status: status.status, // sent | delivered | read | failed
    to: status.recipient_id,
    timestamp: status.timestamp,
    error: status.errors?.[0]?.title, // present if failed
  });

  // 👉 Update message status in your DB
  // await MessageModel.updateOne({ messageId: status.id }, { status: status.status })
}

async function handleTemplateStatus({ value, tenantId }) {
  console.log("[WA WEBHOOK] Template status:", {
    tenantId,
    templateName: value.message_template_name,
    templateId: value.message_template_id,
    status: value.event, // APPROVED | REJECTED | PAUSED
    reason: value.reason, // present if REJECTED
  });

  // 👉 Update template status in your DB if you store them
}
