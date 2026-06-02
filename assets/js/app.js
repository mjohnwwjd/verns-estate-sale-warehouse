const STORAGE_KEY = "vernsWebsiteStateV1";
const EMPLOYEE_SESSION_KEY = "vernsEmployeeUnlocked";
const PASSCODE = "3939";
const DEFAULT_ESTATE_COMPANY_URL = "https://www.estatesales.net/companies/MI/Muskegon/49441/16076";
const SALE_IMAGE_ASSIGNMENT_VERSION = "2026-05-31-horse-and-pop-up-tent";
const DEMO_CONTENT_VERSION = "2026-05-31-facebook-showcase-2";
const CONTACT_INFO_VERSION = "2026-06-01-monday-hours";
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
  { value: "homegoods", label: "Home Goods", icon: "HG", keywords: ["decor", "home", "homegoods", "basket", "frame", "art", "mirror", "vintage decor"] },
  { value: "clothing", label: "Clothing", icon: "C", keywords: ["clothing", "clothes", "shirt", "jacket", "linen", "linens", "coat", "shoe"] },
  { value: "books", label: "Books", icon: "B", keywords: ["book", "books", "media", "record", "vinyl", "dvd", "cd"] },
  { value: "exercise", label: "Exercise", icon: "EX", keywords: ["exercise", "fitness", "weights", "bike", "treadmill", "workout"] },
  { value: "medical", label: "Medical", icon: "+", keywords: ["medical", "walker", "cane", "wheelchair", "health", "mobility"] },
  { value: "kids", label: "Kids", icon: "K", keywords: ["kids", "kid", "toy", "toys", "crib", "baby", "child", "children"] },
  { value: "electronics", label: "Electronics", icon: "EL", keywords: ["electronics", "radio", "tv", "stereo", "speaker", "camera", "tested"] },
  { value: "clocks", label: "Clocks", icon: "CL", keywords: ["clock", "clocks", "watch", "timepiece"] },
  { value: "sporting", label: "Sporting Goods", icon: "SP", keywords: ["sport", "sporting", "golf", "bike", "fishing", "camping", "ball"] },
  { value: "seasonal", label: "Seasonal", icon: "SN", keywords: ["seasonal", "holiday", "christmas", "halloween", "patio", "summer", "winter"] },
  { value: "auto", label: "Auto", icon: "AU", keywords: ["auto", "car", "truck", "automotive", "garage", "tire"] },
  { value: "collectibles", label: "Collectibles", icon: "*", keywords: ["collectible", "collectibles", "vintage", "brass", "figurine", "antique", "estate"] },
  { value: "scratch-dent", label: "Scratch/Dent", icon: "!", keywords: ["scratch", "dent", "as-is", "repair", "project", "needs work"] }
];
const POPULAR_PHOTO_FILTERS = ["all", "furniture", "lamps", "tools", "electronics", "seasonal"];

