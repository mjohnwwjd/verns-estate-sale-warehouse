const STORAGE_KEY = "vernsWebsiteStateV1";
const EMPLOYEE_SESSION_KEY = "vernsEmployeeUnlocked";
const EMPLOYEE_PROFILE_KEY = "vernsEmployeeProfile";
const STAFF_NAME_KEY = "vernsStaffName";
const MANAGER_SESSION_KEY = "vernsManagerUnlocked";
const PASSCODE = "3939";
const MANAGER_PASSCODE = PASSCODE;
const MANAGER_USERNAMES = new Set(["mike", "vern"]);
const STAFF_ACCOUNT_LABELS = {
  mike: "Mike",
  vern: "Vern"
};
const DEFAULT_ESTATE_COMPANY_URL = "https://www.estatesales.net/companies/MI/Muskegon/49441/16076";
const DEFAULT_ESTATE_SALE_URL = "";
const ENDED_POPUP_SALE_URL = "https://www.estatesales.net/MI/Muskegon/49442/4940091";
const SALE_IMAGE_ASSIGNMENT_VERSION = "2026-05-31-horse-and-pop-up-tent";
const DEMO_CONTENT_VERSION = "2026-06-23-wyoming-extraordinary-sale";
const CONTACT_INFO_VERSION = "2026-06-05-hero-facts";
const SALE_IMAGE_ASSIGNMENTS = {
  "estate-sale-spring-lake-4932078": "assets/img/sale-spring-lake-horse.jpeg",
  "estate-sale-muskegon-popup-4940091": "assets/img/sale-muskegon-pop-up-tent.jpeg"
};
const PHOTO_CATEGORY_FILTERS = [
  { value: "all", label: "All", icon: "A", keywords: [] },
  { value: "furniture", label: "Furniture", icon: "F", keywords: ["furniture", "dresser", "chair", "table", "cabinet", "desk", "sofa", "couch", "shelf", "shelves"] },
  { value: "lamps", label: "Lamps", icon: "lamp", keywords: ["lamp", "lamps", "light", "lighting", "shade", "brass"] },
  { value: "tools", label: "Tools", icon: "wrench", keywords: ["tool", "tools", "drill", "saw", "wrench", "garage", "hardware", "clamp"] },
  { value: "glassware", label: "Glassware", icon: "G", keywords: ["glass", "glassware", "vase", "crystal", "bowl", "amber", "china"] },
  { value: "housewares", label: "Housewares", icon: "H", keywords: ["housewares", "dish", "dishes", "kitchen", "pan", "cookware", "bowl", "utensil"] },
  { value: "appliances", label: "Appliances", icon: "AP", keywords: ["appliance", "appliances", "refrigerator", "freezer", "washer", "dryer", "microwave"] },
  { value: "homegoods", label: "Home Goods", icon: "HG", keywords: ["decor", "home", "homegoods", "basket", "frame", "art", "mirror", "vintage decor"] },
  { value: "clothing", label: "Clothing", icon: "C", keywords: ["clothing", "clothes", "shirt", "jacket", "linen", "linens", "coat", "shoe"] },
  { value: "books", label: "Books", icon: "B", keywords: ["book", "books", "media", "record", "vinyl", "dvd", "cd"] },
  { value: "exercise", label: "Exercise", icon: "EX", keywords: ["exercise", "fitness", "weights", "bike", "treadmill", "workout"] },
  { value: "medical", label: "Medical / Mobility", icon: "+", keywords: ["medical", "walker", "cane", "wheelchair", "health", "mobility"] },
  { value: "kids", label: "Kids / Toys", icon: "K", keywords: ["kids", "kid", "toy", "toys", "crib", "baby", "child", "children"] },
  { value: "electronics", label: "Electronics", icon: "EL", keywords: ["electronics", "radio", "tv", "stereo", "speaker", "camera", "tested"] },
  { value: "clocks", label: "Clocks", icon: "CL", keywords: ["clock", "clocks", "watch", "timepiece"] },
  { value: "sporting", label: "Sporting Goods", icon: "SP", keywords: ["sport", "sporting", "golf", "bike", "fishing", "camping", "ball"] },
  { value: "seasonal", label: "Seasonal", icon: "SN", keywords: ["seasonal", "holiday", "christmas", "halloween", "patio", "summer", "winter"] },
  { value: "auto", label: "Auto", icon: "AU", keywords: ["auto", "car", "truck", "automotive", "garage", "tire"] },
  { value: "collectibles", label: "Collectibles", icon: "*", keywords: ["collectible", "collectibles", "vintage", "brass", "figurine", "antique", "estate"] },
  { value: "scratch-dent", label: "Clearance", icon: "TAG", keywords: ["clearance", "yellow", "markdown", "scratch", "dent", "as-is", "repair", "project", "needs work"] }
];
const POPULAR_PHOTO_FILTERS = ["furniture", "glassware", "tools", "clocks", "sporting"];
const PUBLIC_GALLERY_ALL_LIMIT = 3;
const DEPRECATED_PHOTO_ITEM_IDS = new Set([
  "starter-photo-clearance-1",
  "starter-photo-gallery-1",
  "starter-photo-special-1",
  "starter-photo-featured-1",
  "starter-photo-gallery-2",
  "today-2026-06-03-img-4163",
  "today-2026-06-03-img-4164",
  "today-2026-06-03-img-4165"
]);

let state = loadState();
let marketplaceFilter = "all";
let publicGalleryFilter = "all";
let photoCategoriesExpanded = false;
let clearanceShelfOpen = false;
let pricingPhotoDataUrl = "";
let pricingAiSuggestion = null;
let pricingScanTimer = null;
let selectedManagerEmployee = "";
let lastSalesSyncStatus = "";
let deferredInstallPrompt = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

init();

function init() {
  prepareStartupScroll();
  applyVisualVariants();
  populateCategorySelects();
  bindPublicControls();
  bindAppInstall();
  bindEmployeeAccess();
  bindEmployeeTabs();
  bindPricingTool();
  bindMarketplaceTool();
  bindDashboardTool();
  bindCalendarTool();
  bindContentTool();
  bindImportExport();
  renderAll();
  registerServiceWorker();
  settleHashScroll();
  window.addEventListener("load", settleHashScroll, { once: true });
  maybeRefreshAuthorizedSales();

  if (location.hash === "#employee") {
    openLogin();
  }

  if (sessionStorage.getItem(EMPLOYEE_SESSION_KEY) === "yes" && location.hash === "#employee") {
    openEmployeePanel();
  }
}

function prepareStartupScroll() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  const hash = decodeURIComponent(location.hash || "");
  if (hash && hash !== "#home" && hash !== "#top" && hash !== "#employee") {
    history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo({ top: 0 });
    return;
  }

  if (!hash || hash === "#home" || hash === "#top") {
    window.scrollTo({ top: 0 });
  }
}

function applyVisualVariants() {
  const params = new URLSearchParams(window.location.search);
  const requested = (params.get("band") || params.get("yellowBands") || "").toLowerCase();
  const version = (params.get("v") || "").toLowerCase();
  const useTightBands = requested === "tight" || version.includes("thin-yellow-bands-2");
  document.documentElement.dataset.yellowBandVariant = useTightBands ? "tight" : "balanced";
}

function loadState() {
  const starter = clone(window.VERNS_STARTER_DATA);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return starter;
    return normalizeState({ ...starter, ...saved });
  } catch {
    return starter;
  }
}

function normalizeState(nextState) {
  const starter = window.VERNS_STARTER_DATA;
  const rawSettings = nextState.settings || {};
  const settings = { ...starter.settings, ...rawSettings };
  if (rawSettings.contactInfoVersion !== CONTACT_INFO_VERSION) {
    settings.address = isOldAddress(rawSettings.address) ? starter.settings.address : settings.address;
    settings.phone = isOldPlaceholder(rawSettings.phone) ? starter.settings.phone : settings.phone;
    settings.email = isOldPlaceholder(rawSettings.email) ? starter.settings.email : settings.email;
    settings.facebookUrl = rawSettings.facebookUrl || starter.settings.facebookUrl;
    settings.hours = isOldHours(rawSettings.hours) ? starter.settings.hours : settings.hours;
    settings.shortHours = isOldShortHours(rawSettings.shortHours) ? starter.settings.shortHours : settings.shortHours;
    settings.location = isOldLocation(rawSettings.location) ? starter.settings.location : settings.location;
    settings.contactInfoVersion = CONTACT_INFO_VERSION;
  }
  let featured = Array.isArray(nextState.featured) ? nextState.featured : starter.featured;
  let specials = Array.isArray(nextState.specials) ? nextState.specials : starter.specials;
  let photoItems = removeDeprecatedPhotoItems(Array.isArray(nextState.photoItems) ? nextState.photoItems : starter.photoItems);
  let estateSales = mergeStarterSaleImages(Array.isArray(nextState.estateSales) ? nextState.estateSales : starter.estateSales, starter.estateSales);
  if (rawSettings.saleImageAssignmentVersion !== SALE_IMAGE_ASSIGNMENT_VERSION) {
    estateSales = applySaleImageAssignments(estateSales);
    settings.saleImageAssignmentVersion = SALE_IMAGE_ASSIGNMENT_VERSION;
  }
  if (rawSettings.demoContentVersion !== DEMO_CONTENT_VERSION) {
    featured = mergeSeedById(featured, starter.featured);
    specials = mergeSeedById(specials, starter.specials);
    estateSales = mergeSeedById(estateSales, starter.estateSales);
    photoItems = mergeSeedById(photoItems, starter.photoItems);
    photoItems = removeDeprecatedPhotoItems(photoItems);
    if (!getLiveEstateSaleUrl(rawSettings.saleUrl) || isEndedPopUpSaleUrl(rawSettings.saleUrl) || isInactiveStarterSaleUrl(rawSettings.saleUrl, starter.estateSales)) {
      settings.saleUrl = starter.settings.saleUrl || DEFAULT_ESTATE_SALE_URL;
    }
    settings.demoContentVersion = DEMO_CONTENT_VERSION;
  }
  if (isInactiveStarterSaleUrl(settings.saleUrl, starter.estateSales)) {
    settings.saleUrl = starter.settings.saleUrl || DEFAULT_ESTATE_SALE_URL;
  }
  estateSales = mergeSeedById(estateSales, starter.estateSales);

  return {
    settings,
    featured,
    specials,
    estateSales,
    photoItems,
    pricedItems: Array.isArray(nextState.pricedItems) ? nextState.pricedItems : [],
    marketplace: Array.isArray(nextState.marketplace) ? nextState.marketplace : [],
    timeoff: Array.isArray(nextState.timeoff) ? nextState.timeoff : [],
    calendarEvents: Array.isArray(nextState.calendarEvents) ? nextState.calendarEvents : starter.calendarEvents
  };
}

function removeDeprecatedPhotoItems(items) {
  return items.filter((item) => !DEPRECATED_PHOTO_ITEM_IDS.has(item.id));
}

function isOldPlaceholder(value) {
  return !value || /placeholder|hello@example|\(000\)/i.test(String(value));
}

function isOldAddress(value) {
  return isOldPlaceholder(value) || /Muskegon/i.test(String(value || ""));
}

function isOldHours(value) {
  return !value
    || value === "Thu-Sat 10 AM-5 PM"
    || value === "Tuesday-Saturday, 10 AM-5 PM"
    || value === "Thursday-Saturday, 10 AM-5 PM"
    || value === "Tue-Fri 10 AM-4 PM; Sat 9 AM-4 PM; Sun-Mon Closed"
    || value === "Mon-Fri 10 AM-4 PM; Sat 9 AM-4 PM; Sun Closed";
}

function isOldShortHours(value) {
  return !value
    || value === "Daily 9-5"
    || value === "Thu-Sat 10-5"
    || value === "Tue-Fri 10-4; Sat 9-4"
    || value === "Tue-Fri 10 AM-4 PM; Sat 9 AM-4 PM; Sun-Mon Closed"
    || value === "Mon-Fri 10-4; Sat 9-4";
}

function isOldLocation(value) {
  const clean = String(value || "").trim();
  return !clean || clean === "Muskegon area" || clean === "Muskegon, MI";
}

function applySaleImageAssignments(sales) {
  return sales.map((sale) => ({
    ...sale,
    image: SALE_IMAGE_ASSIGNMENTS[sale.id] || sale.image || ""
  }));
}

function mergeSeedById(existingItems, seedItems) {
  const seedIds = new Set((seedItems || []).map((item) => item.id));
  const customItems = (existingItems || []).filter((item) => !seedIds.has(item.id));
  return [...(seedItems || []), ...customItems];
}

function mergeStarterSaleImages(sales, starterSales) {
  const starterImages = new Map((starterSales || []).map((sale) => [sale.id, sale.image || ""]));
  return sales.map((sale) => ({
    ...sale,
    image: sale.image || starterImages.get(sale.id) || ""
  }));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderAll() {
  syncSignedInEmployeeToUi();
  renderSettings();
  renderEstateSales();
  renderClearance();
  renderPublicGallery();
  renderPricingTable();
  renderPricedItemSelect();
  renderMarketplaceList();
  renderDashboard();
  renderCalendarEvents();
  renderContentLists();
  renderPricingSettings();
  syncSignedInEmployeeToUi();
}

function bindPublicControls() {
  window.addEventListener("hashchange", settleHashScroll);
  document.addEventListener("click", handleHashLinkClick);
  $$("[data-clearance-jump]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      jumpToClearanceGate();
    });
  });
  $$("[data-clearance-toggle]").forEach((button) => button.addEventListener("click", () => toggleClearanceShelf()));
  $$("[data-clearance-hide]").forEach((button) => button.addEventListener("click", () => closeClearanceShelf({ scroll: true })));
}

function bindAppInstall() {
  const installButton = $("[data-install-app]");
  if (!installButton) return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
    showInstallStatus("Vern's app shortcut is installed.");
  });

  if (!isStandaloneApp()) showInstallButton();

  installButton.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      return;
    }
    showInstallStatus("On iPhone: Share > Add to Home Screen. On Android: menu > Add to Home screen.");
  });
}

function showInstallButton() {
  const installButton = $("[data-install-app]");
  if (!installButton || isStandaloneApp()) return;
  installButton.hidden = false;
}

function showInstallStatus(message) {
  const status = $("[data-install-status]");
  if (!status) return;
  status.textContent = message;
  status.hidden = false;
}

function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!/^https?:$/i.test(location.protocol)) return;
  if (location.hostname.endsWith(".trycloudflare.com")) return;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {
    // The site still works normally if install/offline support is unavailable.
  });
}

