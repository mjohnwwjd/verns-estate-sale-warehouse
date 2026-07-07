window.VERNS_EARLY_ENTRY_CONFIG = {
  // Fallback count mirrors the live roster when the Worker is temporarily unavailable.
  stripePaymentLink: "https://buy.stripe.com/cNi3cxejrfG91zXddUaR201",
  // Keep false while using the live Stripe checkout. Turn true only for local mock checkout testing.
  paymentPreviewMode: false,
  paymentPreviewUrl: "payment-preview.html",
  paymentPendingMessage: "",
  venmoUsername: "@ebuyingstore",
  venmoQrImage: "",
  price: "$20",
  maxPaidSpots: 40,
  waveOneSpots: 20,
  waveTwoSpots: 20,
  waveTwoStartSpot: 21,
  // Live endpoints are served by the Cloudflare Worker.
  spotCounterMode: "live",
  publicCounterRefreshMs: 180000,
  previewPaidSpots: 20,
  spotCounterEndpoint: "https://verns-early-entry-api.mjohnwwjd.workers.dev/api/early-entry/count",
  rosterEndpoint: "https://verns-early-entry-api.mjohnwwjd.workers.dev/api/early-entry/roster",
  reservedSpots: [],
  freeSignupTime: "7:30 AM",
  nameMatchNote: "Please make sure your payment name matches your sign-up name."
};
