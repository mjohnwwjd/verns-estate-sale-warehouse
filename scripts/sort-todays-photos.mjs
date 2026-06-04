import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const qlThumbDir = path.join(root, "assets/img/today-staging/thumbs-ql");
const outputRoot = path.join(root, "assets/img/floor-photos/2026-06-03");
const dataFile = path.join(root, "assets/js/today-photo-items.js");

const categoryByNumber = {
  4163: "storefront", 4164: "storefront", 4165: "storefront",
  4166: "furniture", 4167: "furniture", 4168: "homegoods", 4169: "furniture", 4170: "furniture",
  4171: "glassware", 4172: "glassware", 4173: "glassware",
  4174: "sporting", 4175: "sporting", 4176: "sporting", 4177: "medical",
  4178: "electronics", 4179: "electronics",
  4180: "furniture", 4181: "furniture", 4182: "furniture", 4183: "furniture", 4184: "electronics",
  4185: "homegoods", 4186: "lamps", 4187: "lamps", 4188: "furniture", 4189: "furniture",
  4190: "furniture", 4191: "furniture", 4192: "exercise", 4193: "exercise", 4194: "exercise",
  4195: "exercise", 4196: "books", 4197: "furniture", 4198: "furniture", 4199: "furniture",
  4200: "furniture", 4201: "furniture", 4202: "furniture", 4203: "furniture", 4204: "furniture",
  4205: "furniture", 4206: "furniture", 4207: "furniture", 4208: "furniture", 4209: "furniture",
  4210: "furniture", 4211: "lamps", 4212: "lamps", 4213: "lamps", 4214: "lamps", 4215: "lamps",
  4216: "appliances", 4217: "appliances", 4218: "housewares", 4219: "furniture", 4220: "furniture",
  4221: "art", 4222: "housewares", 4223: "art", 4224: "furniture", 4225: "glassware",
  4226: "glassware", 4227: "glassware", 4228: "housewares", 4230: "clocks", 4231: "furniture",
  4232: "furniture", 4233: "homegoods", 4234: "art", 4235: "clothing", 4236: "collectibles",
  4237: "electronics", 4238: "kids", 4239: "tools", 4240: "tools", 4241: "auto", 4242: "tools",
  4243: "tools", 4244: "tools", 4245: "tools", 4246: "clothing", 4247: "tools",
  4248: "housewares", 4249: "tools", 4250: "tools", 4251: "electronics", 4252: "electronics",
  4253: "tools", 4254: "tools", 4255: "tools", 4256: "tools", 4257: "tools", 4258: "homegoods",
  4259: "housewares", 4260: "tools", 4261: "tools", 4262: "tools", 4263: "seasonal",
  4264: "tools", 4265: "sporting", 4266: "books", 4267: "books", 4268: "housewares",
  4269: "sporting", 4270: "glassware", 4271: "collectibles", 4272: "furniture", 4273: "exercise",
  4274: "collectibles", 4275: "collectibles", 4276: "collectibles", 4277: "glassware",
  4278: "collectibles", 4279: "collectibles", 4280: "glassware", 4281: "collectibles",
  4282: "jewelry", 4283: "jewelry", 4284: "jewelry", 4285: "glassware", 4286: "glassware",
  4287: "jewelry", 4288: "furniture", 4289: "furniture", 4290: "collectibles", 4291: "collectibles",
  4292: "collectibles", 4293: "collectibles", 4294: "lamps", 4295: "sporting", 4296: "sporting",
  4297: "electronics", 4298: "electronics", 4299: "electronics", 4300: "kids", 4301: "sporting",
  4302: "kids", 4303: "kids", 4304: "furniture", 4305: "collectibles", 4306: "furniture",
  4307: "housewares", 4308: "seasonal", 4309: "housewares", 4310: "housewares",
  4311: "housewares", 4312: "clocks", 4313: "clocks", 4314: "clocks", 4315: "clocks",
  4316: "clocks", 4317: "clocks", 4318: "art", 4319: "clocks", 4320: "art",
  4321: "clocks", 4322: "clocks", 4323: "art", 4324: "collectibles", 4325: "collectibles",
  4326: "homegoods", 4327: "homegoods", 4328: "lamps", 4329: "lamps", 4330: "seasonal",
  4331: "glassware", 4332: "sporting", 4333: "appliances", 4334: "lamps", 4335: "furniture",
  4336: "art", 4337: "furniture", 4338: "electronics", 4339: "tools", 4340: "electronics",
  4341: "furniture", 4342: "sporting", 4343: "furniture", 4344: "tools", 4345: "sporting",
  4346: "art", 4347: "electronics", 4348: "art", 4349: "electronics", 4350: "housewares",
  4351: "art", 4352: "art", 4353: "clocks", 4354: "clothing", 4355: "lamps",
  4356: "books", 4357: "collectibles"
};

