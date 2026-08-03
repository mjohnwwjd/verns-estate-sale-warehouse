const todayPhotoItems = Array.isArray(window.VERNS_TODAY_PHOTO_ITEMS) ? window.VERNS_TODAY_PHOTO_ITEMS : [];

window.VERNS_STARTER_DATA = {
  settings: {
    companyUrl: "https://www.estatesales.net/companies/MI/Muskegon/49441/16076",
    saleUrl: "https://www.estatesales.net/companies/MI/Muskegon/49441/16076",
    embedUrl: "",
    address: "1663 West Sherman Boulevard, Norton Shores, MI 49441",
    phone: "(616) 638-3873",
    email: "",
    facebookUrl: "https://www.facebook.com/profile.php?id=61590219587739",
    hours: "Every day 9 AM-5 PM",
    shortHours: "Every day 9 AM-5 PM",
    location: "Norton Shores, MI",
    aiEndpoint: "/api/price-photo",
    salesSyncUrl: "/api/estate-sales/sync",
    salesAutoSync: false,
    lastSalesSyncAt: "",
    estateSalesWorkflow: {
      saleTitle: "Grand Haven Estate Sale – Fishing, Antlers & Vintage Finds",
      estateSalesUrl: "https://www.estatesales.net/account/sale-wizard/pictures/5022198",
      saleWizardUrl: "https://www.estatesales.net/account/sale-wizard/pictures/5022198",
      liveSaleUrl: "",
      saleStatus: "not-live",
      saleId: "5022198",
      lightspeedCategoryCode: "1",
      lightspeedCategoryName: "",
      lightspeedCategoryId: "",
      minQoh: 1,
      requireImages: true,
      requirePrice: true,
      outputSlug: "5022198-category-1",
      lastUpdated: ""
    },
    contactInfoVersion: "2026-06-05-hero-facts",
    saleImageAssignmentVersion: "2026-05-31-horse-and-pop-up-tent",
    demoContentVersion: "2026-06-23-wyoming-extraordinary-sale",
    thriftMarkdownPercent: 50,
    marketplacePercent: 90,
    clearanceMarkdownPercent: 75,
    defaultPricingBasis: "market"
  },
  estateSales: [
    {
      id: "estate-sale-grand-haven-fishing-antlers-5022198",
      title: "Grand Haven Estate Sale – Fishing, Antlers & Vintage Finds",
      url: "https://www.estatesales.net/companies/MI/Muskegon/49441/16076",
      city: "Grand Haven, MI",
      dateSummary: "Aug 6-8, 2026",
      hours: "Thu-Fri 8:30 AM-5 PM; Sat 8:30 AM-3 PM",
      status: "upcoming",
      note: "Fishing poles, reels, nets, antlers, vintage electronics, stained-glass supplies, furniture, collectibles, and more. Full photos and final terms will be posted on Vern’s official EstateSales.NET page.",
      image: "assets/img/sale-grand-haven-fishing-antlers.png",
      promoEyebrow: "Grand Haven Estate Sale",
      promoHeadline: "Fishing, Antlers & Vintage Finds",
      promoDate: "Aug 6–8",
      buttonLabel: "Watch official listing",
      lastReviewed: "2026-08-03"
    }
  ],
  calendarEvents: [
    {
      id: "calendar-norton-shores-popup-2026-06-05",
      title: "Norton Shores POP UP SURPRISE Vintage & Antiques",
      date: "2026-06-05",
      startTime: "08:30",
      endTime: "17:00",
      type: "sale",
      status: "upcoming",
      location: "Norton Shores, MI",
      employee: "",
      notes: "EstateSales.NET listing 4940091. Verify final photos and terms before opening."
    },
    {
      id: "calendar-norton-shores-popup-2026-06-06",
      title: "Norton Shores POP UP SURPRISE Vintage & Antiques",
      date: "2026-06-06",
      startTime: "08:30",
      endTime: "17:00",
      type: "sale",
      status: "upcoming",
      location: "Norton Shores, MI",
      employee: "",
      notes: "Second sale day. Confirm hours and any discount schedule before posting updates."
    }
  ],
  featured: [
    {
      id: "starter-featured-1",
      title: "Mid-century dresser",
      price: "$125",
      tag: "Fresh find",
      description: "Warm wood, brass pulls, styled and ready for the right room.",
      image: "assets/img/demo/demo-mid-century-dresser.jpeg"
    },
    {
      id: "starter-featured-2",
      title: "Tools and garage table",
      price: "$8-$75",
      tag: "Warehouse pick",
      description: "Hand tools, hardware bins, clamps, and garage finds priced to move.",
      image: "assets/img/demo/demo-tools-table.jpeg"
    },
    {
      id: "starter-featured-3",
      title: "Furniture aisle refresh",
      price: "New arrivals",
      tag: "Last chance",
      description: "Chairs, side tables, lamps, shelves, and framed art staged by row.",
      image: "assets/img/demo/demo-warehouse-furniture-aisle.jpeg"
    }
  ],
  specials: [
    {
      id: "starter-special-1",
      title: "Furniture row",
      detail: "Dressers, side tables, chairs, and shelves rotate weekly.",
      tag: "This week",
      image: "assets/img/demo/demo-warehouse-furniture-aisle.jpeg"
    },
    {
      id: "starter-special-2",
      title: "Glass and collectibles",
      detail: "Amber glass, brass pieces, framed art, dishes, and small treasures.",
      tag: "Easy gifts",
      image: "assets/img/demo/demo-glass-collectibles.jpeg"
    },
    {
      id: "starter-special-3",
      title: "Tools and garage",
      detail: "Workroom basics, hand tools, bins, hardware, and odd finds.",
      tag: "Warehouse",
      image: "assets/img/demo/demo-tools-table.jpeg"
    }
  ],
  photoItems: [
    ...todayPhotoItems
  ],
  pricedItems: [],
  marketplace: [],
  potentialCustomers: [],
  timeoff: []
};

