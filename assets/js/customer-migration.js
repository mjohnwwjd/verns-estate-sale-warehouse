(function exposeCustomerMigration(root) {
  function clean(value) {
    return String(value || "").trim().toLowerCase();
  }

  function customerFingerprint(record = {}) {
    const phone = clean(record.phone).replace(/\D/g, "");
    const address = [
      record.saleSiteStreet,
      record.saleSiteLine2,
      record.saleSiteCity,
      record.saleSiteState,
      record.saleSiteZip,
      record.address
    ].map(clean).filter(Boolean).join("|");
    return [
      clean(record.firstName),
      clean(record.lastName),
      phone,
      clean(record.email),
      address,
      clean(record.meetingDate),
      clean(record.meetingTime)
    ].join("::");
  }

  function stableHash(value) {
    let hash = 2166136261;
    for (const character of String(value || "")) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function recoveredCustomerId(record) {
    return `potential-customer-recovered-${stableHash(customerFingerprint(record) || JSON.stringify(record || {}))}`;
  }

  function mergeNonEmpty(base, update) {
    const merged = { ...base };
    Object.entries(update || {}).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) merged[key] = value;
    });
    merged.id = base.id || update.id || recoveredCustomerId(merged);
    return merged;
  }

  function mergeRecords(collections, normalizeRecord = (record) => ({ ...record })) {
    const records = [];
    const idIndexes = new Map();
    const fingerprintIndexes = new Map();

    (collections || []).forEach((collection) => {
      if (!Array.isArray(collection)) return;
      collection.forEach((rawRecord) => {
        if (!rawRecord || typeof rawRecord !== "object") return;
        const record = normalizeRecord(rawRecord);
        record.id = String(record.id || recoveredCustomerId(record));
        const fingerprint = customerFingerprint(record);
        const existingIndex = idIndexes.get(record.id) ?? fingerprintIndexes.get(fingerprint);
        if (existingIndex === undefined) {
          const index = records.push(record) - 1;
          idIndexes.set(record.id, index);
          if (fingerprint) fingerprintIndexes.set(fingerprint, index);
          return;
        }

        const existing = records[existingIndex];
        const recordIsNewer = String(record.updatedAt || record.createdAt || "")
          .localeCompare(String(existing.updatedAt || existing.createdAt || "")) >= 0;
        const merged = recordIsNewer
          ? mergeNonEmpty(existing, record)
          : mergeNonEmpty(record, existing);
        merged.id = existing.id || record.id;
        records[existingIndex] = merged;
        idIndexes.set(existing.id, existingIndex);
        idIndexes.set(record.id, existingIndex);
        const mergedFingerprint = customerFingerprint(merged);
        if (fingerprint) fingerprintIndexes.set(fingerprint, existingIndex);
        if (mergedFingerprint) fingerprintIndexes.set(mergedFingerprint, existingIndex);
      });
    });

    return records;
  }

  root.VERNS_CUSTOMER_MIGRATION = {
    customerFingerprint,
    recoveredCustomerId,
    mergeRecords
  };
})(typeof window === "undefined" ? globalThis : window);