function handleHashLinkClick(event) {
  const link = event.target.closest?.("a[href^='#']");
  if (!link) return;

  const hash = link.getAttribute("href");
  if (!isPageHash(hash) || hash === "#employee") return;

  event.preventDefault();
  if (location.hash === hash) {
    settleHashScroll();
  } else {
    history.pushState(null, "", `${location.pathname}${location.search}${hash}`);
    settleHashScroll();
  }
}

function isPageHash(hash) {
  if (!hash || hash === "#") return false;
  if (hash === "#home" || hash === "#top") return true;
  return !!document.getElementById(hash.slice(1));
}

function setPhotoFilter(value) {
  if (!getPhotoCategory(value)) return;
  publicGalleryFilter = value;
  renderPublicGallery();
  scrollPhotoSectionTop();
}

function scrollPhotoSectionTop() {
  const section = $("#photos");
  const target = section ? $(".section-heading", section) || section : null;
  if (!target) return;
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function bindEmployeeAccess() {
  window.addEventListener("hashchange", () => {
    if (location.hash === "#employee") openLogin();
  });

  $("[data-employee-trigger]")?.addEventListener("click", () => {
    sessionStorage.removeItem(EMPLOYEE_SESSION_KEY);
    sessionStorage.removeItem(EMPLOYEE_PROFILE_KEY);
    sessionStorage.removeItem(MANAGER_SESSION_KEY);
    if (location.hash !== "#employee") {
      history.pushState(null, "", `${location.pathname}${location.search}#employee`);
    }
    openLogin();
  });

  $("[data-close-login]")?.addEventListener("click", closeLogin);

  $("[data-login-modal]")?.addEventListener("click", (event) => {
    if (event.target.matches("[data-login-modal]")) closeLogin();
  });

  $("[data-login-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const passcode = String(data.passcode || "");
    const profile = employeeProfileFromLogin(data.username);
    if (passcode === PASSCODE) {
      sessionStorage.setItem(EMPLOYEE_SESSION_KEY, "yes");
      sessionStorage.setItem(EMPLOYEE_PROFILE_KEY, JSON.stringify(profile));
      sessionStorage.setItem(MANAGER_SESSION_KEY, profile.manager ? "yes" : "no");
      localStorage.setItem(STAFF_NAME_KEY, profile.name);
      form.reset();
      closeLogin();
      openEmployeePanel({ tab: "dashboard" });
    } else {
      $("[data-login-message]").textContent = "Wrong username or passcode.";
    }
  });

  $("[data-logout]")?.addEventListener("click", () => {
    sessionStorage.removeItem(EMPLOYEE_SESSION_KEY);
    sessionStorage.removeItem(EMPLOYEE_PROFILE_KEY);
    sessionStorage.removeItem(MANAGER_SESSION_KEY);
    closeEmployeePanel();
  });

  $$("[data-back-to-site]").forEach((button) => {
    button.addEventListener("click", () => {
      closeLogin();
      closeEmployeePanel();
    });
  });
}

function openLogin() {
  if (sessionStorage.getItem(EMPLOYEE_SESSION_KEY) === "yes") {
    openEmployeePanel({ tab: "dashboard" });
    return;
  }
  const modal = $("[data-login-modal]");
  modal.hidden = false;
  document.body.classList.add("modal-open");
  setTimeout(() => $("#employee-username")?.focus(), 0);
}

function closeLogin() {
  const modal = $("[data-login-modal]");
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  $("[data-login-message]").textContent = "";
}

function openEmployeePanel({ tab = "" } = {}) {
  const panel = $("[data-employee-panel]");
  panel.hidden = false;
  document.body.classList.add("employee-open");
  syncSignedInEmployeeToUi({ force: true });
  renderAll();
  if (tab) setEmployeeTab(tab);
  $("[data-tab-panel].is-active")?.scrollTo({ top: 0 });
}

function closeEmployeePanel() {
  const panel = $("[data-employee-panel]");
  panel.hidden = true;
  document.body.classList.remove("employee-open");
  if (location.hash === "#employee") {
    history.replaceState(null, "", location.pathname + location.search);
  }
}

function employeeProfileFromLogin(username) {
  const rawName = String(username || "").trim();
  const key = normalizeEmployeeName(rawName);
  const manager = MANAGER_USERNAMES.has(key);
  return {
    username: key,
    name: STAFF_ACCOUNT_LABELS[key] || titleCaseName(rawName || "Employee"),
    manager
  };
}

function currentEmployeeProfile() {
  if (sessionStorage.getItem(EMPLOYEE_SESSION_KEY) !== "yes") return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(EMPLOYEE_PROFILE_KEY) || "null");
    if (parsed?.name) return {
      username: parsed.username || normalizeEmployeeName(parsed.name),
      name: parsed.name,
      manager: Boolean(parsed.manager)
    };
  } catch {
    return null;
  }
  const name = localStorage.getItem(STAFF_NAME_KEY) || "Employee";
  return {
    username: normalizeEmployeeName(name),
    name,
    manager: sessionStorage.getItem(MANAGER_SESSION_KEY) === "yes"
  };
}

function currentEmployeeName() {
  return currentEmployeeProfile()?.name || "";
}

function isManagerSignedIn() {
  return Boolean(currentEmployeeProfile()?.manager) || sessionStorage.getItem(MANAGER_SESSION_KEY) === "yes";
}

function syncSignedInEmployeeToUi({ force = false } = {}) {
  const profile = currentEmployeeProfile();
  const signedIn = $("[data-current-staff]");
  if (signedIn) {
    signedIn.hidden = !profile;
    signedIn.textContent = profile ? `Signed in as ${profile.name}${profile.manager ? " · Manager" : ""}` : "";
  }

  $$("[data-manager-only]").forEach((item) => {
    item.hidden = !profile?.manager;
  });

  if (!profile) return;
  const name = profile.name;
  const manager = profile.manager;
  localStorage.setItem(STAFF_NAME_KEY, name);

  const staffNameInput = $("[data-staff-name]");
  if (staffNameInput) {
    if (force || !staffNameInput.value || staffNameInput.value.trim() === staffNameInput.dataset.signedInName) {
      staffNameInput.value = name;
    }
    staffNameInput.dataset.signedInName = name;
    staffNameInput.dataset.previousName = name;
    staffNameInput.readOnly = true;
    staffNameInput.classList.add("is-locked-staff-field");
  }

  $$("[data-employee-panel] input[name='employee']").forEach((input) => {
    if (force || !input.value || input.value.trim() === input.dataset.signedInName || !manager) {
      input.value = name;
    }
    input.dataset.signedInName = name;
    input.readOnly = !manager;
    input.classList.toggle("is-locked-staff-field", !manager);
  });

  if (!manager && ($("[data-tab].is-active")?.dataset.tab === "settings" || $("[data-tab].is-active")?.dataset.tab === "content")) {
    setEmployeeTab("dashboard");
  }
  if (!manager && $("[data-staff-panel].is-active")?.dataset.staffPanel === "manager") {
    setStaffDashboardView("mine");
  }
}

function titleCaseName(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : "")
    .join(" ");
}

function settleHashScroll() {
  const hash = decodeURIComponent(location.hash || "");
  if (!hash || hash === "#employee") return;

  const run = () => {
    if (hash === "#home" || hash === "#top") {
      window.scrollTo({ top: 0 });
      return;
    }

    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    scrollTargetBelowHeader(target);
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      run();
    });
  });
  window.setTimeout(run, 250);
  window.setTimeout(run, 800);
}

function scrollTargetBelowHeader(target) {
  const header = $(".site-header");
  const headerStyle = header ? getComputedStyle(header) : null;
  const headerOffset = headerStyle?.position === "sticky" ? header.getBoundingClientRect().height + 24 : 0;
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top: Math.max(0, top) });
}

function jumpToClearanceGate() {
  closeClearanceShelf({ scroll: false });
  if (location.hash !== "#last-chance") {
    history.pushState(null, "", `${location.pathname}${location.search}#last-chance`);
  }
  const band = $("#last-chance");
  if (!band) return;
  const run = () => scrollTargetBelowHeader(band);
  requestAnimationFrame(run);
  window.setTimeout(run, 100);
  window.setTimeout(run, 300);
}

function toggleClearanceShelf() {
  if (clearanceShelfOpen) {
    closeClearanceShelf({ scroll: false });
    return;
  }
  openClearanceShelf({ scroll: true });
}

function openClearanceShelf({ scroll = false } = {}) {
  const section = $("[data-clearance-items-section]");
  if (!section) return;
  section.hidden = false;
  clearanceShelfOpen = true;
  updateClearanceToggleState();
  if (!scroll) return;
  scrollClearanceShelfIntoView(section);
}

function closeClearanceShelf({ scroll = false } = {}) {
  const section = $("[data-clearance-items-section]");
  if (!section) return;
  section.hidden = true;
  clearanceShelfOpen = false;
  updateClearanceToggleState();
  if (!scroll) return;
  const band = $("#last-chance");
  if (band) requestAnimationFrame(() => scrollTargetBelowHeader(band));
}

function updateClearanceToggleState() {
  $$("[data-clearance-toggle]").forEach((control) => {
    control.setAttribute("aria-expanded", String(clearanceShelfOpen));
    control.classList.toggle("is-open", clearanceShelfOpen);
  });
}

function scrollClearanceShelfIntoView(section) {
  const target = $(".section-heading", section) || section;
  const run = () => scrollTargetBelowHeader(target);
  requestAnimationFrame(run);
  window.setTimeout(run, 100);
  window.setTimeout(run, 300);
}

function bindEmployeeTabs() {
  $$("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => setEmployeeTab(button.dataset.tab));
  });
}

function setEmployeeTab(tab) {
  if (!tab) return;
  if (!isManagerSignedIn() && ["settings", "content"].includes(tab)) tab = "dashboard";
  $$("[data-tab]").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.tab === tab);
  });
  $$("[data-tab-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.tabPanel === tab);
    if (panel.dataset.tabPanel === tab) panel.scrollTop = 0;
  });
}

function populateCategorySelects() {
  const categories = Object.entries(window.VERNS_PRICE_GUIDE);
  const html = categories.map(([value, guide]) => `<option value="${value}">${guide.label}</option>`).join("");
  $$("[data-category-select], [data-market-category-select]").forEach((select) => {
    select.innerHTML = html;
  });
  const photoTypeHtml = PHOTO_CATEGORY_FILTERS
    .filter((category) => category.value !== "all")
    .map((category) => `<option value="${category.value}">${category.label}</option>`)
    .join("");
  $$("[data-photo-item-type-select]").forEach((select) => {
    select.innerHTML = photoTypeHtml;
  });
}

function renderSettings() {
  const settings = state.settings;
  const currentYear = $("[data-current-year]");
  if (currentYear) currentYear.textContent = new Date().getFullYear();
  const businessHours = $("[data-business-hours]");
  if (businessHours) businessHours.textContent = settings.shortHours || settings.hours;
  const locationLabel = $("[data-business-location-label]");
  if (locationLabel) locationLabel.textContent = settings.location || "Norton Shores, MI";
  else {
    const businessLocation = $("[data-business-location]");
    if (businessLocation) businessLocation.textContent = settings.location || "Norton Shores, MI";
  }
  $$("[data-business-address]").forEach((item) => {
    item.textContent = settings.address;
  });
  renderVisitHours(settings.hours);

  $$("[data-business-phone]").forEach((phoneLink) => {
    const phoneDigits = settings.phone.replace(/\D/g, "");
    const phoneHref = phoneDigits.length === 10
      ? `tel:+1${phoneDigits}`
      : `tel:${settings.phone.replace(/[^\d+]/g, "")}`;
    phoneLink.textContent = phoneLink.hasAttribute("data-business-phone-action")
      ? `Call ${settings.phone}`
      : settings.phone;
    phoneLink.href = phoneHref;
  });

  const emailLink = $("[data-business-email]");
  if (emailLink) {
    emailLink.textContent = settings.email || "Message on Facebook";
    emailLink.href = settings.email ? `mailto:${settings.email}` : settings.facebookUrl || "#";
  }

  $$("[data-business-facebook]").forEach((link) => {
    const label = link.querySelector("[data-business-facebook-label]");
    if (label) label.textContent = "Verns Facebook";
    else link.textContent = "Verns Facebook";
    link.href = settings.facebookUrl || "#";
  });

  $$("[data-business-directions]").forEach((link) => {
    link.href = directionsUrl(settings.address);
  });

  const estateLink = $("[data-estate-link]");
  const companyUrl = getEstateCompanyUrl(settings.companyUrl);
  const liveSaleUrl = getLiveEstateSaleUrl(settings.saleUrl);
  const activeSaleUrl = getPrimaryEstateSaleUrl() || liveSaleUrl;
  const publicEstateUrl = activeSaleUrl || companyUrl;

  $$("[data-estate-company-link]").forEach((link) => {
    link.href = publicEstateUrl;
    if (activeSaleUrl && link.textContent.trim() && !link.querySelector("img")) {
      link.textContent = "Upcoming Sales on EstateSales.NET";
      link.setAttribute("aria-label", "Open upcoming EstateSales.NET sale");
    }
  });
  if (activeSaleUrl) {
    if (estateLink) {
      estateLink.href = activeSaleUrl;
      estateLink.textContent = "View Current Sale Photos";
      estateLink.removeAttribute("aria-disabled");
    }
  } else {
    if (estateLink) {
      estateLink.href = companyUrl;
      estateLink.textContent = "Open EstateSales.NET Page";
      estateLink.removeAttribute("aria-disabled");
    }
  }

  const embedWrap = $("[data-estate-embed-wrap]");
  const embed = $("[data-estate-embed]");
  if (embedWrap && embed && settings.embedUrl && isEstateSalesUrl(settings.embedUrl)) {
    embed.src = settings.embedUrl;
    embedWrap.hidden = false;
  } else if (embedWrap && embed) {
    embed.removeAttribute("src");
    embedWrap.hidden = true;
  }

  const settingsForm = $("[data-settings-form]");
  if (settingsForm) {
    settingsForm.companyUrl.value = settings.companyUrl || DEFAULT_ESTATE_COMPANY_URL;
    settingsForm.saleUrl.value = settings.saleUrl || "";
    settingsForm.embedUrl.value = settings.embedUrl || "";
    settingsForm.address.value = settings.address || "";
    settingsForm.phone.value = settings.phone || "";
    settingsForm.email.value = settings.email || "";
    settingsForm.facebookUrl.value = settings.facebookUrl || "";
    settingsForm.hours.value = settings.hours || "";
    settingsForm.aiEndpoint.value = settings.aiEndpoint || "";
    settingsForm.salesSyncUrl.value = settings.salesSyncUrl || "";
    settingsForm.salesAutoSync.checked = settings.salesAutoSync !== false;
  }

  const syncStatus = $("[data-sales-sync-status]");
  if (syncStatus) {
    syncStatus.textContent = lastSalesSyncStatus || "Daily sync uses Vern's backend. EstateSales.NET page-checking stays disabled on the server unless permission is configured.";
  }
}

function directionsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "Vern's Estate Sale Warehouse Norton Shores MI")}`;
}

function isEstateSalesUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "estatesales.net" || url.hostname.endsWith(".estatesales.net"));
  } catch {
    return false;
  }
}

function getEstateCompanyUrl(value) {
  return isEstateSalesUrl(value) ? value : DEFAULT_ESTATE_COMPANY_URL;
}

function getLiveEstateSaleUrl(value) {
  if (!isEstateSalesUrl(value)) return "";
  if (isEndedPopUpSaleUrl(value)) return "";
  const url = new URL(value);
  const path = url.pathname.replace(/\/+$/, "");
  return path && !path.startsWith("/companies") ? value : "";
}

function isEndedPopUpSaleUrl(value) {
  return normalizeUrlForCompare(value) === normalizeUrlForCompare(ENDED_POPUP_SALE_URL);
}

function isInactiveStarterSaleUrl(value, starterSales = []) {
  const matchedSale = starterSales.find((sale) => normalizeUrlForCompare(sale.url) === normalizeUrlForCompare(value));
  return Boolean(matchedSale && ["past", "ended", "canceled"].includes(matchedSale.status));
}

function normalizeUrlForCompare(value) {
  return String(value || "").trim().replace(/\/+$/, "").toLowerCase();
}

function displayUrl(value) {
  return String(value).replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function renderEstateSales() {
  const grid = $("[data-estate-sales-grid]");
  const note = $("[data-sale-board-note]");
  if (!grid) return;

  const sales = getVisibleEstateSales();
  if (!sales.length) {
    grid.replaceChildren(
      divEl("empty-sale-card", [
        headingEl("h3", "No current sale links yet"),
        pEl("", "Open Vern's EstateSales.NET page for the latest public listings."),
        linkEl("btn btn-gold", getEstateCompanyUrl(state.settings.companyUrl), "Open official page")
      ])
    );
    if (note) note.textContent = "Staff can add upcoming sale links from the hidden employee Public Content tab.";
    return;
  }

  const cards = sales.map(renderEstateSaleCard);
  if (sales.length < 3) cards.push(renderComingSoonSaleCard());
  grid.replaceChildren(...cards);
  if (note) note.textContent = "Times can move. Open the yellow buttons for official EstateSales.NET listings and final terms.";
}

function renderComingSoonSaleCard() {
  const card = articleEl("estate-sale-card coming-soon-sale-card");
  card.append(
    comingSoonImageEl(),
    spanEl("tag sale-card-badge sale-scheduling-tag", "Next cities scheduling"),
    headingEl("h3", "More Sales Coming Soon"),
    pEl("sale-location sale-city-line", "Grand Rapids · Spring Lake · Lakeshore · Holland"),
    pEl("sale-date", "New dates are being lined up"),
    pEl("", "Vern's sale board changes as dates lock in. Check back for the next round of official listings."),
    linkEl("btn btn-dark", getEstateCompanyUrl(state.settings.companyUrl), "Watch Vern's page")
  );
  return card;
}

function comingSoonImageEl() {
  const wrap = divEl("sale-image-wrap coming-soon-image-wrap");
  wrap.append(
    imageEl("assets/img/sale-coming-soon-west-mi.png", "Retro estate sale map and yellow tags for upcoming Vern's sales"),
    divEl("coming-soon-overlay", [
      spanEl("coming-soon-kicker", "More sales"),
      spanEl("coming-soon-title", "Coming soon")
    ])
  );
  return wrap;
}

function renderEstateSaleCard(sale) {
  const card = articleEl(`estate-sale-card status-${sale.status || "upcoming"}`);
  card.append(
    saleImageEl(sale),
    spanEl("tag sale-card-badge", saleStatusLabel(sale.status)),
    headingEl("h3", sale.title),
    pEl("sale-location", sale.city || "Estate sale"),
    sale.address ? pEl("sale-address", sale.address) : "",
    pEl("sale-date", sale.dateSummary || "Dates on EstateSales.NET"),
    pEl("", sale.hours || "Check official listing for current hours."),
    pEl("", sale.note || "Full photos and final details are on EstateSales.NET."),
    linkEl("btn btn-gold", sale.url, sale.buttonLabel || "Open official listing")
  );
  return card;
}

function saleImageEl(sale) {
  const wrap = divEl("sale-image-wrap");
  if (sale.image) {
    wrap.append(imageEl(sale.image, `${sale.title} main sale photo`));
  } else {
    wrap.append(
      imageEl("assets/img/placeholder-furniture.svg", ""),
      spanEl("sale-image-missing", "Add main sale photo")
    );
  }
  return wrap;
}

function getVisibleEstateSales() {
  return (state.estateSales || [])
    .filter((sale) => isEstateSalesUrl(sale.url) && sale.status !== "past" && sale.status !== "canceled")
    .sort((a, b) => saleSortValue(a) - saleSortValue(b));
}

function getPrimaryEstateSaleUrl() {
  const starterSaleUrl = window.VERNS_STARTER_DATA?.settings?.saleUrl || "";
  const starterSale = (state.estateSales || []).find((sale) => normalizeUrlForCompare(sale.url) === normalizeUrlForCompare(starterSaleUrl));
  if (getLiveEstateSaleUrl(starterSaleUrl) && starterSale && ["upcoming", "live"].includes(starterSale.status)) {
    return starterSaleUrl;
  }
  return getVisibleEstateSales().find((sale) => ["upcoming", "live"].includes(sale.status))?.url || "";
}

function saleSortValue(sale) {
  const statusOrder = {
    live: 0,
    upcoming: 1,
    ended: 8
  }[sale.status] ?? 5;
  const match = String(sale.dateSummary || "").match(/([A-Z][a-z]{2})\s+(\d{1,2})(?:-\d{1,2})?,?\s+(\d{4})/);
  const parsed = match ? Date.parse(`${match[1]} ${match[2]}, ${match[3]}`) : NaN;
  const dateValue = Number.isNaN(parsed) ? Date.now() : parsed;
  return (statusOrder * 10000000000000) + dateValue;
}

function isSaleReviewDue(sale) {
  if (!sale.lastReviewed) return true;
  const last = Date.parse(`${sale.lastReviewed}T00:00:00`);
  if (Number.isNaN(last)) return true;
  return Date.now() - last > 24 * 60 * 60 * 1000;
}

function reviewStamp(value) {
  if (!value) return "Needs review";
  const today = new Date().toISOString().slice(0, 10);
  return value === today ? "Checked today" : `Checked ${displayDate(value)}`;
}

function saleStatusLabel(status) {
  return {
    upcoming: "Upcoming",
    live: "Live now",
    ended: "Sale ended",
    past: "Past",
    canceled: "Canceled"
  }[status] || "Upcoming";
}

function renderClearance() {
  const grid = $("[data-clearance-grid]");
  if (!grid) return;
  const items = state.photoItems.filter((item) => item.category === "clearance");
  grid.replaceChildren(...items.map(renderPublicItemCard));
}

function renderPublicGallery() {
  const grid = $("[data-public-gallery]");
  if (!grid) return;
  renderPhotoCategoryControls();
  const items = state.photoItems
    .filter((item) => item.category !== "clearance")
    .filter((item) => photoItemMatchesFilter(item, publicGalleryFilter));
  const visibleItems = publicGalleryFilter === "all" ? items.slice(0, PUBLIC_GALLERY_ALL_LIMIT) : items;
  grid.classList.toggle("is-expanded-category", publicGalleryFilter !== "all");
  grid.replaceChildren(...(visibleItems.length ? visibleItems.map(renderPublicItemCard) : [renderComingSoonCategoryCard(getPhotoCategory(publicGalleryFilter))]));
  const note = $("[data-photo-result-note]");
  if (!note) return;
  const active = getPhotoCategory(publicGalleryFilter);
  const activeLabel = publicGalleryFilter === "all" ? "All categories" : active.label;
  const visibleCount = visibleItems.length;
  if (!items.length) {
    note.textContent = `No floor peeks in ${activeLabel}.`;
  } else if (publicGalleryFilter === "all") {
    note.textContent = `Showing ${visibleCount}${items.length > visibleCount ? ` of ${items.length}` : ""} floor peeks. Pick a category to open more photos.`;
  } else {
    note.textContent = `Showing all ${visibleCount} floor peek${visibleCount === 1 ? "" : "s"} in ${activeLabel}.`;
  }
}

function renderPublicItemCard(item) {
  const card = articleEl("item-card");
  const itemType = photoItemType(item);
  const category = getPhotoCategory(itemType);
  const linksToCategory = publicGalleryFilter === "all" && item.category !== "clearance" && category?.value && category.value !== "all";
  const categoryLabel = photoItemTypeLabel(item);
  const title = item.title || categoryLabel;
  const displayTitle = normalizeCardTitle(title) === normalizeCardTitle(categoryLabel)
    ? "Floor photo"
    : title;
  if (linksToCategory) {
    card.classList.add("is-category-link");
    card.dataset.photoCardFilter = category.value;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${category.label} floor photos`);
    card.title = `Open ${category.label} floor photos`;
    card.addEventListener("click", () => setPhotoFilter(category.value));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setPhotoFilter(category.value);
    });
  }
  card.append(
    itemImageWithOverlay(item),
    divEl("meta-line", [spanEl("tag", categoryLabel), item.price && item.category !== "clearance" ? pEl("price", item.price) : document.createTextNode("")]),
    headingEl("h3", displayTitle),
    pEl("", item.note || item.tag || "")
  );
  if (linksToCategory) {
    card.append(spanEl("card-category-link", `View ${category.label}`));
  }
  return card;
}

function normalizeCardTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function renderComingSoonCategoryCard(category) {
  const card = articleEl("item-card coming-soon-card");
  const label = category?.label || "Floor photos";
  card.append(
    divEl("item-image-wrap coming-soon-image", [
      spanEl("coming-soon-mark", "+")
    ]),
    divEl("meta-line", [spanEl("tag", label)]),
    headingEl("h3", `${label} coming soon`),
    pEl("", "More floor photos will be added here as staff tags new items.")
  );
  return card;
}

function renderPhotoCategoryControls() {
  const heading = $("[data-photo-chip-heading]");
  if (heading) heading.textContent = photoCategoriesExpanded ? "All categories" : "Popular categories";

  const buttonWrap = $("[data-photo-category-buttons]");
  if (!buttonWrap) return;
  const visibleCategoryValues = photoCategoriesExpanded
    ? PHOTO_CATEGORY_FILTERS.filter((category) => category.value !== "all").map((category) => category.value)
    : collapsedPhotoCategoryValues();
  const buttons = visibleCategoryValues.map((value) => {
    const category = getPhotoCategory(value);
    const button = document.createElement("button");
    button.className = `photo-category-button${category.value === publicGalleryFilter ? " is-active" : ""}`;
    button.type = "button";
    button.dataset.photoFilter = category.value;
    button.setAttribute("aria-pressed", String(category.value === publicGalleryFilter));
    button.title = `Show ${category.label}`;
    button.addEventListener("click", () => setPhotoFilter(category.value));
    if (category.value === publicGalleryFilter) button.append(spanEl("selected-mark", "✓"));
    button.append(spanEl("", category.label));
    return button;
  });
  const moreButton = document.createElement("button");
  moreButton.className = "photo-category-button more-category-button";
  moreButton.type = "button";
  moreButton.dataset.photoFilter = "more";
  moreButton.setAttribute("aria-expanded", String(photoCategoriesExpanded));
  moreButton.textContent = photoCategoriesExpanded ? "Show fewer" : "More categories +";
  moreButton.addEventListener("click", () => {
    photoCategoriesExpanded = !photoCategoriesExpanded;
    renderPublicGallery();
  });
  buttonWrap.replaceChildren(...buttons, moreButton);
}

function collapsedPhotoCategoryValues() {
  const values = [...POPULAR_PHOTO_FILTERS];
  if (publicGalleryFilter !== "all" && !values.includes(publicGalleryFilter)) {
    values.splice(values.length - 1, 0, publicGalleryFilter);
  }
  return values;
}

function photoItemMatchesFilter(item, filter) {
  if (filter === "all") return true;
  return photoItemType(item) === filter;
}

function photoItemType(item) {
  if (isPhotoItemType(item.itemType)) return item.itemType;
  const haystack = [item.title, item.tag, item.note, item.category].filter(Boolean).join(" ").toLowerCase();
  const match = PHOTO_CATEGORY_FILTERS.find((category) => {
    if (category.value === "all") return false;
    return category.keywords.some((keyword) => haystack.includes(keyword));
  });
  return match?.value || "homegoods";
}

function photoItemTypeLabel(item) {
  return getPhotoCategory(photoItemType(item))?.label || "Floor photo";
}

function getPhotoCategory(value) {
  return PHOTO_CATEGORY_FILTERS.find((category) => category.value === value) || PHOTO_CATEGORY_FILTERS[0];
}

function isPhotoItemType(value) {
  return PHOTO_CATEGORY_FILTERS.some((category) => category.value === value && category.value !== "all");
}

function itemImageWithOverlay(item) {
  const wrap = divEl("item-image-wrap");
  wrap.append(imageEl(item.image || "assets/img/placeholder-furniture.svg", item.title));
  if (item.category === "clearance" && (item.price || item.tag)) {
    wrap.append(
      divEl("price-overlay public-price-overlay", [
        strongEl(item.price || "Sale"),
        spanEl("", item.tag || "Last Chance")
      ])
    );
  }
  return wrap;
}