window.VERNS_PRICE_GUIDE = {
  furniture: {
    label: "Furniture",
    store: [25, 180],
    market: [45, 260],
    titlePrefix: "Vintage"
  },
  decor: {
    label: "Home decor",
    store: [8, 45],
    market: [15, 75],
    titlePrefix: "Estate sale"
  },
  lamps: {
    label: "Lamps",
    store: [8, 55],
    market: [18, 95],
    titlePrefix: "Vintage"
  },
  tools: {
    label: "Tools / garage",
    store: [6, 75],
    market: [15, 120],
    titlePrefix: "Garage"
  },
  glassware: {
    label: "Glassware",
    store: [3, 40],
    market: [8, 70],
    titlePrefix: "Vintage"
  },
  collectibles: {
    label: "Collectibles",
    store: [5, 90],
    market: [12, 150],
    titlePrefix: "Collectible"
  },
  housewares: {
    label: "Housewares",
    store: [3, 35],
    market: [8, 55],
    titlePrefix: "Kitchen"
  },
  appliances: {
    label: "Appliances",
    store: [15, 120],
    market: [30, 220],
    titlePrefix: "Appliance"
  },
  homegoods: {
    label: "Home goods",
    store: [5, 50],
    market: [12, 85],
    titlePrefix: "Home"
  },
  clothing: {
    label: "Clothing / linens",
    store: [3, 30],
    market: [8, 45],
    titlePrefix: "Clean"
  },
  exercise: {
    label: "Exercise",
    store: [8, 70],
    market: [18, 130],
    titlePrefix: "Fitness"
  },
  medical: {
    label: "Medical / mobility",
    store: [8, 65],
    market: [15, 110],
    titlePrefix: "Mobility"
  },
  kids: {
    label: "Kids / baby",
    store: [4, 45],
    market: [10, 80],
    titlePrefix: "Kids"
  },
  electronics: {
    label: "Electronics",
    store: [10, 90],
    market: [20, 150],
    titlePrefix: "Tested"
  },
  clocks: {
    label: "Clocks",
    store: [8, 65],
    market: [18, 120],
    titlePrefix: "Vintage"
  },
  jewelry: {
    label: "Jewelry / accessories",
    store: [4, 60],
    market: [10, 100],
    titlePrefix: "Estate"
  },
  books: {
    label: "Books / media",
    store: [1, 18],
    market: [5, 35],
    titlePrefix: "Vintage"
  },
  outdoor: {
    label: "Outdoor / garden",
    store: [8, 80],
    market: [18, 130],
    titlePrefix: "Outdoor"
  },
  sporting: {
    label: "Sporting goods",
    store: [5, 65],
    market: [12, 110],
    titlePrefix: "Sporting"
  },
  seasonal: {
    label: "Seasonal",
    store: [3, 45],
    market: [8, 75],
    titlePrefix: "Seasonal"
  },
  auto: {
    label: "Auto",
    store: [5, 60],
    market: [12, 105],
    titlePrefix: "Auto"
  },
  "scratch-dent": {
    label: "Clearance",
    store: [2, 30],
    market: [5, 55],
    titlePrefix: "As-is"
  }
};

window.VERNS_CONDITION_MULTIPLIERS = {
  new: 1.25,
  excellent: 1.12,
  good: 1,
  fair: 0.72,
  repair: 0.42
};
