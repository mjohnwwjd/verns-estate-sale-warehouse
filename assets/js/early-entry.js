(function () {
  const config = window.VERNS_EARLY_ENTRY_CONFIG || {};
  const storageKey = "vernsWebsiteStateV1";
  const price = config.price || "$20";
  const maxPaidSpots = config.maxPaidSpots || 40;
  const freeSignupTime = config.freeSignupTime || "7:30 AM";
  const stripePaymentLink = String(config.stripePaymentLink || "").trim();
  const paymentPreviewUrl = String(config.paymentPreviewUrl || "payment-preview.html").trim();
  const paymentPreviewMode = Boolean(config.paymentPreviewMode && !stripePaymentLink && paymentPreviewUrl);
  const paymentPendingMessage = String(config.paymentPendingMessage || "").trim();
  const spotCounterEndpoint = String(config.spotCounterEndpoint || "").trim();
  const spotCounterMode = String(config.spotCounterMode || (spotCounterEndpoint ? "live" : "preview")).trim();
  const venmoUsername = String(config.venmoUsername || "@ebuyingstore").trim();
  const venmoHandle = venmoUsername.replace(/^@/, "");
  const venmoUrl = `https://venmo.com/${encodeURIComponent(venmoHandle)}`;
  let spotCounterRequestInFlight = false;
  let lastSpotCounterCheckAt = 0;

  const clampCount = (value, min, max) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, Math.round(number)));
  };

  const waveOneSpots = clampCount(config.waveOneSpots, 1, maxPaidSpots);
  const waveTwoStartSpot = clampCount(config.waveTwoStartSpot, waveOneSpots + 1, maxPaidSpots);
  const waveTwoSpots = clampCount(config.waveTwoSpots, 1, maxPaidSpots);
  const publicCounterRefreshMs = (() => {
    const value = Number(config.publicCounterRefreshMs);
    if (!Number.isFinite(value) || value <= 0) return 3 * 60 * 1000;
    return Math.max(60 * 1000, Math.min(10 * 60 * 1000, Math.round(value)));
  })();

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

  const fillStaticWaveText = () => {
    fillText("[data-early-entry-wave-one]", String(waveOneSpots));
    fillText("[data-early-entry-wave-two]", String(waveTwoSpots));
    fillText("[data-early-entry-wave-two-start]", String(waveTwoStartSpot));
    fillText("[data-early-entry-wave-two-end]", String(Math.min(maxPaidSpots, waveTwoStartSpot + waveTwoSpots - 1)));
  };

  const updateSpotCounter = (counter) => {
    const max = clampCount(counter.max, 1, 9999);
    const paid = clampCount(counter.paid, 0, max);
    const rawRemaining = Number.isFinite(Number(counter.remaining)) ? counter.remaining : max - paid;
    const remaining = clampCount(rawRemaining, 0, max);
    const meterFill = document.querySelector("[data-early-entry-meter]");
    const meterPercent = Math.max(0, Math.min(100, (remaining / max) * 100));
    const remainingLabel = remaining === 1 ? "spot remains" : "spots remain";
    const nextSpot = remaining > 0 ? Math.min(max, paid + 1) : max;

    fillText("[data-early-entry-remaining]", String(remaining));
    fillText("[data-early-entry-remaining-text]", `${remaining} ${remainingLabel}`);
    fillText("[data-early-entry-paid]", String(paid));
    fillText("[data-early-entry-remaining-label]", remainingLabel);
    fillText("[data-early-entry-counter-max]", String(max));
    fillText("[data-early-entry-next-spot]", String(nextSpot));

    if (meterFill) {
      meterFill.style.width = `${meterPercent}%`;
    }

    document.querySelectorAll("[data-early-entry-counter-note]").forEach((el) => {
      if (remaining <= 0) {
        el.textContent = "All paid early-entry spots are currently claimed. The free 7:30 AM sign-up list still runs at the sale.";
        return;
      }
      if (paid >= waveOneSpots) {
        el.textContent = `Wave 2 is open because of demand. Next paid spot is #${nextSpot}; spots 1-${waveOneSpots} enter first, then Wave 2 is called five at a time.`;
        return;
      }
      el.textContent = counter.mode === "live"
        ? "Live count updates as early-entry payments are completed."
        : `Wave 2 starts at spot #${waveTwoStartSpot}. Free sign-up begins at ${freeSignupTime}.`;
    });
  };

  const showLiveCounterLoading = () => {
    fillText("[data-early-entry-remaining]", "...");
    fillText("[data-early-entry-remaining-text]", "checking live spots");
    fillText("[data-early-entry-paid]", "...");
    fillText("[data-early-entry-remaining-label]", "checking");
    fillText("[data-early-entry-counter-max]", String(maxPaidSpots));

    const meterFill = document.querySelector("[data-early-entry-meter]");
    if (meterFill) meterFill.style.width = "0%";

    document.querySelectorAll("[data-early-entry-counter-note]").forEach((el) => {
      el.textContent = "Checking live early-entry spots...";
    });
  };

  const loadSpotCounter = async ({ silent = false } = {}) => {
    if (!spotCounterEndpoint || spotCounterMode !== "live") {
      updateSpotCounter(getPreviewCounter());
      return;
    }

    if (spotCounterRequestInFlight) return;
    spotCounterRequestInFlight = true;
    lastSpotCounterCheckAt = Date.now();
    if (!silent) showLiveCounterLoading();

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
      updateSpotCounter(getPreviewCounter());
      document.querySelectorAll("[data-early-entry-counter-note]").forEach((el) => {
        el.textContent = "Spots are limited. Live count is temporarily unavailable.";
      });
    } finally {
      spotCounterRequestInFlight = false;
    }
  };

  const startPublicCounterAutoRefresh = () => {
    if (!spotCounterEndpoint || spotCounterMode !== "live" || !publicCounterRefreshMs) return;

    window.setInterval(() => {
      if (document.hidden) return;
      loadSpotCounter({ silent: true });
    }, publicCounterRefreshMs);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) return;
      if (Date.now() - lastSpotCounterCheckAt < publicCounterRefreshMs) return;
      loadSpotCounter({ silent: true });
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    fillText("[data-early-entry-price]", price);
    fillText("[data-early-entry-max]", String(maxPaidSpots));
    fillText("[data-free-signup-time]", freeSignupTime);
    fillText("[data-venmo-username]", venmoUsername);
    fillStaticWaveText();
    loadSpotCounter();
    startPublicCounterAutoRefresh();

    const payButton = document.querySelector("[data-early-entry-pay-button]");
    const payNote = document.querySelector("[data-early-entry-payment-note]");
    const stripeSetupNote = document.querySelector("[data-stripe-setup-note]");
    const venmoBox = document.querySelector("[data-venmo-box]");
    const venmoQr = document.querySelector("[data-venmo-qr]");

    if (payButton) {
      if (paymentPendingMessage && !stripePaymentLink && !paymentPreviewMode) {
        payButton.removeAttribute("href");
        payButton.removeAttribute("target");
        payButton.removeAttribute("rel");
        payButton.setAttribute("aria-disabled", "true");
        payButton.classList.add("is-disabled");
        payButton.textContent = "Wave 2 checkout coming soon";
        payButton.addEventListener("click", (event) => event.preventDefault());
      } else {
        payButton.href = stripePaymentLink || (paymentPreviewMode ? paymentPreviewUrl : venmoUrl);
        payButton.target = paymentPreviewMode ? "_self" : "_blank";
        if (paymentPreviewMode) payButton.removeAttribute("rel");
        else payButton.rel = "noopener";
        payButton.textContent = stripePaymentLink || paymentPreviewMode ? `Pay ${price} & Sign Up Early` : `Pay ${price} with Venmo`;
      }
    }

    if (payNote) {
      payNote.textContent = paymentPendingMessage && !stripePaymentLink && !paymentPreviewMode
        ? paymentPendingMessage
        : stripePaymentLink
        ? `Limited to available early-entry spots. Free in-person sign-up begins at ${freeSignupTime} at the sale location.`
        : paymentPreviewMode
          ? `Preview mode only: this shows the customer flow, but no payment will be collected. The real Stripe link will be capped to the available early-entry spots.`
        : `Venmo sign-ups are manually confirmed and limited to available early-entry spots. Free in-person sign-up begins at ${freeSignupTime} at the sale location.`;
    }

    if (stripeSetupNote) {
      stripeSetupNote.hidden = Boolean(stripePaymentLink || paymentPendingMessage);
    }

    if (venmoBox) {
      venmoBox.hidden = Boolean(stripePaymentLink || paymentPreviewMode || paymentPendingMessage);
    }

    if (venmoQr && config.venmoQrImage) {
      venmoQr.src = config.venmoQrImage;
      venmoQr.hidden = false;
    }
  });
}());