function bindPricingTool() {
  const form = $("[data-pricing-form]");
  if (!form) return;

  form.photo?.addEventListener("change", () => updatePricingPhotoPreview(form));
  form.destination?.addEventListener("change", () => updatePricingOverlayPreview(form));
  form.clearancePrice?.addEventListener("input", () => updatePricingOverlayPreview(form));
  $("[data-price-photo-ai]")?.addEventListener("click", () => pricePhotoWithAi(form));
  $("[data-suggest-price]")?.addEventListener("click", () => fillSuggestedPrices(form));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    fillSuggestedPrices(form, false);
    const data = Object.fromEntries(new FormData(form));
    const uploaded = pricingPhotoDataUrl || (await firstFileToDataUrl(form.photo?.files || []));
    const item = {
      id: createId("price"),
      name: data.name.trim(),
      category: data.category,
      condition: data.condition,
      marketValue: data.marketValue.trim(),
      retailValue: data.retailValue.trim(),
      storePrice: data.storePrice.trim(),
      marketPrice: data.marketPrice.trim(),
      clearancePrice: data.clearancePrice.trim(),
      notes: data.notes.trim(),
      status: data.status,
      employee: employeeNameForSave(data.employee),
      destination: data.destination,
      image: uploaded,
      ai: pricingAiSuggestion,
      createdAt: new Date().toISOString()
    };
    state.pricedItems.unshift(item);
    publishPricedItem(item, data.destination);
    saveState();
    form.reset();
    form.category.value = "furniture";
    form.condition.value = "good";
    form.destination.value = "sales-floor";
    pricingPhotoDataUrl = "";
    pricingAiSuggestion = null;
    resetPricingPhotoPreview();
    renderAll();
  });
}

function renderVisitHours(hoursText) {
  const hoursWrap = $("[data-business-hours-full]");
  if (!hoursWrap) return;

  const normalized = String(hoursText || "").replace(/\s+/g, " ");
  if (/every day|daily/i.test(normalized) && /9\s*(AM)?-?5\s*PM/i.test(normalized)) {
    hoursWrap.replaceChildren(
      hoursChipEl("hours-everyday", "Every day", "9 AM-5 PM")
    );
    return;
  }
  if (/Mon-Fri/i.test(normalized) && /Sat/i.test(normalized) && /Sun/i.test(normalized)) {
    hoursWrap.replaceChildren(
      hoursChipEl("hours-weekday", "Monday-Friday", "10 AM-4 PM"),
      hoursChipEl("hours-saturday", "Saturday", "9 AM-4 PM"),
      hoursChipEl("hours-sunday", "Sunday", "Closed")
    );
    return;
  }

  hoursWrap.textContent = hoursText || "";
}

function hoursChipEl(className, day, time) {
  const chip = document.createElement("span");
  chip.className = `hours-chip ${className}`;
  chip.append(spanEl("hours-day", day), spanEl("hours-time", time));
  return chip;
}

async function updatePricingPhotoPreview(form) {
  const [file] = Array.from(form.photo?.files || []);
  if (!file) {
    resetPricingPhotoPreview();
    return;
  }
  pricingPhotoDataUrl = await fileToDataUrl(file);
  const preview = $("[data-pricing-preview-image]");
  const wrap = preview?.closest(".pricing-photo-preview");
  if (wrap) wrap.classList.remove("is-empty");
  if (preview) {
    preview.hidden = false;
    preview.src = pricingPhotoDataUrl;
    preview.alt = file.name || "Selected pricing item preview";
  }
  setPricingPhotoActionVisible(true);
  updatePricingOverlayPreview(form);
  window.setTimeout(scrollPricingPreviewIntoView, 120);
}

function resetPricingPhotoPreview() {
  const preview = $("[data-pricing-preview-image]");
  if (preview) {
    preview.removeAttribute("src");
    preview.alt = "Selected pricing item preview";
    preview.hidden = true;
    const wrap = preview.closest(".pricing-photo-preview");
    if (wrap) wrap.classList.add("is-empty");
  }
  stopPricingScanCountdown();
  setPricingPhotoActionVisible(false);
  const status = $("[data-pricing-ai-status]");
  if (status) status.textContent = "Take a picture, then let AI fill the form.";
  const overlay = $("[data-pricing-clearance-overlay]");
  if (overlay) overlay.hidden = true;
}

function updatePricingOverlayPreview(form) {
  const overlay = $("[data-pricing-clearance-overlay]");
  if (!overlay || !form) return;
  const shouldShow = form.destination?.value === "clearance" && Boolean(form.clearancePrice?.value?.trim());
  overlay.hidden = !shouldShow;
  $("[data-pricing-overlay-price]").textContent = form.clearancePrice.value.trim() || "Sale";
}

function pricingPreviewHasPhoto() {
  const preview = $("[data-pricing-preview-image]");
  return Boolean(preview && !preview.hidden && preview.getAttribute("src"));
}

function setPricingPhotoActionVisible(visible) {
  const button = $("[data-price-photo-ai]");
  if (!button) return;
  button.hidden = !visible;
  button.disabled = !visible || Boolean(pricingScanTimer);
}

function setPricingPhotoScanning(isScanning) {
  const wrap = $(".pricing-photo-preview");
  const overlay = $("[data-pricing-scan-overlay]");
  if (wrap) wrap.classList.toggle("is-scanning", isScanning);
  if (overlay) overlay.hidden = !isScanning;
  setPricingPhotoActionVisible(!isScanning && pricingPreviewHasPhoto());
}

function scrollPricingPreviewIntoView() {
  const preview = $(".pricing-photo-preview");
  if (!preview || typeof preview.scrollIntoView !== "function") return;
  preview.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

async function pricePhotoWithAi(form) {
  const status = $("[data-pricing-ai-status]");
  const [file] = Array.from(form.photo?.files || []);
  if (pricingScanTimer) return;
  if (!file) {
    if (status) status.textContent = "Take or choose a photo first.";
    form.photo?.focus();
    return;
  }

  startPricingScanCountdown(status);
  const endpoint = state.settings.aiEndpoint || "/api/price-photo";
  const endpointWarning = aiEndpointWarning(endpoint);
  if (endpointWarning) {
    const fallback = localPricingSuggestion({
      hint: form.hint.value,
      category: form.category.value,
      condition: form.condition.value
    });
    pricingAiSuggestion = {
      ...fallback,
      source: "local-fallback",
      notes: endpointWarning,
      priceBasis: "Local fallback because the AI endpoint is not reachable from this page."
    };
    applyPricingSuggestion(form, pricingAiSuggestion);
    stopPricingScanCountdown();
    status.textContent = endpointWarning;
    return;
  }

  const payload = new FormData();
  payload.append("hint", form.hint.value.trim());
  payload.append("category", form.category.value);
  payload.append("condition", form.condition.value);
  payload.append("thriftMarkdownPercent", String(state.settings.thriftMarkdownPercent ?? 50));
  payload.append("marketplacePercent", String(state.settings.marketplacePercent ?? 90));
  payload.append("clearanceMarkdownPercent", String(state.settings.clearanceMarkdownPercent ?? 75));
  payload.append("defaultPricingBasis", state.settings.defaultPricingBasis || "market");

  try {
    const uploadImage = await fileToUploadImage(file);
    payload.append("images", uploadImage.blob, uploadImage.filename);
    const response = await fetch(endpoint, { method: "POST", body: payload });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "AI pricing failed. Try one clear photo.");
    }
    pricingAiSuggestion = data.result || data;
    applyPricingSuggestion(form, pricingAiSuggestion);
    status.textContent = pricingAiSuggestion.source === "fallback"
      ? backendFallbackMessage(pricingAiSuggestion)
      : "AI price added. Staff should verify condition before tagging.";
  } catch (error) {
    const fallback = localPricingSuggestion({
      hint: form.hint.value,
      category: form.category.value,
      condition: form.condition.value
    });
    const message = readableAiPricingError(error);
    pricingAiSuggestion = {
      ...fallback,
      source: "local-fallback",
      notes: message,
      priceBasis: "Local fallback because the AI endpoint did not answer."
    };
    applyPricingSuggestion(form, pricingAiSuggestion);
    status.textContent = message;
  } finally {
    stopPricingScanCountdown();
  }
}

function startPricingScanCountdown(status) {
  stopPricingScanCountdown();
  setPricingPhotoScanning(true);
  const countdown = $("[data-pricing-scan-countdown]");
  const copy = $("[data-pricing-scan-copy]");
  let remaining = 10;
  const render = () => {
    if (countdown) countdown.textContent = String(remaining);
    if (copy) {
      copy.textContent = remaining >= 0
        ? "AI is checking the item and shelf price."
        : "Still working. Keep this open.";
    }
    if (status) {
      status.textContent = remaining >= 0
        ? `Scanning photo... ${remaining}`
        : `Still scanning... ${remaining}`;
    }
    remaining -= 1;
  };
  render();
  pricingScanTimer = window.setInterval(render, 1000);
}

function stopPricingScanCountdown() {
  if (pricingScanTimer) window.clearInterval(pricingScanTimer);
  pricingScanTimer = null;
  setPricingPhotoScanning(false);
}

function aiEndpointWarning(endpoint) {
  if (window.location.protocol === "file:" && String(endpoint || "").startsWith("/")) {
    return "AI pricing needs the Vern server link, not the raw file. Local fallback filled the form for now.";
  }
  return "";
}

function readableAiPricingError(error) {
  const message = String(error?.message || "");
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    return "AI pricing could not reach the Vern server. Local fallback filled the form for now.";
  }
  if (/not found|404/i.test(message)) {
    return "AI pricing is not available on this page link yet. Local fallback filled the form for now.";
  }
  if (/OPENAI_API_KEY/i.test(message)) {
    return "The Vern server is running, but the AI key is not configured there. Local fallback filled the form for now.";
  }
  if (/timed out|timeout|AbortError/i.test(message)) {
    return "AI pricing timed out. Local fallback filled the form; try one clear photo again.";
  }
  return message || "AI pricing was unavailable. Local fallback filled the form for now.";
}

function backendFallbackMessage(suggestion) {
  if (/OPENAI_API_KEY/i.test(suggestion.notes || "")) {
    return "The Vern server is running, but the AI key is not configured there. Local fallback filled the form.";
  }
  if (/unreadable|Retake|No readable image|unsupported|format/i.test(`${suggestion.notes || ""} ${suggestion.priceBasis || ""}`)) {
    return "The photo format was not readable. A safe starting price filled in; try a camera photo or JPG if it looks off.";
  }
  if (/timed out|failed|rejected|Unexpected|JSON|parse/i.test(`${suggestion.notes || ""} ${suggestion.priceBasis || ""}`)) {
    return "AI could not finish that scan. A safe starting price filled in; add a brand, tag, or model hint and try again when needed.";
  }
  return "AI filled a safe starting estimate. Staff should verify before tagging.";
}

function applyPricingSuggestion(form, suggestion) {
  const itemName = clarifyPricingItemName(suggestion, form.name?.value);
  const normalizedCategory = normalizePricingCategory(
    suggestion.category,
    itemName,
    suggestion.itemName,
    suggestion.title,
    suggestion.marketplaceTitle,
    suggestion.notes,
    form.hint?.value
  );
  if (normalizedCategory) suggestion.category = normalizedCategory;
  form.name.value = itemName || "Estate sale warehouse item";
  if (normalizedCategory && window.VERNS_PRICE_GUIDE[normalizedCategory]) form.category.value = normalizedCategory;
  if (suggestion.condition) form.condition.value = normalizedConditionValue(suggestion.condition);
  form.marketValue.value = moneyValue(suggestion.marketValue || suggestion.likelySellingPrice || suggestion.estimatedHigh);
  form.retailValue.value = moneyValue(suggestion.retailValue || suggestion.originalRetailValue);
  form.storePrice.value = moneyValue(suggestion.storePrice);
  form.marketPrice.value = moneyValue(suggestion.marketplacePrice || suggestion.marketPrice);
  form.clearancePrice.value = moneyValue(suggestion.clearancePrice);
  form.notes.value = [
    suggestion.notes,
    suggestion.priceBasis ? `Basis: ${suggestion.priceBasis}` : "",
    suggestion.confidence ? `Confidence: ${suggestion.confidence}` : ""
  ].filter(Boolean).join("\n");
  updatePricingOverlayPreview(form);
}

function clarifyPricingItemName(suggestion = {}, fallbackName = "") {
  const fields = [
    suggestion.itemName,
    suggestion.title,
    suggestion.marketplaceTitle,
    suggestion.marketplaceDescription,
    suggestion.notes,
    suggestion.priceBasis,
    fallbackName
  ];
  const joined = fields.filter(Boolean).join(" ");
  const mediaFormat = mediaFormatFromText(joined);
  const current = String(suggestion.itemName || suggestion.title || fallbackName || "").trim();
  if (!mediaFormat) return current.slice(0, 90);

  const candidate = [
    suggestion.itemName,
    suggestion.title,
    suggestion.marketplaceTitle,
    fallbackName
  ].map((value) => cleanMediaCandidateName(value, mediaFormat))
    .find((value) => value && !isVagueMediaName(value, mediaFormat));

  if (candidate) {
    return nameIncludesMediaFormat(candidate, mediaFormat)
      ? candidate.slice(0, 90)
      : `${candidate} ${mediaFormat}`.slice(0, 90);
  }

  const extractedTitle = extractMediaTitle(joined);
  if (extractedTitle) return `${extractedTitle} ${mediaFormat}`.slice(0, 90);

  if (current && !isVagueMediaName(current, mediaFormat)) {
    return nameIncludesMediaFormat(current, mediaFormat)
      ? current.slice(0, 90)
      : `${current} ${mediaFormat}`.slice(0, 90);
  }
  return `${mediaFormat} media item`.slice(0, 90);
}

