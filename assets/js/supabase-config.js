/*
 * Public browser configuration only.
 *
 * Leave both values blank to keep Vern's workflow in Local Preview mode.
 * The Supabase project URL and anon/publishable key are designed to be public;
 * never place a service_role key, database password, or other secret here.
 */
window.VERNS_SUPABASE_CONFIG = Object.freeze({
  url: "",
  anonKey: "",
  customerTable: "potential_customers"
});