let state = loadState();
let marketplaceFilter = "all";
let publicGalleryFilter = "all";
let photoCategoriesExpanded = false;
let pricingPhotoDataUrl = "";
let pricingAiSuggestion = null;
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
    settings.address = isOldPlaceholder(rawSettings.address) ? starter.settings.address : settings.address;
    settings.phone = isOldPlaceholder(rawSettings.phone) ? starter.settings.phone : settings.phone;
    settings.email = isOldPlaceholder(rawSettings.email) ? starter.settings.email : settings.email;
    settings.facebookUrl = rawSettings.facebookUrl || starter.settings.facebookUrl;
    settings.hours = isOldHours(rawSettings.hours) ? starter.settings.hours : settings.hours;
    settings.shortHours = isOldShortHours(rawSettings.shortHours) ? starter.settings.shortHours : settings.shortHours;
    settings.location = !rawSettings.location || rawSettings.location === "Muskegon area" ? starter.settings.location : settings.location;
    settings.contactInfoVersion = CONTACT_INFO_VERSION;
  }
  let featured = Array.isArray(nextState.featured) ? nextState.featured : starter.featured;
  let specials = Array.isArray(nextState.specials) ? nextState.specials : starter.specials;
  let photoItems = Array.isArray(nextState.photoItems) ? nextState.photoItems : starter.photoItems;
  let estateSales = mergeStarterSaleImages(Array.isArray(nextState.estateSales) ? nextState.estateSales : starter.estateSales, starter.estateSales);
  if (rawSettings.saleImageAssignmentVersion !== SALE_IMAGE_ASSIGNMENT_VERSION) {
    estateSales = applySaleImageAssignments(estateSales);
    settings.saleImageAssignmentVersion = SALE_IMAGE_ASSIGNMENT_VERSION;
  }
  if (rawSettings.demoContentVersion !== DEMO_CONTENT_VERSION) {
    featured = mergeSeedById(featured, starter.featured);
    specials = mergeSeedById(specials, starter.specials);
    photoItems = mergeSeedById(photoItems, starter.photoItems);
    settings.demoContentVersion = DEMO_CONTENT_VERSION;
  }

  return {
    settings,
    featured,
    specials,
    estateSales,
    photoItems,
    pricedItems: Array.isArray(nextState.pricedItems) ? nextState.pricedItems : [],
    marketplace: Array.isArray(nextState.marketplace) ? nextState.marketplace : [],
    timeoff: Array.isArray(nextState.timeoff) ? nextState.timeoff : []
  };
}

function isOldPlaceholder(value) {
  return !value || /placeholder|hello@example|\(000\)/i.test(String(value));
}

function isOldHours(value) {
  return !value
    || value === "Thu-Sat 10 AM-5 PM"
    || value === "Tuesday-Saturday, 10 AM-5 PM"
    || value === "Thursday-Saturday, 10 AM-5 PM"
    || value === "Tue-Fri 10 AM-4 PM; Sat 9 AM-4 PM; Sun-Mon Closed";
}

function isOldShortHours(value) {
  return !value
    || value === "Thu-Sat 10-5"
    || value === "Tue-Fri 10-4; Sat 9-4"
    || value === "Tue-Fri 10 AM-4 PM; Sat 9 AM-4 PM; Sun-Mon Closed";
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
  renderSettings();
  renderEstateSales();
  renderClearance();
  renderPublicGallery();
  renderPricingTable();
  renderPricedItemSelect();
  renderMarketplaceList();
  renderDashboard();
  renderContentLists();
  renderPricingSettings();
}

function bindPublicControls() {
  window.addEventListener("hashchange", settleHashScroll);
  document.addEventListener("click", handleHashLinkClick);
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
}

