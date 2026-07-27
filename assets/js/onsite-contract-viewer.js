(function initializeOnsiteContractViewer(root) {
  const CUSTOMER_DATABASE_NAME = "vernsEmployeeCustomersV1";
  const CUSTOMER_DATABASE_STORE = "workflow";
  const CUSTOMER_DATABASE_RECORD_KEY = "potentialCustomers";
  const LEGACY_STORAGE_KEY = "vernsWebsiteStateV1";
  const CONTRACT_REVIEW_HANDOFF_KEY = "vernsOnsiteContractReviewHandoffV1";
  const CONTRACT_REVIEW_HANDOFF_MAX_AGE = 2 * 60 * 60 * 1000;
  const customerId = new URLSearchParams(root.location.search).get("customer") || "";

  function clean(value) {
    return String(value || "").trim();
  }

  function findCustomer(records) {
    return Array.isArray(records)
      ? records.find((item) => item?.id === customerId || item?.supabaseId === customerId) || null
      : null;
  }

  async function readIndexedDbCustomer() {
    if (!customerId || !("indexedDB" in root)) return null;
    return new Promise((resolve) => {
      const request = root.indexedDB.open(CUSTOMER_DATABASE_NAME, 1);
      request.addEventListener("upgradeneeded", () => {
        if (!request.result.objectStoreNames.contains(CUSTOMER_DATABASE_STORE)) {
          request.result.createObjectStore(CUSTOMER_DATABASE_STORE);
        }
      });
      request.addEventListener("error", () => resolve(null), { once: true });
      request.addEventListener("success", () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(CUSTOMER_DATABASE_STORE)) {
          database.close();
          resolve(null);
          return;
        }
        const transaction = database.transaction(CUSTOMER_DATABASE_STORE, "readonly");
        const getRequest = transaction.objectStore(CUSTOMER_DATABASE_STORE).get(CUSTOMER_DATABASE_RECORD_KEY);
        getRequest.addEventListener("success", () => {
          const record = findCustomer(getRequest.result);
          database.close();
          resolve(record);
        }, { once: true });
        getRequest.addEventListener("error", () => {
          database.close();
          resolve(null);
        }, { once: true });
      }, { once: true });
    });
  }

  function readBrowserRecoveryCustomer() {
    if (!customerId) return null;
    try {
      const handoff = JSON.parse(root.localStorage.getItem(CONTRACT_REVIEW_HANDOFF_KEY) || "null");
      const handoffAge = Date.now() - Number(handoff?.createdAt || 0);
      if (
        handoff?.customerId === customerId
        && handoff?.record
        && handoffAge >= 0
        && handoffAge <= CONTRACT_REVIEW_HANDOFF_MAX_AGE
      ) {
        return handoff.record;
      }
    } catch {
      // Continue to durable browser recovery sources.
    }
    for (let index = 0; index < root.localStorage.length; index += 1) {
      const key = root.localStorage.key(index);
      if (!key) continue;
      try {
        const saved = JSON.parse(root.localStorage.getItem(key) || "null");
        const record = findCustomer(saved?.potentialCustomers) || findCustomer(saved?.records);
        if (record) return record;
      } catch {
        // Ignore unrelated non-JSON browser storage.
      }
    }
    try {
      const legacy = JSON.parse(root.localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
      return findCustomer(legacy?.potentialCustomers);
    } catch {
      return null;
    }
  }

  async function resolveCustomer() {
    return await readIndexedDbCustomer()
      || readBrowserRecoveryCustomer();
  }

  function contractValues(record) {
    const legacyParts = clean(record?.address).split(",").map((part) => part.trim()).filter(Boolean);
    const legacyStreet = legacyParts.shift() || "";
    const legacyCity = legacyParts.shift() || "";
    const legacyStateZip = legacyParts.join(" ").match(/\b([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)\b/) || [];
    const saleSiteStreet = clean(record?.saleSiteStreet || legacyStreet);
    const saleSiteLine2 = clean(record?.saleSiteLine2);
    const saleSiteCity = clean(record?.saleSiteCity || legacyCity);
    const saleSiteState = clean(record?.saleSiteState || legacyStateZip[1]).toUpperCase();
    const saleSiteZip = clean(record?.saleSiteZip || legacyStateZip[2]);
    const saleSiteLocality = [saleSiteCity, saleSiteState, saleSiteZip].filter(Boolean).join(" ");
    const mailingMode = record?.checkAddressMode === "different" ? "different" : "same";
    const mailingStreet = mailingMode === "different" ? clean(record?.mailingStreet) : saleSiteStreet;
    const mailingLine2 = mailingMode === "different" ? clean(record?.mailingLine2) : saleSiteLine2;
    const mailingCity = mailingMode === "different" ? clean(record?.mailingCity) : saleSiteCity;
    const mailingState = mailingMode === "different" ? clean(record?.mailingState).toUpperCase() : saleSiteState;
    const mailingZip = mailingMode === "different" ? clean(record?.mailingZip) : saleSiteZip;
    const mailingLocality = [mailingCity, mailingState, mailingZip].filter(Boolean).join(" ");
    return {
      fields: {
        clientName: [record?.firstName, record?.lastName].map(clean).filter(Boolean).join(" "),
        primaryPhone: clean(record?.phone),
        saleSiteAddress: [saleSiteStreet, saleSiteLine2, saleSiteLocality].filter(Boolean).join(", "),
        specialNotesOrAgreements: clean(record?.specialNotesAgreements),
        checkAndReportAddress: [mailingStreet, mailingLine2, mailingLocality].filter(Boolean).join(", ")
      },
      missing: [
        !saleSiteStreet ? "Sale Site street" : "",
        !saleSiteCity ? "Sale Site city" : "",
        !saleSiteState ? "Sale Site state" : "",
        !saleSiteZip ? "Sale Site ZIP" : "",
        mailingMode === "different" && !mailingStreet ? "Mailing street" : "",
        mailingMode === "different" && !mailingCity ? "Mailing city" : "",
        mailingMode === "different" && !mailingState ? "Mailing state" : "",
        mailingMode === "different" && !mailingZip ? "Mailing ZIP" : ""
      ].filter(Boolean)
    };
  }

  function renderRecord(record) {
    const status = document.querySelector("[data-viewer-status]");
    const title = document.querySelector("[data-viewer-title]");
    if (!record) {
      status.textContent = "Customer record not found in browser storage or the prepared customer handoff. Return to Employee Tools and open Contract Prep again.";
      status.classList.add("is-error");
      return;
    }

    const { fields, missing: addressMissing } = contractValues(record);
    const missing = [
      !fields.clientName ? "Client name" : "",
      !fields.primaryPhone ? "Phone" : "",
      ...addressMissing
    ].filter(Boolean);
    const fallback = "MISSING - RETURN TO EMPLOYEE TOOLS";
    document.querySelector("[data-contract-client]").textContent = fields.clientName || fallback;
    document.querySelector("[data-contract-phone]").textContent = fields.primaryPhone || fallback;
    document.querySelector("[data-contract-address]").textContent = fields.saleSiteAddress || fallback;
    const specialNotes = document.querySelector("[data-contract-special-notes]");
    specialNotes.textContent = fields.specialNotesOrAgreements;
    specialNotes.hidden = !fields.specialNotesOrAgreements;
    document.querySelector("[data-contract-mailing]").textContent = fields.checkAndReportAddress || fallback;

    if (missing.length) {
      status.textContent = `Missing ${missing.join(", ")}. Return to Employee Tools and edit the Potential Customer before review.`;
      status.classList.add("is-error");
      return;
    }
    title.textContent = `Onsite Contract - ${fields.clientName}`;
    status.textContent = "Read-only customer-specific review. Client, Phone, Sale Site Address, Special Notes or Agreements, and check/report address were filled automatically. Signature areas activate after the secure signature-service connection.";
  }

  resolveCustomer().then(renderRecord).catch((error) => {
    console.error("Customer-specific contract review could not load.", error);
    renderRecord(null);
  });

  root.VERNS_CONTRACT_VIEWER = {
    resolveCustomer,
    renderRecord,
    contractValues
  };
})(window);