function cleanMediaCandidateName(value, mediaFormat) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const extractedTitle = extractMediaTitle(raw);
  if (extractedTitle) return `${extractedTitle} ${mediaFormat}`;
  return raw
    .replace(/\s+-\s+Vern'?s Estate Sale Warehouse.*$/i, "")
    .replace(/\bVern'?s Estate Sale Warehouse\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^["'\u201c\u201d\s]+|["'\u201c\u201d.\s]+$/g, "")
    .trim()
    .slice(0, 90);
}

function mediaFormatFromText(text) {
  const value = String(text || "").toLowerCase();
  if (/\bblu[-\s]?ray\b/.test(value)) return "Blu-ray";
  if (/\bdvd\b/.test(value)) return "DVD";
  if (/\b(cd|compact disc)\b/.test(value)) return "CD";
  if (/\bvhs\b/.test(value)) return "VHS";
  if (/\b(vinyl|record|lp)\b/.test(value)) return "Vinyl record";
  if (/\b(xbox|playstation|ps[1-5]?|nintendo|wii|switch|gamecube|video game)\b/.test(value)) return "Video game";
  if (/\b(book|novel|hardcover|paperback)\b/.test(value)) return "Book";
  return "";
}

function extractMediaTitle(text) {
  const source = String(text || "");
  const patterns = [
    /\b(?:dvd|cd|blu[-\s]?ray|vhs|record|vinyl|book|game|video game)\s+(?:titled|title|called|named)\s+["'\u201c\u201d]?([^"'\u201c\u201d.,;\n]{2,80})/i,
    /\b(?:titled|title|called|named)\s+["'\u201c\u201d]?([^"'\u201c\u201d.,;\n]{2,80})["'\u201c\u201d]?\s+(?:dvd|cd|blu[-\s]?ray|vhs|record|vinyl|book|game|video game)\b/i,
    /\b["\u201c]([^"\u201d]{2,80})["\u201d]\s+(?:dvd|cd|blu[-\s]?ray|vhs|record|vinyl|book|game|video game)\b/i,
    /\b(?:dvd|cd|blu[-\s]?ray|vhs|record|vinyl|book|game|video game)\s+["\u201c]([^"\u201d]{2,80})["\u201d]/i
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) return displayTitleCase(cleanExtractedMediaTitle(match[1]));
  }
  return "";
}

function cleanExtractedMediaTitle(value) {
  const cleaned = String(value || "")
    .replace(/\b(condition|basis|confidence|category|market|retail|price|value|notes?)\b.*$/i, "")
    .replace(/\b(dvd|cd|blu[-\s]?ray|vhs|record|vinyl|book|game|video game)\b.*$/i, "")
    .replace(/^[:\-\u2013\u2014\s]+|[:\-\u2013\u2014."'\u201c\u201d\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.split(/\s+/).slice(0, 10).join(" ");
}

function displayTitleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (/^[A-Z0-9&'-]{2,}$/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(" ");
}

function isVagueMediaName(name, mediaFormat) {
  const lower = String(name || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  if (!lower) return true;
  if (/^(dvd|dvd disc|disc|cd|cd disc|compact disc|movie|film|blu ray|blu-ray|vhs|vhs tape|record|vinyl|vinyl record|book|media|video game|game|case)$/i.test(lower)) {
    return true;
  }
  const stripped = lower
    .replace(/\b(dvd|cd|compact|disc|movie|film|blu|ray|blu-ray|vhs|tape|record|vinyl|book|media|video|game|case|used|estate|sale|warehouse|item)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length < 3 && nameIncludesMediaFormat(lower, mediaFormat);
}

function nameIncludesMediaFormat(name, mediaFormat) {
  const lower = String(name || "").toLowerCase();
  if (mediaFormat === "Blu-ray") return /\bblu[-\s]?ray\b/.test(lower);
  if (mediaFormat === "DVD") return /\bdvd\b/.test(lower);
  if (mediaFormat === "CD") return /\b(cd|compact disc)\b/.test(lower);
  if (mediaFormat === "VHS") return /\bvhs\b/.test(lower);
  if (mediaFormat === "Vinyl record") return /\b(vinyl|record|lp)\b/.test(lower);
  if (mediaFormat === "Video game") return /\b(xbox|playstation|ps[1-5]?|nintendo|wii|switch|gamecube|video game|game)\b/.test(lower);
  if (mediaFormat === "Book") return /\b(book|novel|hardcover|paperback)\b/.test(lower);
  return false;
}

function normalizePricingCategory(...values) {
  const direct = String(values[0] || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s*&\s*/g, "-")
    .replace(/\s*\/\s*/g, "-")
    .replace(/\s+/g, "-");
  const directAliases = {
    "home-decor": "decor",
    "home-goods": "homegoods",
    "books-media": "books",
    "media": "books",
    "small-appliances": "appliances",
    "small-appliance": "appliances",
    "kids-baby": "kids",
    "baby": "kids",
    "sporting-goods": "sporting",
    "sports": "sporting",
    "medical-mobility": "medical",
    "mobility": "medical",
    "tools-garage": "tools",
    "garage": "tools",
    "clearance": "scratch-dent",
    "scratch-dent": "scratch-dent",
    "scratch/dent": "scratch-dent",
    "as-is": "scratch-dent",
    "outdoor-garden": "outdoor"
  };
  const directCategory = directAliases[direct] || direct;
  if (window.VERNS_PRICE_GUIDE[directCategory]) return directCategory;

  const text = values.filter(Boolean).join(" ").toLowerCase();
  const rules = [
    { category: "electronics", pattern: /\b(electronics?|radio|stereo|receiver|speaker|subwoofer|turntable|television|tv|camera|lens|vcr|dvd|cd player|laptop|tablet|phone|monitor|printer|console|gaming|remote|amp|amplifier)\b/ },
    { category: "tools", pattern: /\b(tool|tools|drill|saw|wrench|socket|clamp|compressor|ladder|garage|hardware|workbench)\b/ },
    { category: "furniture", pattern: /\b(furniture|dresser|chair|table|cabinet|desk|sofa|couch|shelf|shelves|nightstand|bed|crib)\b/ },
    { category: "lamps", pattern: /\b(lamp|lamps|lighting|light fixture|shade|chandelier|sconce)\b/ },
    { category: "glassware", pattern: /\b(glass|glassware|crystal|vase|goblet|decanter|china|pyrex)\b/ },
    { category: "appliances", pattern: /\b(appliance|appliances|refrigerator|fridge|freezer|washer|dryer|microwave|dehumidifier)\b/ },
    { category: "housewares", pattern: /\b(housewares|dish|dishes|cookware|pan|pot|kitchen|utensil|sewing machine)\b/ },
    { category: "homegoods", pattern: /\b(homegoods|home goods|decor|basket|frame|mirror|art|wall hanging|rug|blanket)\b/ },
    { category: "clothing", pattern: /\b(clothing|clothes|shirt|jacket|coat|shoe|shoes|boots|linen|linens|purse|bag)\b/ },
    { category: "books", pattern: /\b(book|books|record|records|vinyl|dvd|cd|media|magazine)\b/ },
    { category: "exercise", pattern: /\b(exercise|fitness|weights|dumbbell|treadmill|workout|elliptical)\b/ },
    { category: "medical", pattern: /\b(medical|walker|cane|wheelchair|mobility|health|shower chair)\b/ },
    { category: "kids", pattern: /\b(kid|kids|baby|toy|toys|child|children|stroller|crib|high chair)\b/ },
    { category: "clocks", pattern: /\b(clock|clocks|watch|timepiece|mantel clock|wall clock)\b/ },
    { category: "jewelry", pattern: /\b(jewelry|jewellery|necklace|bracelet|ring|earrings|watch|accessories)\b/ },
    { category: "sporting", pattern: /\b(sport|sporting|golf|bike|bicycle|fishing|camping|ball|baseball|hockey|tennis)\b/ },
    { category: "seasonal", pattern: /\b(seasonal|holiday|christmas|halloween|easter|patio|summer|winter)\b/ },
    { category: "auto", pattern: /\b(auto|car|truck|automotive|tire|tires|motor oil|floor mats)\b/ },
    { category: "collectibles", pattern: /\b(collectible|collectibles|vintage|antique|figurine|brass|coin|stamp|memorabilia)\b/ },
    { category: "scratch-dent", pattern: /\b(scratch|dent|as-is|repair|parts|project|needs work|broken)\b/ }
  ];
  return rules.find((rule) => rule.pattern.test(text))?.category || "furniture";
}

function localPricingSuggestion({ hint, category, condition }) {
  const normalizedCategory = normalizePricingCategory(category, hint) || "furniture";
  const guide = window.VERNS_PRICE_GUIDE[normalizedCategory] || window.VERNS_PRICE_GUIDE.furniture;
  const multiplier = window.VERNS_CONDITION_MULTIPLIERS[condition] || 1;
  const low = Math.max(1, Math.round(guide.market[0] * multiplier));
  const high = Math.max(low + 1, Math.round(guide.market[1] * multiplier));
  const marketValue = Math.round((low + high) / 2);
  return buildPricingSuggestion({
    itemName: hint || `${guide.label} item`,
    category: normalizedCategory,
    condition,
    marketValue,
    retailValue: Math.round(marketValue * 1.6),
    confidence: "Low",
    priceBasis: "Local category fallback. Use AI or sold comps when possible.",
    notes: "Fallback price only. Verify item identity, condition, and demand."
  });
}

function buildPricingSuggestion(raw) {
  const category = normalizePricingCategory(raw.category, raw.itemName, raw.notes) || "furniture";
  const marketValue = Number(raw.marketValue || raw.likelySellingPrice || raw.estimatedHigh) || 0;
  const retailValue = Number(raw.retailValue || raw.originalRetailValue) || 0;
  const basisValue = state.settings.defaultPricingBasis === "retail" && retailValue > 0 ? retailValue : marketValue;
  const thriftMarkdown = clampPercent(state.settings.thriftMarkdownPercent, 50);
  const marketplacePercent = clampPercent(state.settings.marketplacePercent, 90, 10, 150);
  const clearanceMarkdown = clampPercent(state.settings.clearanceMarkdownPercent, 75);
  return {
    ...raw,
    category,
    marketValue,
    retailValue,
    storePrice: roundPrice(basisValue * (1 - thriftMarkdown / 100)),
    marketplacePrice: roundPrice(marketValue * (marketplacePercent / 100)),
    clearancePrice: roundPrice(basisValue * (1 - clearanceMarkdown / 100))
  };
}

function publishPricedItem(item, destination) {
  if (!destination || destination === "sales-floor") return;
  const image = item.image || "assets/img/placeholder-furniture.svg";
  if (destination === "marketplace") {
    const guide = window.VERNS_PRICE_GUIDE[item.category] || window.VERNS_PRICE_GUIDE.furniture;
    state.marketplace.unshift({
      id: createId("market"),
      itemName: item.name,
      category: item.category,
      price: item.marketPrice || item.storePrice,
      title: marketplaceListingTitle(guide.titlePrefix, item.name),
      description: marketplaceDescriptionForPricedItem(item),
      employee: item.employee,
      status: "pending",
      postedDate: "",
      soldPrice: "",
      closedDate: "",
      photos: item.image ? [item.image] : [],
      createdAt: new Date().toISOString()
    });
    return;
  }

  const photoCategory = destination === "featured" ? "featured" : destination === "special" ? "special" : destination === "clearance" ? "clearance" : "gallery";
  state.photoItems.unshift({
    id: createId("photo"),
    category: photoCategory,
    itemType: item.category,
    title: item.name,
    price: destination === "clearance" ? item.clearancePrice || item.storePrice : item.storePrice,
    tag: destination === "clearance" ? "Last chance" : destination === "featured" ? "Fresh find" : destination === "special" ? "Warehouse special" : "Floor photo",
    note: item.notes || "Fresh from Vern's Estate Sale Warehouse.",
    employee: item.employee,
    image,
    createdAt: new Date().toISOString()
  });
}

function marketplaceDescriptionForPricedItem(item) {
  return [
    `${item.name} available at Vern's Estate Sale Warehouse.`,
    "",
    `Condition: ${conditionLabel(item.condition)}.`,
    item.notes || "See photos and inspect in person before buying.",
    "Pickup: local warehouse pickup. Availability can change quickly."
  ].join("\n");
}

function fillSuggestedPrices(form, overwrite = true) {
  const category = form.category.value;
  const condition = form.condition.value;
  const guide = window.VERNS_PRICE_GUIDE[category];
  if (!guide) return;
  const multiplier = window.VERNS_CONDITION_MULTIPLIERS[condition] || 1;
  const marketMid = ((guide.market[0] + guide.market[1]) / 2) * multiplier;
  const store = moneyValue(roundPrice(marketMid * (1 - clampPercent(state.settings.thriftMarkdownPercent, 50) / 100)));
  const market = moneyValue(roundPrice(marketMid * (clampPercent(state.settings.marketplacePercent, 90, 10, 150) / 100)));
  const clearance = moneyValue(roundPrice(marketMid * (1 - clampPercent(state.settings.clearanceMarkdownPercent, 75) / 100)));
  if (overwrite || !form.marketValue.value) form.marketValue.value = moneyValue(roundPrice(marketMid));
  if (overwrite || !form.storePrice.value) form.storePrice.value = store;
  if (overwrite || !form.marketPrice.value) form.marketPrice.value = market;
  if (overwrite || !form.clearancePrice.value) form.clearancePrice.value = clearance;
  updatePricingOverlayPreview(form);
}

function priceRange(range, multiplier) {
  const low = Math.max(1, Math.round((range[0] * multiplier) / 5) * 5);
  const high = Math.max(low + 5, Math.round((range[1] * multiplier) / 5) * 5);
  return `$${low}-$${high}`;
}

function renderPricingTable() {
  const body = $("[data-pricing-table]");
  if (!body) return;
  const items = itemsVisibleToCurrentEmployee(state.pricedItems);
  body.replaceChildren(
    ...items.slice(0, 20).map((item) => {
      const row = document.createElement("tr");
      row.append(
        cell(`${item.name}\n${categoryLabel(item.category)} / ${conditionLabel(item.condition)}`),
        cell(item.storePrice),
        cell(item.marketPrice),
        cell(item.status)
      );
      return row;
    })
  );
}

function bindMarketplaceTool() {
  const form = $("[data-marketplace-form]");
  if (!form) return;
  const fields = marketplaceFields(form);

  fields.pricedItem.addEventListener("change", () => hydrateMarketplaceFromPricedItem(form));
  fields.photos.addEventListener("change", () => previewMarketplacePhotos(form));
  $("[data-generate-marketplace]")?.addEventListener("click", () => generateMarketplaceCopy(form));
  $("[data-copy-title]")?.addEventListener("click", (event) => copyField(fields.title, event.currentTarget));
  $("[data-copy-description]")?.addEventListener("click", (event) => copyField(fields.description, event.currentTarget));
  $("[data-copy-price]")?.addEventListener("click", (event) => copyField(fields.price, event.currentTarget));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const photos = await filesToDataUrls(fields.photos.files, 4);
    const listing = {
      id: createId("market"),
      itemName: data.itemName.trim(),
      category: data.category,
      price: data.price.trim(),
      title: data.title.trim(),
      description: data.description.trim(),
      employee: employeeNameForSave(data.employee),
      status: data.status,
      postedDate: data.postedDate,
      soldPrice: data.soldPrice.trim(),
      closedDate: data.closedDate,
      photos,
      createdAt: new Date().toISOString()
    };
    state.marketplace.unshift(listing);
    saveState();
    form.reset();
    $("[data-photo-preview]").replaceChildren();
    renderAll();
  });

  $$("[data-status-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      marketplaceFilter = button.dataset.statusFilter;
      $$("[data-status-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderMarketplaceList();
    });
  });
}

function marketplaceFields(form) {
  const field = (name) => form.elements.namedItem(name);
  return {
    pricedItem: field("pricedItem"),
    itemName: field("itemName"),
    category: field("category"),
    price: field("price"),
    title: field("title"),
    description: field("description"),
    photos: field("photos"),
    employee: field("employee")
  };
}

function hydrateMarketplaceFromPricedItem(form) {
  const fields = marketplaceFields(form);
  const item = state.pricedItems.find((entry) => entry.id === fields.pricedItem.value);
  if (!item) return;
  fields.itemName.value = item.name;
  fields.category.value = item.category;
  fields.price.value = midpointPrice(item.marketPrice) || item.marketPrice;
  fields.employee.value = item.employee || "";
  generateMarketplaceCopy(form);
}

function generateMarketplaceCopy(form) {
  const fields = marketplaceFields(form);
  const name = fields.itemName.value.trim();
  const category = fields.category.value;
  const guide = window.VERNS_PRICE_GUIDE[category] || window.VERNS_PRICE_GUIDE.furniture;
  const cleanName = name || "Estate sale item";
  fields.title.value = marketplaceListingTitle(guide.titlePrefix, cleanName);
  fields.description.value = [
    `${cleanName} available at Vern's Estate Sale Warehouse.`,
    "",
    "Condition: see photos and inspect in person before buying.",
    "Pickup: local warehouse pickup. First come, first served unless staff marks it sold.",
    "Notes: message or stop in for current availability."
  ].join("\n");
  if (!fields.price.value) {
    const range = priceRange(guide.market, 1);
    fields.price.value = midpointPrice(range) || range;
  }
}

function marketplaceListingTitle(prefix, itemName) {
  const cleanPrefix = String(prefix || "").trim();
  const cleanName = String(itemName || "Estate sale item").trim();
  const hasPrefix = cleanPrefix && cleanName.toLowerCase().startsWith(`${cleanPrefix.toLowerCase()} `);
  const title = hasPrefix ? cleanName : `${cleanPrefix} ${cleanName}`.trim();
  return `${title} - Vern's Estate Sale Warehouse`;
}

function midpointPrice(value) {
  const matches = String(value).match(/\d+/g);
  if (!matches || !matches.length) return "";
  const nums = matches.map(Number);
  const average = nums.length > 1 ? Math.round((nums[0] + nums[nums.length - 1]) / 2) : nums[0];
  return `$${average}`;
}

function previewMarketplacePhotos(form) {
  const fields = marketplaceFields(form);
  const wrap = $("[data-photo-preview]");
  wrap.replaceChildren();
  Array.from(fields.photos.files || [])
    .slice(0, 4)
    .forEach((file) => {
      const img = document.createElement("img");
      img.alt = file.name;
      img.src = URL.createObjectURL(file);
      wrap.append(img);
    });
}

function renderPricedItemSelect() {
  const select = $("[data-priced-item-select]");
  if (!select) return;
  select.replaceChildren(optionEl("", "Choose saved item or type below"));
  itemsVisibleToCurrentEmployee(state.pricedItems).slice(0, 80).forEach((item) => {
    select.append(optionEl(item.id, `${item.name} - ${item.marketPrice}`));
  });
}

function renderMarketplaceList() {
  const list = $("[data-marketplace-list]");
  if (!list) return;
  const scopedItems = itemsVisibleToCurrentEmployee(state.marketplace);
  const items = marketplaceFilter === "all" ? scopedItems : scopedItems.filter((item) => item.status === marketplaceFilter);
  if (!items.length) {
    list.replaceChildren(pEl("", "No Marketplace items in this view yet."));
    return;
  }
  list.replaceChildren(
    ...items.map((item) => {
      const activity = activityItem(item.title, [
        `${item.price} · ${statusLabel(item.status)}`,
        `Employee: ${item.employee || "Not set"}`,
        `Posted: ${item.postedDate || "Not posted"} · Closed: ${item.closedDate || "Open"}`
      ]);
      if (item.photos?.[0]) {
        activity.prepend(imageEl(item.photos[0], item.title, "activity-thumb"));
      }
      activity.append(miniActions(item.id, "marketplace"));
      return activity;
    })
  );
}

function bindDashboardTool() {
  const form = $("[data-timeoff-form]");
  const staffNameInput = $("[data-staff-name]");

  if (staffNameInput) {
    const savedName = currentEmployeeName() || localStorage.getItem(STAFF_NAME_KEY) || "";
    staffNameInput.value = savedName;
    staffNameInput.dataset.previousName = savedName;
    syncTimeoffEmployeeFromStaffName(form, savedName);
    staffNameInput.addEventListener("input", () => {
      const previousName = staffNameInput.dataset.previousName || "";
      const name = staffNameInput.value.trim();
      localStorage.setItem(STAFF_NAME_KEY, name);
      syncTimeoffEmployeeFromStaffName(form, name, previousName);
      staffNameInput.dataset.previousName = name;
      renderDashboard();
    });
  }

  $$("[data-staff-view]").forEach((button) => {
    button.addEventListener("click", () => setStaffDashboardView(button.dataset.staffView));
  });

  $("[data-manager-unlock]")?.addEventListener("click", () => {
    const code = $("[data-manager-code]")?.value || "";
    if (code === MANAGER_PASSCODE && isManagerSignedIn()) {
      sessionStorage.setItem(MANAGER_SESSION_KEY, "yes");
      unlockManagerDashboard();
      renderDashboard();
    } else {
      const message = $("[data-manager-message]");
      if (message) message.textContent = "Manager view is for Mike or Vern logins.";
    }
  });

  if (isManagerSignedIn()) unlockManagerDashboard();

  if (!form) {
    renderDashboard();
    return;
  }

  updateTimeoffSendLinks(form);
  ["input", "change"].forEach((eventName) => {
    form.addEventListener(eventName, () => updateTimeoffSendLinks(form));
  });

  $("[data-timeoff-email]")?.addEventListener("click", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) {
      return;
    }
    const href = timeoffEmailHref(form);
    if (!href) {
      setTimeoffSendStatus("Add Vern's email in Settings first.");
      updateTimeoffSendLinks(form);
      return;
    }
    setTimeoffSendStatus("Opening email...");
    window.location.href = href;
  });

  $("[data-timeoff-sms]")?.addEventListener("click", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) {
      return;
    }
    const href = timeoffSmsHref(form);
    if (!href) {
      setTimeoffSendStatus("Add Vern's phone in Settings first.");
      updateTimeoffSendLinks(form);
      return;
    }
    setTimeoffSendStatus("Opening text message...");
    window.location.href = href;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTimeoffRequest(form);
  });
}

