window.VERNS_EARLY_ENTRY_CONFIG = {
  // Fallback count mirrors the live roster when the Worker is temporarily unavailable.
  stripePaymentLink: "",
  // Keep false while using the live Stripe checkout. Turn true only for local mock checkout testing.
  paymentPreviewMode: false,
  paymentPreviewUrl: "payment-preview.html",
  paymentPendingMessage: "Early entry is closed now that the sale is underway.",
  venmoUsername: "@ebuyingstore",
  venmoQrImage: "",
  price: "$20",
  maxPaidSpots: 40,
  waveOneSpots: 20,
  waveTwoSpots: 20,
  waveTwoStartSpot: 21,
  // Public counting is closed now that the sale is underway.
  spotCounterMode: "closed",
  publicCounterRefreshMs: 0,
  previewPaidSpots: 20,
  spotCounterEndpoint: "",
  // Staff roster remains available from the Cloudflare Worker for internal records.
  rosterEndpoint: "https://verns-early-entry-api.mjohnwwjd.workers.dev/api/early-entry/roster",
  reservedSpots: [
    {
      spot: 1,
      name: "Reed",
      source: "Reserved",
      status: "Reserved",
      notes: "Front of early-entry list"
    },
    {
      spot: 2,
      name: "Lanna",
      source: "Reserved",
      status: "Reserved",
      notes: "Front of early-entry list"
    }
  ],
  freeSignupTime: "7:30 AM",
  nameMatchNote: "Please make sure your payment name matches your sign-up name."
};
