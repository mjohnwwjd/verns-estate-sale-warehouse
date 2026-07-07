window.VERNS_EARLY_ENTRY_CONFIG = {
  // Fallback count mirrors the live roster when the Worker is temporarily unavailable.
  stripePaymentLink: "",
  // Keep false while reviewing the Stripe sandbox checkout. Turn true to use the local mock checkout.
  paymentPreviewMode: false,
  paymentPreviewUrl: "payment-preview.html",
  paymentPendingMessage: "Wave 2 checkout is being connected. Original spots 1-20 are sold out; the next paid spot will be #21.",
  venmoUsername: "@ebuyingstore",
  venmoQrImage: "",
  price: "$20",
  maxPaidSpots: 40,
  waveOneSpots: 20,
  waveTwoSpots: 20,
  waveTwoStartSpot: 21,
  // Live endpoints are served by the Cloudflare Worker.
  spotCounterMode: "live",
  previewPaidSpots: 20,
  spotCounterEndpoint: "https://verns-early-entry-api.mjohnwwjd.workers.dev/api/early-entry/count",
  rosterEndpoint: "https://verns-early-entry-api.mjohnwwjd.workers.dev/api/early-entry/roster",
  reservedSpots: [],
  freeSignupTime: "7:30 AM",
  nameMatchNote: "Please make sure your payment name matches your sign-up name."
};
