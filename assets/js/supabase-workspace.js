(function exposeSupabaseWorkspace(root) {
  const DEFAULT_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

  function clean(value) {
    return String(value || "").trim();
  }

  function configured(config = {}) {
    const url = clean(config.url);
    const key = clean(config.anonKey);
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)
      && key.length > 20
      && !/placeholder|your[_-]|example|service[_-]?role/i.test(key);
  }

  function loadSupabaseLibrary(url = DEFAULT_LIBRARY_URL) {
    if (root.supabase?.createClient) return Promise.resolve(root.supabase);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-verns-supabase-client]');
      if (existing) {
        existing.addEventListener("load", () => resolve(root.supabase), { once: true });
        existing.addEventListener("error", () => reject(new Error("Supabase browser client could not be loaded.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.dataset.vernsSupabaseClient = "true";
      script.addEventListener("load", () => {
        if (root.supabase?.createClient) resolve(root.supabase);
        else reject(new Error("Supabase browser client loaded without createClient."));
      }, { once: true });
      script.addEventListener("error", () => reject(new Error("Supabase browser client could not be loaded.")), { once: true });
      document.head.append(script);
    });
  }

  function toDatabaseRecord(record = {}) {
    return {
      local_record_id: clean(record.id),
      first_name: clean(record.firstName),
      last_name: clean(record.lastName),
      phone: clean(record.phone),
      email: clean(record.email) || null,
      sale_site_street: clean(record.saleSiteStreet),
      sale_site_line_2: clean(record.saleSiteLine2) || null,
      sale_site_city: clean(record.saleSiteCity),
      sale_site_state: clean(record.saleSiteState).toUpperCase(),
      sale_site_zip: clean(record.saleSiteZip),
      meeting_date: clean(record.meetingDate) || null,
      meeting_time: clean(record.meetingTime) || null,
      sale_start_date: clean(record.saleStartDate) || null,
      sale_end_date: clean(record.saleEndDate) || null,
      notes: clean(record.notes) || null,
      special_notes_agreements: clean(record.specialNotesAgreements) || null,
      check_address_mode: record.checkAddressMode === "different" ? "different" : "same",
      mailing_street: clean(record.mailingStreet) || null,
      mailing_line_2: clean(record.mailingLine2) || null,
      mailing_city: clean(record.mailingCity) || null,
      mailing_state: clean(record.mailingState).toUpperCase() || null,
      mailing_zip: clean(record.mailingZip) || null,
      status: record.status === "contract-signed"
        ? "signed"
        : ["potential", "signed", "archived"].includes(record.status)
          ? record.status
          : "potential",
      customer_code: /^\d{4}$/.test(clean(record.customerCode)) ? clean(record.customerCode) : null,
      contract_delivery: ["email", "text"].includes(record.contractDelivery) ? record.contractDelivery : null,
      customer_signed_at: clean(record.customerSignedAt) || null,
      representative_signed_at: clean(record.representativeSignedAt) || null,
      contract_signed_at: clean(record.contractSignedAt) || null,
      google_calendar_meeting_event_id: clean(record.googleCalendarMeetingEventId) || null,
      google_calendar_sale_event_id: clean(record.googleCalendarSaleEventId) || null,
      source_employee_name: clean(record.employee) || null,
      local_created_at: clean(record.createdAt) || null
    };
  }

  function fromDatabaseRecord(row = {}) {
    const locality = [row.sale_site_city, row.sale_site_state, row.sale_site_zip].filter(Boolean).join(" ");
    return {
      id: row.local_record_id || row.id,
      supabaseId: row.id,
      firstName: row.first_name || "",
      lastName: row.last_name || "",
      phone: row.phone || "",
      email: row.email || "",
      saleSiteStreet: row.sale_site_street || "",
      saleSiteLine2: row.sale_site_line_2 || "",
      saleSiteCity: row.sale_site_city || "",
      saleSiteState: row.sale_site_state || "",
      saleSiteZip: row.sale_site_zip || "",
      address: [row.sale_site_street, row.sale_site_line_2, locality].filter(Boolean).join(", "),
      meetingDate: row.meeting_date || "",
      meetingTime: clean(row.meeting_time).slice(0, 5),
      saleStartDate: row.sale_start_date || "",
      saleEndDate: row.sale_end_date || "",
      notes: row.notes || "",
      specialNotesAgreements: row.special_notes_agreements || "",
      checkAddressMode: row.check_address_mode === "different" ? "different" : "same",
      mailingStreet: row.mailing_street || "",
      mailingLine2: row.mailing_line_2 || "",
      mailingCity: row.mailing_city || "",
      mailingState: row.mailing_state || "",
      mailingZip: row.mailing_zip || "",
      status: row.status || "potential",
      customerCode: row.customer_code || "",
      contractDelivery: row.contract_delivery || "",
      customerSignedAt: row.customer_signed_at || "",
      representativeSignedAt: row.representative_signed_at || "",
      contractSignedAt: row.contract_signed_at || "",
      googleCalendarMeetingEventId: row.google_calendar_meeting_event_id || "",
      googleCalendarSaleEventId: row.google_calendar_sale_event_id || "",
      employee: row.source_employee_name || "",
      createdAt: row.local_created_at || row.created_at || "",
      updatedAt: row.updated_at || ""
    };
  }

  class VernsSupabaseWorkspace {
    constructor(config = {}, onStateChange = () => {}) {
      this.config = config;
      this.table = clean(config.customerTable) || "potential_customers";
      this.onStateChange = onStateChange;
      this.client = null;
      this.user = null;
      this.mode = configured(config) ? "connecting" : "unconfigured";
    }

    emit(message = "", error = null) {
      this.onStateChange({
        mode: this.mode,
        configured: configured(this.config),
        connected: this.mode === "connected",
        user: this.user,
        message,
        error
      });
    }

    async initialize() {
      if (!configured(this.config)) {
        this.mode = "unconfigured";
        this.emit("Supabase is not configured. Customer records remain on this browser only.");
        return this;
      }
      this.mode = "connecting";
      this.emit("Connecting to the shared employee workspace…");
      try {
        const library = await loadSupabaseLibrary(this.config.clientLibraryUrl);
        this.client = library.createClient(clean(this.config.url), clean(this.config.anonKey), {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: "vernsSupabaseEmployeeSession"
          }
        });
        this.client.auth.onAuthStateChange((_event, session) => {
          this.user = session?.user || null;
          this.mode = this.user ? "connected" : "signed-out";
          this.emit(this.user ? "Authenticated shared workspace is connected." : "Sign in with an approved Supabase employee account.");
        });
        const { data, error } = await this.client.auth.getUser();
        if (error && !/session/i.test(error.message || "")) throw error;
        this.user = data?.user || null;
        this.mode = this.user ? "connected" : "signed-out";
        this.emit(this.user ? "Authenticated shared workspace is connected." : "Supabase is configured. Employee sign-in is required.");
      } catch (error) {
        this.mode = "error";
        this.emit(error.message || "Shared workspace connection failed.", error);
      }
      return this;
    }

    async signIn(email, password) {
      if (!this.client) throw new Error("Supabase is not initialized.");
      const { data, error } = await this.client.auth.signInWithPassword({ email: clean(email), password });
      if (error) throw error;
      this.user = data.user;
      this.mode = "connected";
      this.emit("Authenticated shared workspace is connected.");
      return data.user;
    }

    async signOut() {
      if (!this.client) return;
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      this.user = null;
      this.mode = "signed-out";
      this.emit("Signed out. Customer records are back in Local Preview mode.");
    }

    async getAccessToken() {
      if (!this.client || !this.user) return "";
      const { data, error } = await this.client.auth.getSession();
      if (error) throw error;
      return data?.session?.access_token || "";
    }

    requireConnection() {
      if (!this.client || !this.user || this.mode !== "connected") {
        throw new Error("An approved employee must sign in before shared customer data can be accessed.");
      }
    }

    async listCustomers() {
      this.requireConnection();
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .order("meeting_date", { ascending: false, nullsFirst: false })
        .order("meeting_time", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data || []).map(fromDatabaseRecord);
    }

    async upsertCustomers(records) {
      this.requireConnection();
      const rows = (records || []).map(toDatabaseRecord).filter((row) => row.local_record_id);
      if (!rows.length) return [];
      const { data, error } = await this.client
        .from(this.table)
        .upsert(rows, { onConflict: "local_record_id" })
        .select("*");
      if (error) throw error;
      return (data || []).map(fromDatabaseRecord);
    }

    async upsertCustomer(record) {
      const [saved] = await this.upsertCustomers([record]);
      return saved;
    }

    async recordSignedContract(localRecordId, signedAt = new Date().toISOString()) {
      this.requireConnection();
      const { data, error } = await this.client.rpc("record_potential_customer_signed", {
        target_local_record_id: clean(localRecordId),
        signed_at_value: signedAt
      });
      if (error) throw error;
      return fromDatabaseRecord(Array.isArray(data) ? data[0] : data);
    }
  }

  root.VERNS_SUPABASE = {
    configured,
    toDatabaseRecord,
    fromDatabaseRecord,
    createWorkspace(config, onStateChange) {
      return new VernsSupabaseWorkspace(config, onStateChange);
    }
  };
})(typeof window === "undefined" ? globalThis : window);
