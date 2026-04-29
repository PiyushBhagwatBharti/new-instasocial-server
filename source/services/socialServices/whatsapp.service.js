//to use it
//  const wa = await WhatsappService.forTenant(tenantId);
//   const result = await wa.template.send({ to, templateName, variables });
//OR
// const wa = WhatsappService.withCredentials({
//     accessToken: global.wabaToken,
//     wabaId: global.wabaId,
//     phoneNumberId: global.phoneNumberId,
//   });
//   const result = await wa.template.send({ to, templateName, variables });

export const WhatsappService = {
  // ─── factory: call this first to get a tenant-scoped instance ───
  forTenant: async (tenantId) => {
    const platform = await PlatformService.get("whatsapp", tenantId);
    if (!platform) throw new Error("WhatsApp not connected for this tenant");

    const { accessToken } = platform.auth;
    const { wabaId, phoneNumberId } = platform.meta;

    // return bound methods with credentials baked in
    return WhatsappService._build({ accessToken, wabaId, phoneNumberId });
  },

  // ─── or pass credentials directly (for testing / playground) ───
  withCredentials: ({ accessToken, wabaId, phoneNumberId }) => {
    return WhatsappService._build({ accessToken, wabaId, phoneNumberId });
  },

  // ─── internal builder ───────────────────────────────────────────
  _build: ({ accessToken, wabaId, phoneNumberId }) => {
    const authHeader = { Authorization: `Bearer ${accessToken}` };
    const base = "https://graph.facebook.com/v18.0";

    return {
      messages: {
        sendText: async ({ to, text }) => {
          const { data } = await axios.post(
            `${base}/${phoneNumberId}/messages`,
            {
              messaging_product: "whatsapp",
              to,
              type: "text",
              text: { body: text },
            },
            { headers: authHeader },
          );
          return data;
        },

        sendMedia: async ({ to, type = "image", mediaUrl, caption }) => {
          const { data } = await axios.post(
            `${base}/${phoneNumberId}/messages`,
            {
              messaging_product: "whatsapp",
              to,
              type,
              [type]: { link: mediaUrl, caption },
            },
            { headers: authHeader },
          );
          return data;
        },

        markRead: async (messageId) => {
          const { data } = await axios.post(
            `${base}/${phoneNumberId}/messages`,
            {
              messaging_product: "whatsapp",
              status: "read",
              message_id: messageId,
            },
            { headers: authHeader },
          );
          return data;
        },

        sendButtons: async ({ to, bodyText, buttons }) => {
          const { data } = await axios.post(
            `${base}/${phoneNumberId}/messages`,
            {
              messaging_product: "whatsapp",
              to,
              type: "interactive",
              interactive: {
                type: "button",
                body: { text: bodyText },
                action: {
                  buttons: buttons.map((btn) => ({
                    type: "reply",
                    reply: { id: btn.id, title: btn.title },
                  })),
                },
              },
            },
            { headers: authHeader },
          );
          return data;
        },
      },

      template: {
        create: async ({ name, category, language = "en", components }) => {
          const { data } = await axios.post(
            `${base}/${wabaId}/message_templates`,
            { name, language, category, components },
            { headers: authHeader },
          );
          return data;
        },

        getAll: async () => {
          const { data } = await axios.get(
            `${base}/${wabaId}/message_templates`,
            {
              params: {
                fields: "name,status,category,language,components",
                access_token: accessToken,
              },
            },
          );
          return data;
        },

        delete: async (templateName) => {
          const { data } = await axios.delete(
            `${base}/${wabaId}/message_templates`,
            {
              params: { name: templateName, access_token: accessToken },
            },
          );
          return data;
        },

        checkStatus: async (templateId) => {
          const { data } = await axios.get(`${base}/${templateId}`, {
            params: {
              fields: "name,status,category",
              access_token: accessToken,
            },
          });
          return data;
        },

        send: async ({
          to,
          templateName,
          variables = [],
          language = "en_US",
        }) => {
          const parameters = variables.map((val) => ({
            type: "text",
            text: val,
          }));

          const { data } = await axios.post(
            `${base}/${phoneNumberId}/messages`,
            {
              messaging_product: "whatsapp",
              to,
              type: "template",
              template: {
                name: templateName,
                language: { code: language },
                components:
                  parameters.length > 0 ? [{ type: "body", parameters }] : [],
              },
            },
            { headers: authHeader },
          );
          return data;
        },
      },
    };
  },
};