function syncTimeoffEmployeeFromStaffName(form, name, previousName = "") {
  const employee = form?.elements?.namedItem("employee");
  if (!employee) return;
  if (!employee.value || employee.value.trim() === previousName) employee.value = name;
}

function setStaffDashboardView(view) {
  if (view === "manager" && !isManagerSignedIn()) view = "mine";
  $$("[data-staff-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.staffView === view);
  });
  $$("[data-staff-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.staffPanel === view);
  });
  if (view === "manager" && isManagerSignedIn()) unlockManagerDashboard();
  renderDashboard();
}

function unlockManagerDashboard() {
  const gate = $("[data-manager-gate]");
  const dashboard = $("[data-manager-dashboard]");
  const message = $("[data-manager-message]");
  if (gate) gate.hidden = true;
  if (dashboard) dashboard.hidden = false;
  if (message) message.textContent = "";
}

function saveTimeoffRequest(form) {
  const data = Object.fromEntries(new FormData(form));
  state.timeoff.unshift({
    id: createId("time"),
    employee: employeeNameForSave(data.employee),
    start: data.start,
    end: data.end,
    notes: data.notes.trim(),
    status: "requested",
    createdAt: new Date().toISOString()
  });
  saveState();
  form.reset();
  syncTimeoffEmployeeFromStaffName(form, dashboardStaffName());
  updateTimeoffSendLinks(form);
  setTimeoffSendStatus("Saved locally. Use Email or Text to send it to Vern.");
  renderDashboard();
}

function dashboardStaffName() {
  return (currentEmployeeName() || $("[data-staff-name]")?.value || localStorage.getItem(STAFF_NAME_KEY) || "").trim();
}

function updateTimeoffSendLinks(form) {
  if (!form) return;
  const email = managerEmailAddress();
  const phone = managerPhoneDigits();
  const emailButton = $("[data-timeoff-email]");
  const smsButton = $("[data-timeoff-sms]");
  if (emailButton) {
    emailButton.dataset.sendHref = timeoffEmailHref(form);
    emailButton.classList.toggle("is-disabled", !email);
    emailButton.setAttribute("aria-disabled", email ? "false" : "true");
  }
  if (smsButton) {
    smsButton.dataset.sendHref = timeoffSmsHref(form);
    smsButton.classList.toggle("is-disabled", !phone);
    smsButton.setAttribute("aria-disabled", phone ? "false" : "true");
  }
}

function timeoffEmailHref(form) {
  const email = managerEmailAddress();
  if (!email || !form) return "";
  const data = Object.fromEntries(new FormData(form));
  const subject = encodeURIComponent(`Time off request - ${data.employee || "Employee"}`);
  const body = encodeURIComponent(timeoffRequestMessage(data));
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

function timeoffSmsHref(form) {
  const phone = managerPhoneDigits();
  if (!phone || !form) return "";
  const data = Object.fromEntries(new FormData(form));
  const body = encodeURIComponent(timeoffRequestMessage(data));
  return `sms:${phone}?&body=${body}`;
}

function timeoffRequestMessage(data) {
  return [
    "Time off request",
    `Employee: ${data.employee || ""}`,
    `Dates: ${data.start || ""} to ${data.end || ""}`,
    `Notes: ${data.notes || ""}`,
    "",
    "Sent from Vern's staff tools."
  ].join("\n");
}

function managerPhoneDigits() {
  return String(state.settings.phone || "").replace(/\D/g, "");
}

function managerEmailAddress() {
  return String(state.settings.email || "").trim();
}

function setTimeoffSendStatus(message) {
  const status = $("[data-timeoff-send-status]");
  if (status) status.textContent = message;
}

function bindCalendarTool() {
  const form = $("[data-calendar-form]");
  if (!form) return;
  form.date.value = form.date.value || todayIsoDate();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    state.calendarEvents.unshift({
      id: createId("calendar"),
      title: data.title.trim(),
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      type: data.type,
      status: data.status,
      location: data.location.trim(),
      employee: employeeNameForSave(data.employee),
      notes: data.notes.trim(),
      createdAt: new Date().toISOString()
    });
    saveState();
    form.reset();
    form.date.value = todayIsoDate();
    renderAll();
  });
}

function renderCalendarEvents() {
  const list = $("[data-calendar-list]");
  if (!list) return;
  const events = [...(state.calendarEvents || [])].sort((a, b) => calendarSortValue(a) - calendarSortValue(b));
  if (!events.length) {
    list.replaceChildren(pEl("", "No calendar items yet."));
    return;
  }
  list.replaceChildren(
    ...events.map((item) => {
      const activity = activityItem(item.title || "Calendar item", [
        `${formatCalendarDate(item.date)} · ${formatTimeRange(item)}`,
        `${calendarTypeLabel(item.type)} · ${calendarStatusLabel(item.status)} · ${item.location || "Location not set"}`,
        [item.notes, item.employee ? `Added by ${item.employee}` : ""].filter(Boolean).join(" · ") || "No notes"
      ]);
      activity.classList.add("calendar-event");
      activity.dataset.calendarStatus = item.status || "upcoming";
      activity.append(miniActions(item.id, "calendarEvents"));
      return activity;
    })
  );
}

function calendarSortValue(item) {
  return Date.parse(`${item.date || "9999-12-31"}T${item.startTime || "23:59"}`) || Number.MAX_SAFE_INTEGER;
}

function formatCalendarDate(value) {
  const parsed = Date.parse(`${value}T00:00:00`);
  if (Number.isNaN(parsed)) return value || "Date not set";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date(parsed));
}

function formatTimeRange(item) {
  const start = formatTimeValue(item.startTime);
  const end = formatTimeValue(item.endTime);
  if (start && end) return `${start}-${end}`;
  return start || end || "Time not set";
}

