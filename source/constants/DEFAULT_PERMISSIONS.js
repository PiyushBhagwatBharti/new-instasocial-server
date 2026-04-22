export const DEFAULT_PERMISSIONS = [
  // 🔹 Dashboard
  {
    key: "dashboard.read",
    module: "dashboard",
    label: "View Dashboard",
    isActive: true,
  },

  // 🔹 Leads / CRM
  {
    key: "leads.create",
    module: "leads",
    label: "Create Leads",
    isActive: true,
  },
  {
    key: "leads.read",
    module: "leads",
    label: "View Leads",
    isActive: true,
  },
  {
    key: "leads.update",
    module: "leads",
    label: "Update Leads",
    isActive: true,
  },
  {
    key: "leads.delete",
    module: "leads",
    label: "Delete Leads",
    isActive: false,
  },

  // 🔹 Contacts
  {
    key: "contacts.create",
    module: "contacts",
    label: "Create Contacts",
    isActive: true,
  },
  {
    key: "contacts.read",
    module: "contacts",
    label: "View Contacts",
    isActive: true,
  },

  // 🔹 Ads / Campaigns
  {
    key: "ads.read",
    module: "ads",
    label: "View Ads",
    isActive: true,
  },
  {
    key: "ads.manage",
    module: "ads",
    label: "Manage Ad Campaigns",
    isActive: false,
  },

  // 🔹 Facebook Integration
  {
    key: "facebook.connect",
    module: "facebook",
    label: "Connect Facebook Account",
    isActive: true,
  },
  {
    key: "facebook.leads.read",
    module: "facebook",
    label: "Fetch Facebook Leads",
    isActive: true,
  },
  {
    key: "facebook.pages.manage",
    module: "facebook",
    label: "Manage Facebook Pages",
    isActive: false,
  },

  // 🔹 Instagram Integration
  {
    key: "instagram.connect",
    module: "instagram",
    label: "Connect Instagram Account",
    isActive: true,
  },
  {
    key: "instagram.messages.read",
    module: "instagram",
    label: "Read Instagram Messages",
    isActive: true,
  },
  {
    key: "instagram.messages.reply",
    module: "instagram",
    label: "Reply to Instagram Messages",
    isActive: false,
  },

  // 🔹 YouTube Integration
  {
    key: "youtube.connect",
    module: "youtube",
    label: "Connect YouTube Channel",
    isActive: true,
  },
  {
    key: "youtube.comments.read",
    module: "youtube",
    label: "Read YouTube Comments",
    isActive: true,
  },
  {
    key: "youtube.comments.reply",
    module: "youtube",
    label: "Reply to YouTube Comments",
    isActive: false,
  },

  // 🔹 Pricing
  {
    key: "prices.custom",
    module: "prices",
    label: "Set Custom Prices",
    isActive: false,
  },
];