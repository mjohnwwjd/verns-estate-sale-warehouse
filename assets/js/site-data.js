const todayPhotoItems = Array.isArray(window.VERNS_TODAY_PHOTO_ITEMS) ? window.VERNS_TODAY_PHOTO_ITEMS : [];

window.VERNS_STARTER_DATA = {
  settings: {
    companyUrl: "https://www.estatesales.net/companies/MI/Muskegon/49441/16076",
    saleUrl: "",
    embedUrl: "",
    address: "1663 West Sherman Boulevard, Muskegon, MI 49441",
    phone: "(616) 638-3873",
    email: "",
    facebookUrl: "https://www.facebook.com/profile.php?id=61590219587739",
    hours: "Mon-Fri 10 AM-4 PM; Sat 9 AM-4 PM; Sun Closed",
    shortHours: "Mon-Fri 10-4; Sat 9-4",
    location: "Muskegon, MI",
    aiEndpoint: "/api/price-photo",
    salesSyncUrl: "/api/estate-sales/sync",
    salesAutoSync: true,
    lastSalesSyncAt: "",
    contactInfoVersion: "2026-06-01-monday-hours",
    saleImageAssignmentVersion: "2026-05-31-horse-and-pop-up-tent",
    demoContentVersion: "2026-06-03-today-floor-photos",
    thriftMarkdownPercent: 50,
    marketplacePercent: 90,
    clearanceMarkdownPercent: 75,
    defaultPricingBasis: "market"
  },
  estateSales: [
    {
      id: "estate-sale-spring-lake-4932078",
      title: "Spring Lake Estate Sale",
      url: "https://www.estatesales.net/MI/Spring-Lake/49456/4932078",
      city: "Spring Lake, MI",
      dateSummary: "Jun 1-3, 2026",
      hours: "Mon-Tue 8:30 AM-5 PM; Wed 8:30 AM-3 PM",
      status: "upcoming",
      note: "Full details and photos open on the official EstateSales.NET listing.",
      image: "assets/img/sale-spring-lake-horse.jpeg",
      lastReviewed: "2026-05-31"
    },
    {
      id: "estate-sale-muskegon-popup-4940091",
      title: "Muskegon POP UP SURPRISE Vintage & Antiques",
      url: "https://www.estatesales.net/MI/Muskegon/49442/4940091",
      city: "Muskegon, MI",
      dateSummary: "Jun 5-6, 2026",
      hours: "8:30 AM-5 PM",
      status: "upcoming",
      note: "Warehouse pop-up listing. Open EstateSales.NET for current photos and final times.",
      image: "assets/img/sale-muskegon-pop-up-tent.jpeg",
      lastReviewed: "2026-05-31"
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
    ...todayPhotoItems,
    {
      id: "starter-photo-clearance-1",
      category: "clearance",
      itemType: "scratch-dent",
      title: "Last Chance clearance table",
      price: "$5-$45",
      tag: "Last chance",
      note: "Yellow-tag markdowns on lamps, decor, baskets, dishes, and small finds.",
      image: "assets/img/demo/demo-last-chance-clearance.jpeg",
      createdAt: "2026-05-31T00:00:00.000Z"
    },
    {
      id: "starter-photo-gallery-1",
      category: "gallery",
      itemType: "glassware",
      title: "Glassware and collectibles",
      price: "",
      tag: "Floor photo",
      note: "A shoppable table of vintage glass, brass, framed art, and small decor.",
      image: "assets/img/demo/demo-glass-collectibles.jpeg",
      createdAt: "2026-05-31T00:00:00.000Z"
    },
    {
      id: "starter-photo-special-1",
      category: "gallery",
      itemType: "tools",
      title: "Garage and tool table",
      price: "$8-$75",
      tag: "Floor photo",
      note: "A practical table of hand tools, hardware, and garage basics.",
      image: "assets/img/demo/demo-tools-table.jpeg",
      createdAt: "2026-05-31T00:00:00.000Z"
    },
    {
      id: "starter-photo-featured-1",
      category: "gallery",
      itemType: "furniture",
      title: "Styled dresser vignette",
      price: "$125",
      tag: "Floor photo",
      note: "Warm wood, brass pulls, lamps, art, and decor staged for the floor.",
      image: "assets/img/demo/demo-mid-century-dresser.jpeg",
      createdAt: "2026-05-31T00:00:00.000Z"
    },
    {
      id: "starter-photo-gallery-2",
      category: "gallery",
      itemType: "furniture",
      title: "Warehouse furniture aisle",
      price: "",
      tag: "Floor photo",
      note: "A filled-out row of chairs, tables, lamps, framed art, and shelving.",
      image: "assets/img/demo/demo-warehouse-furniture-aisle.jpeg",
      createdAt: "2026-05-31T00:00:00.000Z"
    }
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
    label: "Scratch / dent",
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
