window.VERNS_EARLY_ENTRY_CONFIG = {
  // Stripe sells the 20 public spots; the other 5 early-entry spots are held in reservedSpots.
  stripePaymentLink: "https://buy.stripe.com/eVqfZj5MVdy1diF5LsaR200",
  // Keep false while reviewing the Stripe sandbox checkout. Turn true to use the local mock checkout.
  paymentPreviewMode: false,
  paymentPreviewUrl: "payment-preview.html",
  venmoUsername: "@ebuyingstore",
  venmoQrImage: "",
  price: "$25",
  maxPaidSpots: 25,
  // Preview-only countdown includes held/giveaway spots until the Stripe-backed endpoint is connected.
  spotCounterMode: "preview",
  previewPaidSpots: 5,
  spotCounterEndpoint: "",
  rosterEndpoint: "",
  reservedSpots: [
    { spot: 1, name: "Vern", status: "Held", source: "Comp" },
    { spot: 2, name: "Reed", status: "Held", source: "Comp" },
    { spot: 3, name: "Lanna", status: "Held", source: "Comp" },
    { spot: 4, name: "Vern giveaway", status: "Giveaway", source: "Assign at door" },
    { spot: 5, name: "Vern giveaway", status: "Giveaway", source: "Assign at door" }
  ],
  freeSignupTime: "7:30 AM",
  nameMatchNote: "Please make sure your payment name matches your sign-up name."
};