function bindEmployeeAccess() {
  window.addEventListener("hashchange", () => {
    if (location.hash === "#employee") openLogin();
  });

  $("[data-employee-trigger]")?.addEventListener("click", () => {
    sessionStorage.removeItem(EMPLOYEE_SESSION_KEY);
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
    const passcode = new FormData(form).get("passcode");
    if (passcode === PASSCODE) {
      sessionStorage.setItem(EMPLOYEE_SESSION_KEY, "yes");
      form.reset();
      closeLogin();
      openEmployeePanel();
    } else {
      $("[data-login-message]").textContent = "Wrong passcode.";
    }
  });

  $("[data-logout]")?.addEventListener("click", () => {
    sessionStorage.removeItem(EMPLOYEE_SESSION_KEY);
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
    openEmployeePanel();
    return;
  }
  const modal = $("[data-login-modal]");
  modal.hidden = false;
  document.body.classList.add("modal-open");
  setTimeout(() => $("#employee-passcode")?.focus(), 0);
}

function closeLogin() {
  const modal = $("[data-login-modal]");
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  $("[data-login-message]").textContent = "";
}

function openEmployeePanel() {
  const panel = $("[data-employee-panel]");
  panel.hidden = false;
  document.body.classList.add("employee-open");
}

function closeEmployeePanel() {
  const panel = $("[data-employee-panel]");
  panel.hidden = true;
  document.body.classList.remove("employee-open");
  if (location.hash === "#employee") {
    history.replaceState(null, "", location.pathname + location.search);
  }
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

function bindEmployeeTabs() {
  $$("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;
      $$("[data-tab]").forEach((item) => item.classList.toggle("is-active", item === button));
      $$("[data-tab-panel]").forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.tabPanel === tab);
      });
    });
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
  $("[data-current-year]").textContent = new Date().getFullYear();
  $("[data-business-hours]").textContent = settings.shortHours || settings.hours;
  const locationLabel = $("[data-business-location-label]");
  if (locationLabel) locationLabel.textContent = settings.location || "Muskegon area";
  else $("[data-business-location]").textContent = settings.location || "Muskegon area";
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
    if (label) label.textContent = "Verns Estate Sales";
    else link.textContent = "Verns Estate Sales on Facebook";
    link.href = settings.facebookUrl || "#";
  });

  $$("[data-business-directions]").forEach((link) => {
    link.href = directionsUrl(settings.address);
  });

  const estateLink = $("[data-estate-link]");
  const companyUrl = getEstateCompanyUrl(settings.companyUrl);
  const liveSaleUrl = getLiveEstateSaleUrl(settings.saleUrl);
  const activeSaleUrl = liveSaleUrl || getPrimaryEstateSaleUrl();

  $$("[data-estate-company-link]").forEach((link) => {
    link.href = companyUrl;
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
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "Vern's Estate Sale Warehouse Muskegon MI")}`;
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
  const url = new URL(value);
  const path = url.pathname.replace(/\/+$/, "");
  return path && !path.startsWith("/companies") ? value : "";
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
  if (note) note.textContent = "Times can move. Open the yellow buttons for the live EstateSales.NET listings.";
}

function renderComingSoonSaleCard() {
  const card = articleEl("estate-sale-card coming-soon-sale-card");
  card.append(
    comingSoonImageEl(),
    spanEl("tag sale-card-badge sale-scheduling-tag", "Next cities scheduling"),
    headingEl("h3", "More Sales Coming Soon"),
    pEl("sale-location sale-city-line", "Grand Haven · Wyoming · Grand Rapids · Spring Lake"),
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
    pEl("sale-date", sale.dateSummary || "Dates on EstateSales.NET"),
    pEl("", sale.hours || "Check official listing for current hours."),
    pEl("", sale.note || "Full photos and final details are on EstateSales.NET."),
    linkEl("btn btn-gold", sale.url, "Open official listing")
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
  return getVisibleEstateSales()[0]?.url || "";
}

function saleSortValue(sale) {
  const match = String(sale.dateSummary || "").match(/([A-Z][a-z]{2})\s+(\d{1,2})(?:-\d{1,2})?,?\s+(\d{4})/);
  const parsed = match ? Date.parse(`${match[1]} ${match[2]}, ${match[3]}`) : NaN;
  return Number.isNaN(parsed) ? Date.now() : parsed;
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
  grid.replaceChildren(...items.slice(0, 3).map(renderPublicItemCard));
  const note = $("[data-photo-result-note]");
  if (!note) return;
  const active = getPhotoCategory(publicGalleryFilter);
  const activeLabel = publicGalleryFilter === "all" ? "All categories" : active.label;
  const visibleCount = Math.min(items.length, 3);
  if (!items.length) {
    note.textContent = `No floor peeks in ${activeLabel}.`;
  } else {
    note.textContent = `Showing ${visibleCount}${items.length > 3 ? ` of ${items.length}` : ""} floor peek${visibleCount === 1 ? "" : "s"} in ${activeLabel}.`;
  }
}

function renderPublicItemCard(item) {
  const card = articleEl("item-card");
  card.append(
    itemImageWithOverlay(item),
    divEl("meta-line", [spanEl("tag", photoItemTypeLabel(item)), item.price ? pEl("price", item.price) : document.createTextNode("")]),
    headingEl("h3", item.title),
    pEl("", item.note || item.tag || "")
  );
  return card;
}

function renderPhotoCategoryControls() {
  const heading = $("[data-photo-chip-heading]");
  if (heading) heading.textContent = photoCategoriesExpanded ? "All categories" : "Popular categories";

  const buttonWrap = $("[data-photo-category-buttons]");
  if (!buttonWrap) return;
  const visibleCategoryValues = photoCategoriesExpanded
    ? PHOTO_CATEGORY_FILTERS.map((category) => category.value)
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
  if (!values.includes(publicGalleryFilter)) {
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
      employee: data.employee.trim(),
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
  preview.src = pricingPhotoDataUrl;
  preview.alt = file.name || "Selected pricing item preview";
  updatePricingOverlayPreview(form);
}

function resetPricingPhotoPreview() {
  const preview = $("[data-pricing-preview-image]");
  if (preview) {
    preview.src = "assets/img/placeholder-furniture.svg";
    preview.alt = "Selected pricing item preview";
  }
  const status = $("[data-pricing-ai-status]");
  if (status) status.textContent = "Take a picture, then let AI price it.";
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

async function pricePhotoWithAi(form) {
  const status = $("[data-pricing-ai-status]");
  const [file] = Array.from(form.photo?.files || []);
  if (!file) {
    status.textContent = "Take or choose a photo first.";
    form.photo?.focus();
    return;
  }

  status.textContent = "Reading the photo and building thrift prices...";
  const endpoint = state.settings.aiEndpoint || "/api/price-photo";
  const payload = new FormData();
  payload.append("hint", form.hint.value.trim());
  payload.append("category", form.category.value);
  payload.append("condition", form.condition.value);
  payload.append("thriftMarkdownPercent", String(state.settings.thriftMarkdownPercent ?? 50));
  payload.append("marketplacePercent", String(state.settings.marketplacePercent ?? 90));
  payload.append("clearanceMarkdownPercent", String(state.settings.clearanceMarkdownPercent ?? 75));
  payload.append("defaultPricingBasis", state.settings.defaultPricingBasis || "market");
  payload.append("images", file);

  try {
    const response = await fetch(endpoint, { method: "POST", body: payload });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "AI pricing failed. Try one clear photo.");
    }
    pricingAiSuggestion = data.result || data;
    applyPricingSuggestion(form, pricingAiSuggestion);
    status.textContent = pricingAiSuggestion.source === "fallback"
      ? "Local fallback price added. Verify before tagging."
      : "AI price added. Staff should verify condition before tagging.";
  } catch (error) {
    const fallback = localPricingSuggestion({
      hint: form.hint.value,
      category: form.category.value,
      condition: form.condition.value
    });
    pricingAiSuggestion = { ...fallback, source: "local-fallback", notes: error.message };
    applyPricingSuggestion(form, pricingAiSuggestion);
    status.textContent = "AI endpoint was not available, so I used a local fallback price.";
  }
}

function applyPricingSuggestion(form, suggestion) {
  form.name.value = suggestion.itemName || suggestion.title || form.name.value || "Estate sale warehouse item";
  if (suggestion.category && window.VERNS_PRICE_GUIDE[suggestion.category]) form.category.value = suggestion.category;
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

function localPricingSuggestion({ hint, category, condition }) {
  const guide = window.VERNS_PRICE_GUIDE[category] || window.VERNS_PRICE_GUIDE.furniture;
  const multiplier = window.VERNS_CONDITION_MULTIPLIERS[condition] || 1;
  const low = Math.max(1, Math.round(guide.market[0] * multiplier));
  const high = Math.max(low + 1, Math.round(guide.market[1] * multiplier));
  const marketValue = Math.round((low + high) / 2);
  return buildPricingSuggestion({
    itemName: hint || `${guide.label} item`,
    category,
    condition,
    marketValue,
    retailValue: Math.round(marketValue * 1.6),
    confidence: "Low",
    priceBasis: "Local category fallback. Use AI or sold comps when possible.",
    notes: "Fallback price only. Verify item identity, condition, and demand."
  });
}

function buildPricingSuggestion(raw) {
  const marketValue = Number(raw.marketValue || raw.likelySellingPrice || raw.estimatedHigh) || 0;
  const retailValue = Number(raw.retailValue || raw.originalRetailValue) || 0;
  const basisValue = state.settings.defaultPricingBasis === "retail" && retailValue > 0 ? retailValue : marketValue;
  const thriftMarkdown = clampPercent(state.settings.thriftMarkdownPercent, 50);
  const marketplacePercent = clampPercent(state.settings.marketplacePercent, 90, 10, 150);
  const clearanceMarkdown = clampPercent(state.settings.clearanceMarkdownPercent, 75);
  return {
    ...raw,
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
      title: `${guide.titlePrefix} ${item.name} - Vern's Estate Sale Warehouse`,
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
    title: item.name,
    price: destination === "clearance" ? item.clearancePrice || item.storePrice : item.storePrice,
    tag: destination === "clearance" ? "Last chance" : destination === "featured" ? "Fresh find" : destination === "special" ? "Warehouse special" : "Floor photo",
    note: item.notes || "Fresh from Vern's Estate Sale Warehouse.",
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
  body.replaceChildren(
    ...state.pricedItems.slice(0, 20).map((item) => {
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

  form.pricedItem.addEventListener("change", () => hydrateMarketplaceFromPricedItem(form));
  form.photos.addEventListener("change", () => previewMarketplacePhotos(form));
  $("[data-generate-marketplace]")?.addEventListener("click", () => generateMarketplaceCopy(form));
  $("[data-copy-title]")?.addEventListener("click", () => copyField(form.title));
  $("[data-copy-description]")?.addEventListener("click", () => copyField(form.description));
  $("[data-copy-price]")?.addEventListener("click", () => copyField(form.price));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const photos = await filesToDataUrls(form.photos.files, 4);
    const listing = {
      id: createId("market"),
      itemName: data.itemName.trim(),
      category: data.category,
      price: data.price.trim(),
      title: data.title.trim(),
      description: data.description.trim(),
      employee: data.employee.trim(),
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

function hydrateMarketplaceFromPricedItem(form) {
  const item = state.pricedItems.find((entry) => entry.id === form.pricedItem.value);
  if (!item) return;
  form.itemName.value = item.name;
  form.category.value = item.category;
  form.price.value = midpointPrice(item.marketPrice) || item.marketPrice;
  form.employee.value = item.employee || "";
  generateMarketplaceCopy(form);
}

function generateMarketplaceCopy(form) {
  const name = form.itemName.value.trim();
  const category = form.category.value;
  const guide = window.VERNS_PRICE_GUIDE[category] || window.VERNS_PRICE_GUIDE.furniture;
  const cleanName = name || "Estate sale item";
  form.title.value = `${guide.titlePrefix} ${cleanName} - Vern's Estate Sale Warehouse`;
  form.description.value = [
    `${cleanName} available at Vern's Estate Sale Warehouse.`,
    "",
    "Condition: see photos and inspect in person before buying.",
    "Pickup: local warehouse pickup. First come, first served unless staff marks it sold.",
    "Notes: message or stop in for current availability."
  ].join("\n");
  if (!form.price.value) {
    const range = priceRange(guide.market, 1);
    form.price.value = midpointPrice(range) || range;
  }
}

function midpointPrice(value) {
  const matches = String(value).match(/\d+/g);
  if (!matches || !matches.length) return "";
  const nums = matches.map(Number);
  const average = nums.length > 1 ? Math.round((nums[0] + nums[nums.length - 1]) / 2) : nums[0];
  return `$${average}`;
}

function previewMarketplacePhotos(form) {
  const wrap = $("[data-photo-preview]");
  wrap.replaceChildren();
  Array.from(form.photos.files || [])
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
  state.pricedItems.slice(0, 80).forEach((item) => {
    select.append(optionEl(item.id, `${item.name} - ${item.marketPrice}`));
  });
}

function renderMarketplaceList() {
  const list = $("[data-marketplace-list]");
  if (!list) return;
  const items = marketplaceFilter === "all" ? state.marketplace : state.marketplace.filter((item) => item.status === marketplaceFilter);
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
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    state.timeoff.unshift({
      id: createId("time"),
      employee: data.employee.trim(),
      start: data.start,
      end: data.end,
      notes: data.notes.trim(),
      createdAt: new Date().toISOString()
    });
    saveState();
    form.reset();
    renderDashboard();
  });
}

function renderDashboard() {
  const stats = $("[data-dashboard-stats]");
  if (stats) {
    const counts = {
      Pending: state.marketplace.filter((item) => item.status === "pending").length,
      Posted: state.marketplace.filter((item) => item.status === "posted").length,
      Sold: state.marketplace.filter((item) => item.status === "sold").length,
      Closed: state.marketplace.filter((item) => item.status === "closed").length,
      Priced: state.pricedItems.length,
      Photos: state.photoItems.length,
      Sales: state.estateSales.length,
      "Review due": state.estateSales.filter((sale) => isSaleReviewDue(sale) && sale.status !== "past").length
    };
    stats.replaceChildren(
      ...Object.entries(counts).map(([label, count]) => {
        const card = articleEl("stat-card");
        card.append(strongEl(String(count)), pEl("", label));
        return card;
      })
    );
  }

  const activity = $("[data-employee-activity]");
  if (activity) {
    const byEmployee = {};
    [...state.pricedItems, ...state.marketplace].forEach((item) => {
      const name = item.employee || "Unassigned";
      byEmployee[name] = (byEmployee[name] || 0) + 1;
    });
    const entries = Object.entries(byEmployee);
    activity.replaceChildren(
      ...(entries.length
        ? entries.map(([employee, count]) => activityItem(employee, [`${count} saved staff action${count === 1 ? "" : "s"}`]))
        : [pEl("", "No employee activity yet.")])
    );
  }

  const timeoff = $("[data-timeoff-list]");
  if (timeoff) {
    timeoff.replaceChildren(
      ...(state.timeoff.length
        ? state.timeoff.map((item) => activityItem(item.employee, [`${item.start} to ${item.end}`, item.notes || "No notes"]))
        : [pEl("", "No vacation or close-out notes yet.")])
    );
  }
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
    state.settings.saleUrl = sale.status === "past" || sale.status === "canceled" ? state.settings.saleUrl : sale.url;
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
  preview.src = image;
  preview.alt = file.name || "Selected item preview";
  updateAiOverlayPreview(form);
}

function resetAiPhotoPreview() {
  const preview = $("[data-ai-preview-image]");
  const overlay = $("[data-ai-preview-overlay]");
  const status = $("[data-ai-status]");
  if (preview) {
    preview.src = "assets/img/placeholder-clearance.svg";
    preview.alt = "Selected item preview";
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
      dateSummary: String(sale.dateSummary || sale.dates || "").slice(0, 80),
      hours: String(sale.hours || "").slice(0, 100),
      status: ["upcoming", "live", "past", "canceled"].includes(sale.status) ? sale.status : "upcoming",
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

function copyField(field) {
  const value = field.value || field.textContent || "";
  if (!value) return;
  navigator.clipboard?.writeText(value).catch(() => {
    field.select?.();
    document.execCommand("copy");
  });
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