function formatTimeValue(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function calendarTypeLabel(type) {
  return {
    sale: "Sale day",
    setup: "Setup / staging",
    pickup: "Pickup window",
    staff: "Staff note",
    closed: "Closed date"
  }[type] || "Calendar";
}

function calendarStatusLabel(status) {
  return {
    upcoming: "Upcoming",
    confirmed: "Confirmed",
    completed: "Completed",
    canceled: "Canceled"
  }[status] || "Upcoming";
}

function renderDashboard() {
  renderStaffOwnDashboard();
  renderManagerDashboard();
  renderTimeoffList();
  updateTimeoffSendLinks($("[data-timeoff-form]"));
}

function renderStaffOwnDashboard() {
  const summary = $("[data-staff-my-summary]");
  const activity = $("[data-staff-my-activity]");
  if (!summary || !activity) return;

  const employee = dashboardStaffName();
  if (!employee) {
    summary.replaceChildren(staffEmptyNote("Enter your name above to see your own work."));
    activity.replaceChildren();
    return;
  }

  const rows = employeeProductionRows(employee);
  const counts = employeeProductionCounts(employee);
  summary.replaceChildren(
    miniStat("Priced", counts.priced),
    miniStat("Marketplace", counts.marketplace),
    miniStat("Photos", counts.photos),
    miniStat("Time off", counts.timeoff),
    miniStat("Calendar", counts.calendar)
  );
  activity.replaceChildren(
    ...(rows.length
      ? rows.slice(0, 8).map(staffActivityRow)
      : [staffEmptyNote("No saved work for this name yet.")])
  );
}

function renderManagerDashboard() {
  const stats = $("[data-dashboard-stats]");
  const roster = $("[data-employee-activity]");
  const detail = $("[data-manager-employee-detail]");
  if (!stats || !roster || !detail) return;
  if (!isManagerSignedIn()) {
    stats.replaceChildren();
    roster.replaceChildren(staffEmptyNote("Manager view is available to Mike or Vern logins."));
    detail.replaceChildren(headingEl("h3", "Manager only"), pEl("", "Log in as Mike or Vern to see employee production."));
    return;
  }

  const names = employeeNames();
  const counts = {
    Staff: names.length,
    Priced: state.pricedItems.length,
    Marketplace: state.marketplace.length,
    Photos: state.photoItems.filter((item) => item.employee).length,
    "Time off": state.timeoff.length,
    Calendar: state.calendarEvents.length
  };
  stats.replaceChildren(...Object.entries(counts).map(([label, count]) => miniStat(label, count)));

  if (!selectedManagerEmployee && names.length) selectedManagerEmployee = names[0];
  roster.replaceChildren(
    ...(names.length
      ? names.map((name) => employeeRosterButton(name))
      : [staffEmptyNote("No employee activity yet.")])
  );
  renderManagerEmployeeDetail(detail, selectedManagerEmployee);
}

function renderTimeoffList() {
  const timeoff = $("[data-timeoff-list]");
  if (!timeoff) return;
  const employee = dashboardStaffName();
  const visibleItems = employee
    ? state.timeoff.filter((item) => employeeMatches(item.employee, employee))
    : state.timeoff;
  timeoff.replaceChildren(
    ...(visibleItems.length
      ? visibleItems.slice(0, 10).map((item) => staffActivityRow({
          kind: "Time off",
          title: item.employee || "Employee",
          meta: `${item.start} to ${item.end}`,
          note: item.notes || "No notes",
          date: item.createdAt
        }))
      : [staffEmptyNote(employee ? "No time off requests for this name yet." : "No time off requests yet.")])
  );
}

function employeeNames() {
  const names = new Set();
  [...state.pricedItems, ...state.marketplace, ...state.photoItems, ...state.calendarEvents, ...state.timeoff].forEach((item) => {
    const name = String(item.employee || "").trim();
    if (name) names.add(name);
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

function employeeRosterButton(name) {
  const counts = employeeProductionCounts(name);
  const button = document.createElement("button");
  button.className = `employee-roster-button${employeeMatches(name, selectedManagerEmployee) ? " is-active" : ""}`;
  button.type = "button";
  button.append(strongEl(name), spanEl("", `${counts.total} saved action${counts.total === 1 ? "" : "s"}`));
  button.addEventListener("click", () => {
    selectedManagerEmployee = name;
    renderDashboard();
  });
  return button;
}

function renderManagerEmployeeDetail(detail, employee) {
  if (!employee) {
    detail.replaceChildren(headingEl("h3", "Pick an employee"), pEl("", "Click a name to see pricing, Marketplace, and calendar activity."));
    return;
  }
  const rows = employeeProductionRows(employee);
  const counts = employeeProductionCounts(employee);
  const header = divEl("manager-detail-head", [
    headingEl("h3", employee),
    pEl("", `${counts.priced} priced · ${counts.marketplace} Marketplace · ${counts.photos} photos · ${counts.timeoff} time off · ${counts.calendar} calendar`)
  ]);
  detail.replaceChildren(
    header,
    ...(rows.length ? rows.slice(0, 14).map(staffActivityRow) : [staffEmptyNote("No saved activity for this employee yet.")])
  );
}

function employeeProductionRows(employee) {
  const rows = [];
  state.pricedItems.forEach((item) => {
    if (!employeeMatches(item.employee, employee)) return;
    rows.push({
      kind: "Priced",
      title: item.name || "Priced item",
      meta: `${item.storePrice || "No shelf price"} shelf · ${item.marketPrice || "No Marketplace price"}`,
      note: item.status || categoryLabel(item.category),
      date: item.createdAt
    });
  });
  state.marketplace.forEach((item) => {
    if (!employeeMatches(item.employee, employee)) return;
    rows.push({
      kind: "Marketplace",
      title: item.title || item.itemName || "Marketplace listing",
      meta: `${item.price || "No price"} · ${statusLabel(item.status)}`,
      note: item.postedDate ? `Posted ${item.postedDate}` : "Not posted",
      date: item.createdAt
    });
  });
  state.photoItems.forEach((item) => {
    if (!employeeMatches(item.employee, employee)) return;
    rows.push({
      kind: "Photo",
      title: item.title || "Published photo",
      meta: `${labelForPhotoCategory(item.category)} · ${photoItemTypeLabel(item)}`,
      note: item.price || item.tag || item.note || "Public site photo",
      date: item.createdAt
    });
  });
  state.calendarEvents.forEach((item) => {
    if (!employeeMatches(item.employee, employee)) return;
    rows.push({
      kind: "Calendar",
      title: item.title || "Calendar item",
      meta: `${formatCalendarDate(item.date)} · ${formatTimeRange(item)}`,
      note: calendarStatusLabel(item.status),
      date: item.date
    });
  });
  state.timeoff.forEach((item) => {
    if (!employeeMatches(item.employee, employee)) return;
    rows.push({
      kind: "Time off",
      title: `${item.start} to ${item.end}`,
      meta: item.status || "Requested",
      note: item.notes || "No notes",
      date: item.createdAt
    });
  });
  return rows.sort((a, b) => Date.parse(b.date || 0) - Date.parse(a.date || 0));
}

function employeeProductionCounts(employee) {
  const priced = state.pricedItems.filter((item) => employeeMatches(item.employee, employee)).length;
  const marketplace = state.marketplace.filter((item) => employeeMatches(item.employee, employee)).length;
  const photos = state.photoItems.filter((item) => employeeMatches(item.employee, employee)).length;
  const timeoff = state.timeoff.filter((item) => employeeMatches(item.employee, employee)).length;
  const calendar = state.calendarEvents.filter((item) => employeeMatches(item.employee, employee)).length;
  return { priced, marketplace, photos, timeoff, calendar, total: priced + marketplace + photos + timeoff + calendar };
}

function employeeNameForSave(value) {
  return (String(value || "").trim() || currentEmployeeName() || dashboardStaffName() || "Employee").trim();
}

function itemsVisibleToCurrentEmployee(items) {
  if (isManagerSignedIn()) return items;
  const employee = currentEmployeeName();
  return employee ? items.filter((item) => employeeMatches(item.employee, employee)) : items;
}

function employeeMatches(value, employee) {
  return normalizeEmployeeName(value) === normalizeEmployeeName(employee);
}

function normalizeEmployeeName(value) {
  return String(value || "").trim().toLowerCase();
}

function miniStat(label, value) {
  const card = articleEl("stat-card mini-stat-card");
  card.append(strongEl(String(value)), pEl("", label));
  return card;
}

function staffActivityRow(item) {
  const row = divEl("staff-activity-row");
  row.append(
    spanEl("staff-activity-kind", item.kind),
    divEl("staff-activity-copy", [
      headingEl("h4", item.title || "Staff activity"),
      pEl("", item.meta || ""),
      item.note ? pEl("", item.note) : ""
    ].filter(Boolean))
  );
  return row;
}

function staffEmptyNote(message) {
  const note = pEl("staff-empty-note", message);
  return note;
}

function bindContentTool() {
  $("[data-settings-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.settings = {
      ...state.settings,
      companyUrl: data.companyUrl.trim(),
      saleUrl: data.saleUrl.trim(),
      embedUrl: data.embedUrl.trim(),
      address: data.address.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      facebookUrl: data.facebookUrl.trim(),
      hours: data.hours.trim(),
      shortHours: data.hours.trim(),
      contactInfoVersion: CONTACT_INFO_VERSION,
      aiEndpoint: data.aiEndpoint.trim(),
      salesSyncUrl: data.salesSyncUrl.trim(),
      salesAutoSync: data.salesAutoSync === "on"
    };
    saveState();
    renderAll();
    maybeRefreshAuthorizedSales(true);
  });

  $("[data-pricing-settings-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.settings = {
      ...state.settings,
      thriftMarkdownPercent: clampPercent(data.thriftMarkdownPercent, 50),
      marketplacePercent: clampPercent(data.marketplacePercent, 90, 10, 150),
      clearanceMarkdownPercent: clampPercent(data.clearanceMarkdownPercent, 75),
      defaultPricingBasis: data.defaultPricingBasis === "retail" ? "retail" : "market"
    };
    saveState();
    renderAll();
  });

  $("[data-sync-sales-now]")?.addEventListener("click", () => {
    maybeRefreshAuthorizedSales(true);
  });

  $("[data-estate-sale-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (!isEstateSalesUrl(data.url)) {
      alert("Use a valid https://www.estatesales.net sale URL.");
      return;
    }
    const id = estateSaleIdFromUrl(data.url) || createId("estate-sale");
    const previous = state.estateSales.find((item) => item.id === id);
    const uploadedImage = await firstFileToDataUrl(form.mainImage?.files || []);
    const sale = {
      id,
      title: data.title.trim(),
      url: data.url.trim(),
      city: data.city.trim(),
      address: data.address?.trim() || "",
      dateSummary: data.dateSummary.trim(),
      hours: data.hours.trim(),
      status: data.status,
      note: data.note.trim(),
      image: uploadedImage || data.imageUrl.trim() || previous?.image || "",
      lastReviewed: todayIsoDate(),
      createdAt: new Date().toISOString()
    };
    const existing = state.estateSales.findIndex((item) => item.id === sale.id);
    if (existing >= 0) {
      state.estateSales[existing] = { ...state.estateSales[existing], ...sale };
    } else {
      state.estateSales.unshift(sale);
    }
    if (["upcoming", "live"].includes(sale.status)) state.settings.saleUrl = sale.url;
    saveState();
    form.reset();
    renderAll();
  });

  const photoForm = $("[data-photo-item-form]");
  photoForm?.photo.addEventListener("change", () => updateAiPhotoPreview(photoForm));
  photoForm?.category.addEventListener("change", () => updateAiOverlayPreview(photoForm));
  photoForm?.price.addEventListener("input", () => updateAiOverlayPreview(photoForm));
  photoForm?.tag.addEventListener("input", () => updateAiOverlayPreview(photoForm));
  $("[data-ai-suggest-photo]")?.addEventListener("click", () => suggestPhotoItem(photoForm));

  photoForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const uploaded = await firstFileToDataUrl(form.photo.files);
    const image = uploaded || data.imageUrl.trim() || placeholderForPhotoCategory(data.category);
    state.photoItems.unshift({
      id: createId("photo"),
      category: data.category,
      itemType: data.itemType,
      title: data.title.trim(),
      price: data.price.trim(),
      tag: data.tag.trim(),
      note: data.note.trim(),
      employee: employeeNameForSave(data.employee),
      image,
      createdAt: new Date().toISOString()
    });
    saveState();
    form.reset();
    resetAiPhotoPreview();
    renderAll();
  });

  $("[data-special-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    state.specials.unshift({
      id: createId("special"),
      title: data.title.trim(),
      detail: data.detail.trim(),
      tag: data.tag.trim() || "Special"
    });
    saveState();
    form.reset();
    renderAll();
  });

  $("[data-reset-defaults]")?.addEventListener("click", () => {
    if (!confirm("Reset public content and employee data to starter content on this device?")) return;
    state = clone(window.VERNS_STARTER_DATA);
    saveState();
    renderAll();
  });
}

function renderContentLists() {
  renderEstateSaleAdmin();

  const photoList = $("[data-photo-item-list]");
  if (photoList) {
    photoList.replaceChildren(
      ...(state.photoItems.length
        ? state.photoItems.map((item) => {
            const activity = activityItem(item.title, [labelForPhotoCategory(item.category), item.price || "No price", item.note || ""]);
            if (item.image) activity.prepend(imageEl(item.image, item.title, "activity-thumb"));
            activity.append(miniActions(item.id, "photoItems"));
            return activity;
          })
        : [pEl("", "No website photos yet.")])
    );
  }

  const specialList = $("[data-special-list]");
  if (specialList) {
    specialList.replaceChildren(
      ...(state.specials.length
        ? state.specials.map((special) => {
            const activity = activityItem(special.title, [special.tag || "Special", special.detail]);
            activity.append(miniActions(special.id, "specials"));
            return activity;
          })
        : [pEl("", "No specials yet.")])
    );
  }
}

function renderPricingSettings() {
  const form = $("[data-pricing-settings-form]");
  if (!form) return;
  form.thriftMarkdownPercent.value = state.settings.thriftMarkdownPercent ?? 50;
  form.marketplacePercent.value = state.settings.marketplacePercent ?? 90;
  form.clearanceMarkdownPercent.value = state.settings.clearanceMarkdownPercent ?? 75;
  form.defaultPricingBasis.value = state.settings.defaultPricingBasis || "market";
}

function renderEstateSaleAdmin() {
  const reviewBox = $("[data-sale-review-box]");
  const list = $("[data-estate-sale-list]");
  if (!reviewBox || !list) return;

  const due = (state.estateSales || []).filter((sale) => isSaleReviewDue(sale) && sale.status !== "past");
  reviewBox.replaceChildren(
    spanEl("tag", due.length ? `${due.length} to review` : "Checked"),
    pEl("", due.length
      ? "Open each official sale page today, confirm dates/times/status, then tap Reviewed today."
      : "No sale cards need daily review right now.")
  );

  if (!state.estateSales?.length) {
    list.replaceChildren(pEl("", "No EstateSales.NET sale links saved yet."));
    return;
  }

  list.replaceChildren(
    ...state.estateSales.map((sale) => {
      const activity = activityItem(sale.title, [
        `${saleStatusLabel(sale.status)} · ${sale.city || "City not set"} · ${sale.dateSummary || "Dates not set"}`,
        sale.hours || "Hours not set",
        `${reviewStamp(sale.lastReviewed)} · ${sale.image ? "Photo attached" : "No main photo"} · ${displayUrl(sale.url)}`
      ]);
      if (sale.image) activity.prepend(imageEl(sale.image, sale.title, "activity-thumb"));
      activity.append(saleActions(sale.id, sale.url));
      return activity;
    })
  );
}

function saleActions(id, url) {
  const wrap = divEl("mini-actions");
  const open = linkEl("tiny-btn", url, "Open official page");
  const reviewed = document.createElement("button");
  reviewed.className = "tiny-btn";
  reviewed.type = "button";
  reviewed.textContent = "Reviewed today";
  reviewed.addEventListener("click", () => {
    const sale = state.estateSales.find((item) => item.id === id);
    if (!sale) return;
    sale.lastReviewed = todayIsoDate();
    saveState();
    renderAll();
  });
  const remove = document.createElement("button");
  remove.className = "tiny-btn";
  remove.type = "button";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => {
    if (!confirm("Remove this sale link from this device?")) return;
    state.estateSales = state.estateSales.filter((item) => item.id !== id);
    saveState();
    renderAll();
  });
  wrap.append(open, reviewed, remove);
  return wrap;
}

async function updateAiPhotoPreview(form) {
  const [file] = Array.from(form.photo.files || []);
  if (!file) {
    resetAiPhotoPreview();
    return;
  }
  const image = await fileToDataUrl(file);
  const preview = $("[data-ai-preview-image]");
  const wrap = preview?.closest("[data-ai-photo-preview]");
  if (wrap) wrap.classList.remove("is-empty");
  preview.hidden = false;
  preview.src = image;
  preview.alt = file.name || "Selected item preview";
  updateAiOverlayPreview(form);
}

