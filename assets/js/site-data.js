const todayPhotoItems = Array.isArray(window.VERNS_TODAY_PHOTO_ITEMS) ? window.VERNS_TODAY_PHOTO_ITEMS : [];

window.VERNS_STARTER_DATA = {
  settings: {
    companyUrl: "https://www.estatesales.net/companies/MI/Muskegon/49441/16076",
    saleUrl: "https://www.estatesales.net/MI/Spring-Lake/49456/4982283",
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
      saleTitle: "Current estate sale",
      estateSalesUrl: "",
      saleId: "",
      lightspeedCategoryCode: "",
      lightspeedCategoryName: "",
      lightspeedCategoryId: "",
      minQoh: 1,
      requireImages: true,
      outputSlug: "current-estate-sale",
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
      id: "estate-sale-spring-lake-packed-4982283",
      title: "Spring Lake Estate Sale - Packed 3 Level House",
      url: "https://www.estatesales.net/MI/Spring-Lake/49456/4982283",
      city: "Spring Lake, MI",
      dateSummary: "Jul 16-18, 2026",
      hours: "Thu-Fri 8:30 AM-5 PM; Sat 8:30 AM-3 PM",
      status: "upcoming",
      note: "Packed three-level Spring Lake estate sale with Fenton glass, Coach purses, furniture, collectibles, household items, bicycle, decor, garage finds, and resale potential. Address releases on EstateSales.NET after 9 AM Wednesday, July 15.",
      image: "assets/img/sale-spring-lake-bicycle-collage.jpg",
      buttonLabel: "Open official listing",
      lastReviewed: "2026-07-13"
    },
    {
      id: "estate-sale-wyoming-extraordinary-4971918",
      title: "Wyoming Extraordinary Estate Sale - Rare & Unusual Antiques",
      url: "https://www.estatesales.net/MI/Wyoming/49519/4971918",
      city: "Wyoming, MI",
      dateSummary: "Jul 9-12, 2026",
      hours: "Thu-Fri 8:30 AM-5 PM; Sat 8:30 AM-3 PM; Sun 8:30 AM-2 PM",
      status: "ended",
      note: "This sale has ended. Open the official EstateSales.NET listing for archived photos, terms, and details.",
      image: "assets/img/sale-wyoming-extraordinary-main.jpg",
      buttonLabel: "Open archived listing",
      lastReviewed: "2026-07-13"
    },
    {
      id: "estate-sale-mona-lake-tools-4958901",
      title: "Mona Lake Frontage Estate Sale - TOOLS GALORE",
      url: "https://www.estatesales.net/MI/Norton-Shores/49441/4958901",
      city: "Norton Shores, MI",
      dateSummary: "Jun 18-21, 2026",
      hours: "Thu-Fri 8:30 AM-5 PM; Sat 8:30 AM-3 PM; Sun 8:30 AM-2 PM",
      status: "ended",
      note: "This sale has ended. Open the official EstateSales.NET listing for archived photos and details.",
      image: "assets/img/sale-mona-lake-tools-thumb.jpg",
      buttonLabel: "Open official listing",
      lastReviewed: "2026-06-23"
    },
    {
      id: "estate-sale-grand-haven-current",
      title: "GRAND HAVEN Lakeshore Ave. Estate Sale",
      url: "https://www.estatesales.net/MI/Grand-Haven/49417/4951521",
      city: "Grand Haven, MI",
      address: "13462 Lakeshore Ave., Grand Haven, MI 49417",
      dateSummary: "Jun 11-13, 2026",
      hours: "Thu-Fri 8:30 AM-5 PM; Sat 8:30 AM-3 PM",
      status: "past",
      note: "This sale has ended. Open the official listing for archived photos and details.",
      image: "assets/img/sale-coming-soon-west-mi.png",
      buttonLabel: "Open official listing",
      lastReviewed: "2026-06-11"
    },
    {
      id: "estate-sale-spring-lake-4932078",
      title: "Spring Lake Estate Sale",
      url: "https://www.estatesales.net/MI/Spring-Lake/49456/4932078",
      city: "Spring Lake, MI",
      dateSummary: "Jun 1-3, 2026",
      hours: "Mon-Tue 8:30 AM-5 PM; Wed 8:30 AM-3 PM",
      status: "past",
      note: "Full details and photos open on the official EstateSales.NET listing.",
      image: "assets/img/sale-spring-lake-horse.jpeg",
      lastReviewed: "2026-05-31"
    },
    {
      id: "estate-sale-muskegon-popup-4940091",
      title: "Norton Shores POP UP SURPRISE Vintage & Antiques",
      url: "https://www.estatesales.net/MI/Muskegon/49442/4940091",
      city: "Norton Shores, MI",
      dateSummary: "Jun 5-6, 2026",
      hours: "8:30 AM-5 PM",
      status: "past",
      note: "This pop-up sale has ended. Leftover merchandise moves to Vern's Estate Sale Warehouse, so stop by the store for fresh finds.",
      image: "assets/img/sale-muskegon-pop-up-tent.jpeg",
      lastReviewed: "2026-05-31"
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
