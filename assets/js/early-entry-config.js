window.VERNS_EARLY_ENTRY_CONFIG = {
  // Preview count starts at 5 claimed spots so the public page shows 20 spots remain.
  stripePaymentLink: "https://buy.stripe.com/eVqfZj5MVdy1diF5LsaR200",
  // Keep false while reviewing the Stripe sandbox checkout. Turn true to use the local mock checkout.
  paymentPreviewMode: false,
  paymentPreviewUrl: "payment-preview.html",
  venmoUsername: "@ebuyingstore",
  venmoQrImage: "",
  price: "$25",
  maxPaidSpots: 25,
  // Preview-only countdown until the Stripe-backed endpoint is connected.
  spotCounterMode: "preview",
  previewPaidSpots: 5,
  spotCounterEndpoint: "",
  rosterEndpoint: "",
  reservedSpots: [],
  freeSignupTime: "7:30 AM",
  nameMatchNote: "Please make sure your payment name matches your sign-up name."
};
