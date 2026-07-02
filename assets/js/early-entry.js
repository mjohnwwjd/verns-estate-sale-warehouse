(function () {
  const config = window.VERNS_EARLY_ENTRY_CONFIG || {};
  const storageKey = "vernsWebsiteStateV1";
  const price = config.price || "$25";
  const maxPaidSpots = config.maxPaidSpots || 25;
  const freeSignupTime = config.freeSignupTime || "7:30 AM";
  const stripePaymentLink = String(config.stripePaymentLink || "").trim();
  const paymentPreviewUrl = String(config.paymentPreviewUrl || "payment-preview.html").trim();
  const paymentPreviewMode = Boolean(config.paymentPreviewMode && !stripePaymentLink && paymentPreviewUrl);
  const spotCounterEndpoint = String(config.spotCounterEndpoint || "").trim();
  const spotCounterMode = String(config.spotCounterMode || (spotCounterEndpoint ? "live" : "preview")).trim();
  const venmoUsername = String(config.venmoUsername || "@ebuyingstore").trim();
  const venmoHandle = venmoUsername.replace(/^@/, "");
  const venmoUrl = `https://venmo.com/${encodeURIComponent(venmoHandle)}`;

  const clampCount = (value, min, max) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, Math.round(number)));
  };

  const getPreviewCounter = () => {
    const reservedCount = Array.isArray(config.reservedSpots) ? config.reservedSpots.length : 0;
    let manualCount = 0;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      manualCount = Array.isArray(saved?.earlyEntryRoster) ? saved.earlyEntryRoster.length : 0;
    } catch {
      manualCount = 0;
    }
    const configuredPaid = clampCount(config.previewPaidSpots, 0, maxPaidSpots);
    const paid = Math.max(configuredPaid, Math.min(maxPaidSpots, reservedCount + manualCount));
    return {
      paid,
      max: maxPaidSpots,
      remaining: Math.max(0, maxPaidSpots - paid),
      mode: "preview"
    };
  };

  const fillText = (selector, value) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
  };

  const updateSpotCounter = (counter) => {
    const max = clampCount(counter.max, 1, 9999);
    const paid = clampCount(counter.paid, 0, max);
    const rawRemaining = Number.isFinite(Number(counter.remaining)) ? counter.remaining : max - paid;
    const remaining = clampCount(rawRemaining, 0, max);
    const meterFill = document.querySelector("[data-early-entry-meter]");
    const meterPercent = Math.max(0, Math.min(100, (remaining / max) * 100));
    const remainingLabel = remaining === 1 ? "spot remains" : "spots remain";

    fillText("[data-early-entry-remaining]", String(remaining));
    fillText("[data-early-entry-paid]", String(paid));
    fillText("[data-early-entry-remaining-label]", remainingLabel);
    fillText("[data-early-entry-counter-max]", String(max));

    if (meterFill) {
      meterFill.style.width = `${meterPercent}%`;
    }

    document.querySelectorAll("[data-early-entry-counter-note]").forEach((el) => {
      el.textContent = counter.mode === "live"
        ? "Live count updates as early-entry payments are completed."
        : "5 spots are already held. Stripe checkout is limited to the remaining public early-entry spots.";
    });
  };

  const loadSpotCounter = async () => {
    updateSpotCounter(getPreviewCounter());

    if (!spotCounterEndpoint || spotCounterMode !== "live") return;

    try {
      const response = await fetch(spotCounterEndpoint, { cache: "no-store" });
      if (!response.ok) throw new Error(`Counter returned ${response.status}`);
      const data = await response.json();
      updateSpotCounter({
        paid: data.paidSpots,
        max: data.maxPaidSpots || maxPaidSpots,
        remaining: data.remainingSpots,
        mode: "live"
      });
    } catch (error) {
      document.querySelectorAll("[data-early-entry-counter-note]").forEach((el) => {
        el.textContent = "Spots are limited. Live count is temporarily unavailable.";
      });
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    fillText("[data-early-entry-price]", price);
    fillText("[data-early-entry-max]", String(maxPaidSpots));
    fillText("[data-free-signup-time]", freeSignupTime);
    fillText("[data-venmo-username]", venmoUsername);
    loadSpotCounter();

    const payButton = document.querySelector("[data-early-entry-pay-button]");
    const payNote = document.querySelector("[data-early-entry-payment-note]");
    const stripeSetupNote = document.querySelector("[data-stripe-setup-note]");
    const venmoBox = document.querySelector("[data-venmo-box]");
    const venmoQr = document.querySelector("[data-venmo-qr]");

    if (payButton) {
      payButton.href = stripePaymentLink || (paymentPreviewMode ? paymentPreviewUrl : venmoUrl);
      payButton.target = paymentPreviewMode ? "_self" : "_blank";
      if (paymentPreviewMode) payButton.removeAttribute("rel");
      else payButton.rel = "noopener";
      payButton.textContent = stripePaymentLink || paymentPreviewMode ? `Pay ${price} & Sign Up Early` : `Pay ${price} with Venmo`;
    }

    if (payNote) {
      payNote.textContent = stripePaymentLink
        ? `Limited to available early-entry spots. Free in-person sign-up begins at ${freeSignupTime} at the sale location.`
        : paymentPreviewMode
          ? `Preview mode only: this shows the customer flow, but no payment will be collected. The real Stripe link will be capped to the available public early-entry spots.`
        : `Venmo sign-ups are manually confirmed and limited to available early-entry spots. Free in-person sign-up begins at ${freeSignupTime} at the sale location.`;
    }

    if (stripeSetupNote) {
      stripeSetupNote.hidden = Boolean(stripePaymentLink);
    }

    if (venmoBox) {
      venmoBox.hidden = Boolean(stripePaymentLink || paymentPreviewMode);
    }

    if (venmoQr && config.venmoQrImage) {
      venmoQr.src = config.venmoQrImage;
      venmoQr.hidden = false;
    }
  });
}());