const categoryMeta = {
  appliances: ["Small appliances", "Appliances and practical household machines from the floor."],
  art: ["Framed art", "Wall art, prints, stained glass, and framed pieces."],
  auto: ["Auto and garage parts", "Automotive and garage pieces ready for a closer look."],
  books: ["Books and media", "Books, records, CDs, DVDs, and media shelves."],
  clocks: ["Clocks", "Mantel clocks, wall clocks, and timepieces grouped together."],
  clothing: ["Clothing and linens", "Clothing racks, textiles, and wearable finds."],
  collectibles: ["Collectibles", "Small display pieces, figurines, cases, and cabinet finds."],
  electronics: ["Electronics", "Stereos, printers, vacuums, and shelf electronics."],
  exercise: ["Exercise equipment", "Exercise bikes, fitness pieces, and workout equipment."],
  furniture: ["Furniture", "Dressers, cabinets, chairs, tables, shelves, and furniture rows."],
  glassware: ["Glassware", "Glass, crystal, silverplate, vases, dishes, and display pieces."],
  homegoods: ["Home goods", "Decor, baskets, florals, mirrors, and home accents."],
  housewares: ["Housewares", "Kitchenware, cookware, dishes, mugs, and everyday household pieces."],
  jewelry: ["Jewelry and accessories", "Jewelry cases, bracelets, watches, and small accessories."],
  kids: ["Kids and games", "Toys, games, kids shelves, and family-room finds."],
  lamps: ["Lamps and lighting", "Table lamps, chandeliers, shades, and lighting pieces."],
  medical: ["Medical and mobility", "Canes, mobility aids, and medical-use items."],
  seasonal: ["Seasonal", "Holiday, patio, and seasonal decor."],
  sporting: ["Sporting goods", "Bikes, sports gear, pool cues, coolers, and outdoor items."],
  storefront: ["Storefront", "Storefront, signs, and wide warehouse overview photos."],
  tools: ["Tools", "Tools, cords, garage gear, workshop pieces, and garden tools."]
};

const publicTypeByCategory = {
  appliances: "electronics",
  art: "homegoods",
  jewelry: "collectibles",
  storefront: "homegoods"
};

const featuredFirst = [4225, 4288, 4244, 4312, 4214, 4332, 4324, 4180, 4266, 4336];

const files = fs.readdirSync(qlThumbDir)
  .filter((file) => /\.png$/i.test(file))
  .map((file) => {
    const match = file.match(/IMG_(\d+)/i);
    return match ? { file, number: Number(match[1]) } : null;
  })
  .filter(Boolean)
  .filter(({ number }) => categoryByNumber[number]);

fs.mkdirSync(outputRoot, { recursive: true });

const photoItems = files.map(({ file, number }) => {
  const category = categoryByNumber[number];
  const publicType = publicTypeByCategory[category] || category;
  const [title, note] = categoryMeta[category] || ["Floor photo", "Today's warehouse floor photo."];
  const categoryDir = path.join(outputRoot, category);
  fs.mkdirSync(categoryDir, { recursive: true });
  const outputName = `img-${number}.jpg`;
  const inputPath = path.join(qlThumbDir, file);
  const outputPath = path.join(categoryDir, outputName);
  const result = spawnSync("sips", ["-s", "format", "jpeg", inputPath, "--out", outputPath], { stdio: "ignore" });
  if (result.status !== 0) throw new Error(`Could not convert ${file}`);
  return {
    id: `today-2026-06-03-img-${number}`,
    category: "gallery",
    itemType: publicType,
    sourceCategory: category,
    title,
    price: "",
    tag: "Today",
    note,
    image: `assets/img/floor-photos/2026-06-03/${category}/${outputName}`,
    createdAt: "2026-06-03T12:00:00.000Z"
  };
});

photoItems.sort((a, b) => {
  const aNum = Number(a.id.match(/(\d+)$/)?.[1] || 0);
  const bNum = Number(b.id.match(/(\d+)$/)?.[1] || 0);
  const aFeatured = featuredFirst.indexOf(aNum);
  const bFeatured = featuredFirst.indexOf(bNum);
  if (aFeatured !== -1 || bFeatured !== -1) {
    if (aFeatured === -1) return 1;
    if (bFeatured === -1) return -1;
    return aFeatured - bFeatured;
  }
  return aNum - bNum;
});

const categoryCounts = photoItems.reduce((counts, item) => {
  counts[item.itemType] = (counts[item.itemType] || 0) + 1;
  return counts;
}, {});

const source = `window.VERNS_TODAY_PHOTO_ITEMS = ${JSON.stringify(photoItems, null, 2)};\n`;
fs.writeFileSync(dataFile, source);

console.log(JSON.stringify({ total: photoItems.length, categories: categoryCounts }, null, 2));