function resetAiPhotoPreview() {
  const preview = $("[data-ai-preview-image]");
  const overlay = $("[data-ai-preview-overlay]");
  const status = $("[data-ai-status]");
  if (preview) {
    preview.removeAttribute("src");
    preview.alt = "Selected item preview";
    preview.hidden = true;
    const wrap = preview.closest("[data-ai-photo-preview]");
    if (wrap) wrap.classList.add("is-empty");
  }
  if (overlay) overlay.hidden = true;
  if (status) status.textContent = "Upload a photo, then ask for a quick suggestion.";
}

function updateAiOverlayPreview(form) {
  const overlay = $("[data-ai-preview-overlay]");
  if (!overlay || !form) return;
  const category = form.category.value;
  const price = form.price.value.trim();
  const tag = form.tag.value.trim();
  const shouldShow = category === "clearance" && Boolean(price || tag);
  overlay.hidden = !shouldShow;
  $("[data-ai-preview-price]").textContent = price || "Sale";
  $("[data-ai-preview-label]").textContent = tag || "Last Chance";
}

async function suggestPhotoItem(form) {
  if (!form) return;
  const status = $("[data-ai-status]");
  status.textContent = "Thinking through category, name, and price...";

  const [file] = Array.from(form.photo.files || []);
  const image = file ? await firstFileToDataUrl([file]) : "";
  const hint = form.aiHint.value.trim();
  const suggestion = await requestPhotoSuggestion({
    image,
    hint,
    filename: file?.name || "",
    currentCategory: form.category.value
  });

  form.category.value = suggestion.category;
  if (form.itemType) form.itemType.value = suggestion.itemType;
  form.title.value = suggestion.title;
  form.price.value = suggestion.price;
  form.tag.value = suggestion.tag;
  form.note.value = suggestion.note;
  updateAiOverlayPreview(form);
  status.textContent = suggestion.source === "endpoint"
    ? "AI suggestion added. Staff should still verify condition and price."
    : "Smart local suggestion added. Add a short hint for better results.";
}

async function requestPhotoSuggestion(payload) {
  const endpoint = state.settings.aiEndpoint;
  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        return normalizeSuggestion(data, "endpoint");
      }
    } catch {
      // Fall through to the local helper if the endpoint is not reachable.
    }
  }
  return localPhotoSuggestion(payload);
}

async function maybeRefreshAuthorizedSales(force = false) {
  const endpoint = String(state.settings.salesSyncUrl || "").trim();
  if (!endpoint || !isAllowedSalesSyncUrl(endpoint)) return;
  if (!force && state.settings.salesAutoSync === false) return;
  if (!force && isMissingStaticSalesSyncEndpoint(endpoint)) return;

  const lastSync = Date.parse(state.settings.lastSalesSyncAt || "");
  const recentlySynced = !Number.isNaN(lastSync) && Date.now() - lastSync < 24 * 60 * 60 * 1000;
  if (!force && recentlySynced) return;

  lastSalesSyncStatus = "Checking EstateSales.NET sale links...";
  renderSettings();

  try {
    const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      lastSalesSyncStatus = "Sale sync did not complete. Keeping the last saved sale board.";
      renderSettings();
      return;
    }
    const payload = await response.json();
    const sales = normalizeSaleFeed(payload);
    if (!sales.length) {
      lastSalesSyncStatus = payload?.message || "No active sales came back from the sync endpoint.";
      renderSettings();
      return;
    }

    const existingImages = new Map((state.estateSales || []).map((sale) => [sale.id, sale.image || ""]));
    state.estateSales = sales.map((sale) => ({
      ...sale,
      image: sale.image || existingImages.get(sale.id) || ""
    }));
    state.settings.lastSalesSyncAt = new Date().toISOString();
    if (!getLiveEstateSaleUrl(state.settings.saleUrl)) {
      state.settings.saleUrl = getPrimaryEstateSaleUrl() || state.settings.saleUrl;
    }
    lastSalesSyncStatus = payload?.message || `Updated ${sales.length} sale link${sales.length === 1 ? "" : "s"} from the sync endpoint.`;
    saveState();
    renderAll();
    settleHashScroll();
  } catch {
    lastSalesSyncStatus = "Sale sync could not reach the backend. Keeping the last saved sale board.";
    renderSettings();
    // Keep the last good employee-managed sale board if the authorized feed is down.
  }
}

function isMissingStaticSalesSyncEndpoint(endpoint) {
  const host = window.location.hostname.toLowerCase();
  const staticHost = host === "estatesbyvern.com" || host === "www.estatesbyvern.com" || host.endsWith(".github.io");
  return staticHost && String(endpoint).startsWith("/api/");
}

function isAllowedSalesSyncUrl(value) {
  if (String(value).startsWith("/api/")) return true;
  try {
    const url = new URL(value);
    const localHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    return url.protocol === "https:" || (url.protocol === "http:" && localHost);
  } catch {
    return false;
  }
}

function normalizeSaleFeed(payload) {
  const rawSales = Array.isArray(payload) ? payload : payload?.sales;
  if (!Array.isArray(rawSales)) return [];
  return rawSales
    .map((sale) => ({
      id: String(sale.id || estateSaleIdFromUrl(sale.url) || createId("estate-sale")),
      title: String(sale.title || "Estate sale").slice(0, 90),
      url: String(sale.url || ""),
      city: String(sale.city || sale.location || "").slice(0, 80),
      address: String(sale.address || "").slice(0, 120),
      dateSummary: String(sale.dateSummary || sale.dates || "").slice(0, 80),
      hours: String(sale.hours || "").slice(0, 100),
      status: ["upcoming", "live", "ended", "past", "canceled"].includes(sale.status) ? sale.status : "upcoming",
      note: String(sale.note || sale.description || "Full details and photos open on EstateSales.NET.").slice(0, 180),
      image: String(sale.image || sale.mainImage || "").slice(0, 400000),
      lastReviewed: String(sale.lastReviewed || todayIsoDate()).slice(0, 10),
      createdAt: String(sale.createdAt || new Date().toISOString())
    }))
    .filter((sale) => isEstateSalesUrl(sale.url));
}

function localPhotoSuggestion({ hint, filename, currentCategory }) {
  const text = `${hint} ${filename}`.toLowerCase();
  const rules = [
    { match: ["clearance", "yellow", "last", "markdown"], category: "clearance", itemType: "scratch-dent", title: "Last chance warehouse item", price: "$10", tag: "Last chance", note: "Final markdown. Verify item is still on the clearance row." },
    { match: ["dresser", "table", "chair", "cabinet", "desk", "sofa", "couch"], category: "featured", itemType: "furniture", title: "Vintage furniture piece", price: "$45-$125", tag: "Fresh find", note: "Check wood, drawers, legs, and measurements before posting." },
    { match: ["lamp", "light", "brass"], category: "featured", itemType: "lamps", title: "Vintage lamp", price: "$18-$45", tag: "Fresh find", note: "Confirm it powers on and note shade condition." },
    { match: ["tool", "drill", "saw", "wrench", "garage"], category: "special", itemType: "tools", title: "Garage tool find", price: "$8-$35", tag: "Warehouse special", note: "Group small tools when it makes the price clearer." },
    { match: ["dish", "glass", "china", "bowl", "kitchen"], category: "gallery", itemType: "housewares", title: "Kitchen and housewares lot", price: "$5-$25", tag: "Floor photo", note: "Mention set count, chips, and any maker marks." }
  ];
  const found = rules.find((rule) => rule.match.some((word) => text.includes(word)));
  if (found) return normalizeSuggestion(found, "local");

  return normalizeSuggestion({
    category: currentCategory || "featured",
    itemType: "homegoods",
    title: "Estate sale warehouse find",
    price: currentCategory === "clearance" ? "$10-$25" : "$15-$45",
    tag: currentCategory === "clearance" ? "Last chance" : "Fresh find",
    note: "Staff should confirm item name, condition, measurements, and price."
  }, "local");
}

function normalizeSuggestion(data, source) {
  const category = ["featured", "clearance", "special", "gallery"].includes(data.category) ? data.category : "featured";
  const itemType = isPhotoItemType(data.itemType) ? data.itemType : photoItemType(data);
  return {
    source,
    category,
    itemType: itemType === "all" ? "homegoods" : itemType,
    title: String(data.title || data.name || "Estate sale warehouse find").slice(0, 80),
    price: String(data.price || data.suggestedPrice || "$15-$45").slice(0, 30),
    tag: String(data.tag || (category === "clearance" ? "Last chance" : "Fresh find")).slice(0, 30),
    note: String(data.note || data.description || "Staff should verify condition and price before publishing.").slice(0, 180)
  };
}

function bindImportExport() {
  $("[data-export-data]")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `verns-website-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  $("[data-import-data]")?.addEventListener("change", async (event) => {
    const [file] = event.currentTarget.files || [];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      state = normalizeState({ ...window.VERNS_STARTER_DATA, ...imported });
      saveState();
      renderAll();
      event.currentTarget.value = "";
    } catch {
      alert("That file could not be imported. Use a JSON export from this site.");
    }
  });
}

function miniActions(id, collection) {
  const wrap = divEl("mini-actions");
  const remove = document.createElement("button");
  remove.className = "tiny-btn";
  remove.type = "button";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => {
    if (!confirm("Remove this saved item from this device?")) return;
    state[collection] = state[collection].filter((item) => item.id !== id);
    saveState();
    renderAll();
  });
  wrap.append(remove);
  return wrap;
}

function filesToDataUrls(files, limit = 1) {
  return Promise.all(Array.from(files || []).slice(0, limit).map((file) => fileToDataUrl(file)));
}

function firstFileToDataUrl(files) {
  const [file] = Array.from(files || []);
  return file ? fileToDataUrl(file) : Promise.resolve("");
}

async function fileToUploadImage(file) {
  try {
    const dataUrl = await fileToDataUrl(file);
    const blob = dataUrlToBlob(dataUrl);
    if (blob?.size) return { blob, filename: "pricing-photo.jpg" };
  } catch {
    // Keep the original file as a last resort if the browser cannot render it.
  }
  return { blob: file, filename: file.name || "pricing-photo.jpg" };
}

function dataUrlToBlob(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+)(?:;[^,]*)?;base64,(.+)$/);
  if (!match) return null;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: match[1] || "image/jpeg" });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => {
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function copyField(field, button) {
  const value = field?.value || field?.textContent || "";
  if (!value) {
    flashCopyButton(button, "Nothing to copy");
    return;
  }

  const fallbackCopy = () => {
    field.focus?.();
    field.select?.();
    const copied = document.execCommand?.("copy");
    flashCopyButton(button, copied ? "Copied" : "Select + copy");
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(
      () => flashCopyButton(button, "Copied"),
      fallbackCopy
    );
    return;
  }

  fallbackCopy();
}

function flashCopyButton(button, label) {
  if (!button) return;
  button.dataset.defaultLabel = button.dataset.defaultLabel || button.textContent;
  button.textContent = label;
  window.setTimeout(() => {
    button.textContent = button.dataset.defaultLabel;
  }, 1300);
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clampPercent(value, fallback, min = 0, max = 95) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function roundPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  if (number < 20) return Math.max(1, Math.round(number));
  if (number < 100) return Math.round(number / 5) * 5;
  return Math.round(number / 10) * 10;
}

function moneyValue(value) {
  const number = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return number > 0 ? `$${roundPrice(number)}` : "";
}

function numericMoney(value) {
  return Number(String(value || "").replace(/[^0-9.]/g, "")) || 0;
}

function normalizedConditionValue(value) {
  const clean = String(value || "").toLowerCase();
  if (clean.includes("new")) return "new";
  if (clean.includes("excellent")) return "excellent";
  if (clean.includes("fair")) return "fair";
  if (clean.includes("repair") || clean.includes("poor")) return "repair";
  return "good";
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function displayDate(value) {
  const parsed = Date.parse(`${value}T00:00:00`);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(parsed));
}

function estateSaleIdFromUrl(value) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const numeric = parts.findLast((part) => /^\d{5,}$/.test(part));
    return numeric ? `estate-sale-${numeric}` : "";
  } catch {
    return "";
  }
}

function categoryLabel(category) {
  return window.VERNS_PRICE_GUIDE[category]?.label || category;
}

function conditionLabel(condition) {
  return {
    new: "New",
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    repair: "Needs repair"
  }[condition] || condition;
}

function statusLabel(status) {
  return {
    pending: "Pending",
    posted: "Posted manually",
    sold: "Sold",
    closed: "Closed out",
    unsold: "Unsold"
  }[status] || status;
}

function labelForPhotoCategory(category) {
  return {
    featured: "Featured",
    clearance: "Last chance",
    special: "Warehouse special",
    gallery: "Floor photo"
  }[category] || "Photo";
}

function placeholderForPhotoCategory(category) {
  return {
    featured: "assets/img/placeholder-furniture.svg",
    clearance: "assets/img/placeholder-clearance.svg",
    special: "assets/img/placeholder-tools.svg",
    gallery: "assets/img/placeholder-furniture.svg"
  }[category] || "assets/img/placeholder-furniture.svg";
}

function articleEl(className) {
  const el = document.createElement("article");
  el.className = className;
  return el;
}

function divEl(className, children = []) {
  const el = document.createElement("div");
  if (className) el.className = className;
  children.forEach((child) => child && el.append(child));
  return el;
}

function spanEl(className, text) {
  const el = document.createElement("span");
  el.className = className;
  el.textContent = text || "";
  return el;
}

function pEl(className, text) {
  const el = document.createElement("p");
  if (className) el.className = className;
  el.textContent = text || "";
  return el;
}

function linkEl(className, href, text) {
  const el = document.createElement("a");
  if (className) el.className = className;
  el.href = href;
  el.target = "_blank";
  el.rel = "noopener";
  el.textContent = text || href;
  return el;
}

function headingEl(tag, text) {
  const el = document.createElement(tag);
  el.textContent = text || "";
  return el;
}

function strongEl(text) {
  const el = document.createElement("strong");
  el.textContent = text;
  return el;
}

function imageEl(src, alt, className = "") {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt || "";
  img.loading = "lazy";
  if (className) img.className = className;
  return img;
}

function optionEl(value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
}

function cell(text) {
  const td = document.createElement("td");
  td.textContent = text || "";
  return td;
}

function activityItem(title, lines = []) {
  const item = divEl("activity-item");
  const header = document.createElement("header");
  header.append(headingEl("h4", title));
  item.append(header);
  lines.filter(Boolean).forEach((line) => item.append(pEl("", line)));
  return item;
}
