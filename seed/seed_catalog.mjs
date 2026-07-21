/**
 * ============================================================
 * Kisaan Kart — Production Catalog Seeder  (seed_catalog.mjs)
 * ============================================================
 * HOW TO RUN:
 *   cd Kisaan_Kart_Backend
 *   node seed/seed_catalog.mjs
 *
 * WHAT IT DOES:
 *   Phase 1 — Safely deletes demo products (preserves orders)
 *   Phase 2 — Upserts 10 canonical grocery categories
 *   Phase 3 — Inserts 120 real branded grocery products
 *
 * IDEMPOTENT: Safe to run multiple times.
 * ============================================================
 */

import "dotenv/config";
import pool from "../src/db/index.js";

const disc = (price, pct) => Math.round(price * (1 - pct / 100));

// ─── CATEGORIES ──────────────────────────────────────────────
const CATEGORIES = [
  { name: "Fruits",            description: "Fresh seasonal fruits sourced directly from farms across India.",      image_url: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80", sort_order: 1 },
  { name: "Vegetables",        description: "Farm-fresh vegetables delivered daily to your doorstep.",              image_url: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&q=80", sort_order: 2 },
  { name: "Grains & Rice",     description: "Premium quality grains, rice varieties and whole wheat products.",     image_url: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=400&q=80", sort_order: 3 },
  { name: "Pulses & Dal",      description: "Protein-rich pulses and dals, essential for every Indian kitchen.",   image_url: "https://images.unsplash.com/photo-1587317376043-4dcbf07c6f37?w=400&q=80", sort_order: 4 },
  { name: "Dairy & Milk",      description: "Fresh dairy products — milk, paneer, butter, curd and more.",         image_url: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80", sort_order: 5 },
  { name: "Bakery",            description: "Freshly baked breads, buns, cookies and pastries every day.",         image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80", sort_order: 6 },
  { name: "Beverages",         description: "Cold drinks, juices, energy drinks, water and teas.",                 image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80", sort_order: 7 },
  { name: "Dry Fruits & Nuts", description: "Premium quality dry fruits, nuts and seeds for healthy snacking.",    image_url: "https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?w=400&q=80", sort_order: 8 },
  { name: "Spices & Masala",   description: "Aromatic Indian spices and masalas for authentic flavour.",           image_url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80", sort_order: 9 },
  { name: "Oils & Ghee",       description: "Pure cooking oils, desi ghee and healthy fats for every kitchen.",   image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80", sort_order: 10 },
];

// ─── PRODUCTS ────────────────────────────────────────────────
// p(category, name, description, brand, unit, price, discountPct, stock, imageUrl)
function buildProducts(cm) {
  const p = (cat, name, desc, brand, unit, price, dpct, stock, img) => ({
    category_id: cm[cat], name, description: desc, brand, unit, price,
    discount_price: dpct > 0 ? disc(price, dpct) : null,
    stock, is_available: stock > 0, image_url: img,
  });
  return [
    // ── FRUITS (12) ──────────────────────────────────────────
    p("Fruits","Kashmiri Red Apple","Premium Kashmiri apples — sweet, crisp and freshly harvested from high-altitude orchards. Rich in fibre and antioxidants.","Himalayan Farms","1 kg",180,10,120,"https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=85"),
    p("Fruits","Cavendish Banana","Naturally ripened Cavendish bananas, a great source of potassium and instant energy. Perfect for breakfast or smoothies.","NatureFresh","6 pcs",55,0,200,"https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=600&q=85"),
    p("Fruits","Nagpur Orange","Juicy Nagpur oranges bursting with Vitamin C. Hand-picked at peak ripeness for maximum sweetness.","Kisaan Direct","4 pcs",80,10,150,"https://images.unsplash.com/photo-1547514701-42782101795e?w=600&q=85"),
    p("Fruits","Alphonso Mango","The king of mangoes — Ratnagiri Alphonso with rich aroma, fibreless pulp and golden colour.","Ratnagiri Farms","500 g",250,0,60,"https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600&q=85"),
    p("Fruits","Ripe Papaya","Sweet yellow papaya rich in Vitamins A, C and digestive enzymes. Great for gut health.","GreenLeaf","1 pc (~800g)",65,0,90,"https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&q=85"),
    p("Fruits","Green Kiwi","New Zealand variety kiwi with sweet-tart flavour and high Vitamin C. Firm and juicy.","OrchardFresh","6 pcs",180,15,80,"https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&q=85"),
    p("Fruits","Seedless Watermelon","Refreshing seedless watermelon — hydrating, sweet and low in calories.","FarmBridge","1 pc (~3 kg)",120,0,40,"https://images.unsplash.com/photo-1563114773-84221bd62daa?w=600&q=85"),
    p("Fruits","Golden Pineapple","Tropical pineapple loaded with bromelain and natural sweetness. Great for fruit salads and juices.","TropicFarm","1 pc",80,0,70,"https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&q=85"),
    p("Fruits","Pomegranate","Fresh pomegranate packed with antioxidants. Ruby-red arils rich in polyphenols.","ArgilFarms","2 pcs",120,10,100,"https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=85"),
    p("Fruits","Black Seedless Grapes","Sweet black seedless grapes rich in resveratrol. Great for snacking and desserts.","VineyardFresh","500 g",110,0,130,"https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&q=85"),
    p("Fruits","Williams Pear","Buttery soft pears with a mild honey-like sweetness packed with dietary fibre.","HillsideFarm","4 pcs",140,0,60,"https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=600&q=85"),
    p("Fruits","Allahabad Guava","Large white-fleshed guavas with sweet flavour and high Vitamin C content.","KisaanCo","500 g",60,0,110,"https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=600&q=85"),

    // ── VEGETABLES (12) ──────────────────────────────────────
    p("Vegetables","Fresh Red Onion","Farm-fresh red onions from Nashik — the onion capital of India. Essential for every dish.","Nashik Farms","1 kg",45,0,300,"https://images.unsplash.com/photo-1618512496248-a4dd289a8b85?w=600&q=85"),
    p("Vegetables","Roma Tomato","Bright red Roma tomatoes — perfect for gravies, sauces and salads. Farm-fresh and juicy.","FreshFarm","500 g",35,0,250,"https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=600&q=85"),
    p("Vegetables","Agra Potato","Premium potatoes from the fertile plains of Agra. Ideal for curries, fries and snacks.","RootFarm","1 kg",40,0,400,"https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=85"),
    p("Vegetables","Orange Carrot","Crunchy fresh carrots rich in beta-carotene and Vitamin A. Grown without pesticides.","OotyOrganics","500 g",35,0,180,"https://images.unsplash.com/photo-1445282768818-728615cc910a?w=600&q=85"),
    p("Vegetables","Fresh Cauliflower","White, dense fresh cauliflower from Himachal Pradesh. Great for sabzi, soup and roasting.","HimFresh","1 pc (~600g)",55,0,100,"https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&q=85"),
    p("Vegetables","Broccoli Crown","Tender broccoli florets rich in Vitamins C and K. A superfood for stir-fry and soups.","GreenGrove","250 g",70,0,80,"https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&q=85"),
    p("Vegetables","Baby Spinach Leaves","Tender baby spinach with iron, calcium and folate. Pre-washed and ready to use.","LeafyFarms","200 g",45,0,120,"https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=85"),
    p("Vegetables","Red Capsicum","Sweet and crunchy red bell peppers high in Vitamin C. Great for stir-fry and salads.","CapsiCo","2 pcs",60,10,90,"https://images.unsplash.com/photo-1590005354167-6da97870c757?w=600&q=85"),
    p("Vegetables","English Cucumber","Long, crisp English cucumbers with thin skin. Ideal for salads, raita and detox water.","CoolFarm","2 pcs",50,0,150,"https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&q=85"),
    p("Vegetables","Green Cabbage","Fresh compact cabbage rich in Vitamin K. Great for sabzi, coleslaw and wraps.","FarmFresh","1 pc (~700g)",40,0,130,"https://images.unsplash.com/photo-1598030343246-eec71064a9b5?w=600&q=85"),
    p("Vegetables","Purple Brinjal","Shiny, tender purple brinjal — essential for baingan bharta and curries.","SunFarm","500 g",40,0,110,"https://images.unsplash.com/photo-1597528380307-c9c3a5a75f73?w=600&q=85"),
    p("Vegetables","Lady Finger (Okra)","Fresh, tender green okra — crisp and ready for bhindi masala. Low calorie, high fibre.","DesiVeggie","250 g",35,0,140,"https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&q=85"),

    // ── GRAINS & RICE (12) ───────────────────────────────────
    p("Grains & Rice","Daawat Extra Long Basmati Rice","Aged extra-long grain Basmati with distinctive aroma. Each grain elongates 2x. Perfect for biryani.","Daawat","5 kg",620,10,200,"https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=600&q=85"),
    p("Grains & Rice","Brown Basmati Rice","Whole grain brown Basmati retaining bran layer — nutty flavour, lower glycaemic index.","NatureNest","1 kg",140,0,150,"https://images.unsplash.com/photo-1536304993881-ff86e0c9a2c7?w=600&q=85"),
    p("Grains & Rice","Sona Masoori Rice","Light, aromatic South Indian rice ideal for everyday cooking, idli and dosa batter.","FarmerDirect","5 kg",480,5,180,"https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=85"),
    p("Grains & Rice","Aashirvaad Whole Wheat Atta","Made from 100% whole wheat with germ intact. 0% maida. Produces soft, nutritious rotis.","Aashirvaad","5 kg",290,5,300,"https://images.unsplash.com/photo-1574323347407-f5e1c5a1ec21?w=600&q=85"),
    p("Grains & Rice","Multigrain Atta","Blend of wheat, soy, oat, maize and psyllium husk. High fibre and protein.","NutriMill","1 kg",85,0,120,"https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=85"),
    p("Grains & Rice","Bombay Sooji (Semolina)","Fine grain semolina perfect for upma, halwa, rava dosa and idli.","GoldGrain","500 g",40,0,200,"https://images.unsplash.com/photo-1589375439037-58b0a8ac4903?w=600&q=85"),
    p("Grains & Rice","Thick Poha (Flattened Rice)","Thick-grade flattened rice — perfect for poha, chivda and quick breakfast dishes.","KhetSe","500 g",45,0,180,"https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&q=85"),
    p("Grains & Rice","Broken Wheat Dalia","Whole cracked wheat — high fibre, easy to digest. Great for porridge and pulao.","OrganicBharat","500 g",60,0,130,"https://images.unsplash.com/photo-1590005354167-6da97870c757?w=600&q=85"),
    p("Grains & Rice","Corn Flour (Makki ka Atta)","Finely ground yellow corn flour — essential for makki di roti and corn-based recipes.","GoldenCorn","500 g",50,0,160,"https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=600&q=85"),
    p("Grains & Rice","Besan (Chickpea Flour)","Stone-ground chickpea flour — base for pakoras, kadhi and cheela.","DesiGrains","500 g",65,0,220,"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=85"),
    p("Grains & Rice","Jowar Flour","Gluten-free sorghum flour — traditional superfood grain. Great for bhakri.","MilkMillet","500 g",70,0,100,"https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=600&q=85"),
    p("Grains & Rice","Ragi Flour (Finger Millet)","Calcium-rich ragi flour — excellent for ragi roti, porridge and dosa batter.","MilkMillet","500 g",75,0,110,"https://images.unsplash.com/photo-1574323347407-f5e1c5a1ec21?w=600&q=85"),

    // ── PULSES & DAL (12) ────────────────────────────────────
    p("Pulses & Dal","Toor Dal (Arhar)","Split pigeon peas — the most widely consumed dal in India. Essential for dal tadka and sambar.","KhetSe","1 kg",135,0,250,"https://images.unsplash.com/photo-1600626334884-ce8c2fc2700a?w=600&q=85"),
    p("Pulses & Dal","Moong Dal (Yellow Split)","Split yellow mung beans — light, digestible and high in protein. Perfect for khichdi.","PulsePlus","500 g",75,0,200,"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=85"),
    p("Pulses & Dal","Masoor Dal (Red Lentils)","Split red lentils — quick-cooking and protein-rich. Great for dal makhani and soups.","AaharCo","1 kg",115,5,220,"https://images.unsplash.com/photo-1587317376043-4dcbf07c6f37?w=600&q=85"),
    p("Pulses & Dal","Urad Dal (White Split)","Split black gram dal — key ingredient for idli batter, dal makhani and medu vada.","SouthFarm","500 g",90,0,180,"https://images.unsplash.com/photo-1600626334884-ce8c2fc2700a?w=600&q=85"),
    p("Pulses & Dal","Chana Dal (Bengal Gram)","Split chickpeas — base for chana dal tadka, halwa and savoury snacks.","DesiPulse","1 kg",125,0,210,"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=85"),
    p("Pulses & Dal","Rajma (Kidney Beans)","Plump dark red kidney beans — the heart of Punjabi rajma. Protein and iron-rich.","PunjabFarm","500 g",90,10,150,"https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&q=85"),
    p("Pulses & Dal","Kala Chana (Black Chickpeas)","Earthy, firm black chickpeas — perfect for chhole, salad and protein bowls.","AaharCo","500 g",80,0,140,"https://images.unsplash.com/photo-1587317376043-4dcbf07c6f37?w=600&q=85"),
    p("Pulses & Dal","Safed Vatana (White Peas)","Whole white peas for Mumbai-style ragda, pav bhaji and chaat.","StreetFood","500 g",70,0,130,"https://images.unsplash.com/photo-1600626334884-ce8c2fc2700a?w=600&q=85"),
    p("Pulses & Dal","Whole Moong (Green Gram)","Whole green mung beans — great sprouted for salads or cooked for sabzi.","GreenPulse","500 g",75,0,120,"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=85"),
    p("Pulses & Dal","Whole Urad (Black Gram)","Whole black gram urad — base for authentic dal makhani and idli-dosa batter.","KhetSe","500 g",95,0,110,"https://images.unsplash.com/photo-1587317376043-4dcbf07c6f37?w=600&q=85"),
    p("Pulses & Dal","Kabuli Chana (White Chickpeas)","Large, creamy white chickpeas — essential for chole bhature and hummus.","DesiPulse","500 g",95,0,130,"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=85"),
    p("Pulses & Dal","Lobia (Black-eyed Peas)","Firm, creamy black-eyed peas — used in South Indian curries and Sindhi sai bhaji.","SunPulse","500 g",80,0,100,"https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&q=85"),

    // ── DAIRY & MILK (12) ────────────────────────────────────
    p("Dairy & Milk","Amul Gold Full Cream Milk","Rich, creamy full-fat cow milk. 6% fat, high protein, fortified with Vitamins A and D.","Amul","1 litre",72,0,500,"https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=85"),
    p("Dairy & Milk","Mother Dairy Buffalo Milk","Rich, thick buffalo milk with 7.5% fat — preferred for paneer, khoa and creamy chai.","Mother Dairy","500 ml",38,0,400,"https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=85"),
    p("Dairy & Milk","Amul Fresh Paneer","Soft, creamy cow-milk paneer made fresh daily. No preservatives. Perfect for curries.","Amul","200 g",95,5,200,"https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=85"),
    p("Dairy & Milk","Amul Butter (Salted)","The iconic yellow salted butter — perfect on toast, in baking and for tempering.","Amul","500 g",280,0,300,"https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=85"),
    p("Dairy & Milk","Britannia Cheese Slices","Mild, meltable processed cheese slices — perfect for sandwiches and burgers.","Britannia","200 g",140,10,180,"https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=600&q=85"),
    p("Dairy & Milk","Amul Dahi (Curd)","Thick, probiotic-rich set curd from full-fat toned milk. Great for raita and lassi.","Amul","400 g",48,0,250,"https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=85"),
    p("Dairy & Milk","Epigamia Greek Yogurt","Strained Greek yogurt with 10g protein per serving. Thick, creamy and all-natural.","Epigamia","90 g",45,0,150,"https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=85"),
    p("Dairy & Milk","Amul Fresh Cream","Smooth, pasteurised cream with 25% fat. Ideal for gravies, desserts and pasta sauces.","Amul","200 ml",80,0,180,"https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=85"),
    p("Dairy & Milk","Amul Pure Ghee","Pure clarified butter made from cow milk. Golden colour, granular texture, rich aroma.","Amul","500 ml",350,5,220,"https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=85"),
    p("Dairy & Milk","Amul Masti Buttermilk","Lightly salted, spiced buttermilk (chaas) — refreshing probiotic drink. Zero added sugar.","Amul","200 ml",25,0,300,"https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=85"),
    p("Dairy & Milk","Nandini Toned Milk","Fresh toned cow milk from Karnataka Milk Federation — 3% fat, 8.5% SNF.","Nandini","1 litre",58,0,350,"https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=85"),
    p("Dairy & Milk","Milky Mist Malai Paneer","Extra-soft malai paneer from full-cream milk. Exceptionally creamy — melts in your mouth.","Milky Mist","200 g",105,0,150,"https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=85"),

    // ── BAKERY (12) ──────────────────────────────────────────
    p("Bakery","Britannia Brown Bread","Whole wheat brown bread with soft, fluffy texture and light nuttiness.","Britannia","400 g",50,0,200,"https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=85"),
    p("Bakery","Harvest Gold White Sandwich Bread","Classic soft white sandwich loaf — great for sandwiches and French toast.","Harvest Gold","400 g",45,0,250,"https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&q=85"),
    p("Bakery","Sesame Burger Buns","Soft, slightly sweet burger buns topped with sesame seeds.","BakeFresh","4 pcs",55,0,180,"https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&q=85"),
    p("Bakery","Laadi Pav (Dinner Rolls)","Pillowy-soft Mumbai-style pav rolls. Essential for vada pav and pav bhaji.","BakeFresh","6 pcs",30,0,300,"https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&q=85"),
    p("Bakery","Modern Whole Wheat Bread","Dense, hearty whole wheat loaf with seeds — high fibre and no maida.","Modern","400 g",55,0,150,"https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=85"),
    p("Bakery","Butter Croissant","Flaky, golden all-butter croissant with 72 laminated layers. Baked fresh daily.","Le Fournee","2 pcs",120,0,80,"https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=85"),
    p("Bakery","Britannia Good Day Cashew Cookies","Crispy, buttery biscuits loaded with whole cashew pieces. Classic chai-time biscuit.","Britannia","120 g",35,0,400,"https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=85"),
    p("Bakery","Britannia Toastea Rusk","Twice-baked, crispy rusk with mild sweetness. Perfect for dunking in chai.","Britannia","200 g",50,0,350,"https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&q=85"),
    p("Bakery","Chocolate Cupcake","Moist chocolate sponge topped with rich frosting. Individually wrapped and fresh.","BakeFresh","2 pcs",90,10,100,"https://images.unsplash.com/photo-1519869325622-a6b2d63108a0?w=600&q=85"),
    p("Bakery","Blueberry Muffin","Tender muffin loaded with fresh blueberries. Baked fresh every morning — no artificial flavours.","BakeFresh","2 pcs",95,0,90,"https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=85"),
    p("Bakery","Multigrain Pita Bread","Round pocketed pita made with multigrain flour. Perfect for wraps and dips.","HeathBake","4 pcs",75,0,120,"https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&q=85"),
    p("Bakery","Almond Biscotti","Twice-baked Italian-style hard biscuits with whole almonds. Great for dunking in coffee.","ItalCraft","150 g",130,0,80,"https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=85"),

    // ── BEVERAGES (12) ───────────────────────────────────────
    p("Beverages","Coca-Cola Classic 750ml","The world's most iconic carbonated soft drink. Refreshing caramel and citrus notes.","Coca-Cola","750 ml",45,0,500,"https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=85"),
    p("Beverages","Pepsi Cola 600ml","Smooth, slightly sweeter cola with a clean finish. Best ice-cold.","PepsiCo","600 ml",38,0,450,"https://images.unsplash.com/photo-1629203851122-3726555cf520?w=600&q=85"),
    p("Beverages","Sprite Lemon-Lime 600ml","Clear, crisp lemon-lime carbonated drink with zero caffeine. Light and refreshing.","Coca-Cola","600 ml",38,0,400,"https://images.unsplash.com/photo-1620927659855-ef7f22f9e83b?w=600&q=85"),
    p("Beverages","Fanta Orange 600ml","Fruity, zingy orange-flavoured carbonated drink. The ideal party drink for all ages.","Coca-Cola","600 ml",38,0,380,"https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=600&q=85"),
    p("Beverages","Real Mixed Fruit Juice","100% real fruit juice blend of apple, orange, grape and guava. No added sugar.","Dabur Real","1 litre",125,10,200,"https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=85"),
    p("Beverages","Tropicana Orange Juice","Freshly squeezed style orange juice. Rich in Vitamin C and natural antioxidants.","Tropicana","1 litre",135,5,180,"https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=85"),
    p("Beverages","Red Bull Energy Drink","Original energy drink with caffeine, taurine and B vitamins. Gives you wings.","Red Bull","250 ml",125,0,250,"https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=85"),
    p("Beverages","Bisleri Mineral Water 1L","India's most trusted bottled mineral water from protected underground sources.","Bisleri","1 litre",20,0,1000,"https://images.unsplash.com/photo-1616118132534-381148898bb4?w=600&q=85"),
    p("Beverages","Nescafe Cold Coffee","Ready-to-drink chilled coffee with real milk and perfect coffee-to-milk ratio.","Nescafe","180 ml",40,0,300,"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=85"),
    p("Beverages","Lipton Green Tea Bags","Premium green tea with light grassy flavour and natural antioxidants.","Lipton","25 bags",165,10,250,"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=85"),
    p("Beverages","Frooti Mango Drink","India's favourite mango drink — sweet, tangy and instantly refreshing.","Parle Agro","200 ml",15,0,600,"https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=85"),
    p("Beverages","Amul Mango Lassi","Thick, creamy sweet lassi made from fresh dahi and real Alphonso mango pulp.","Amul","200 ml",35,0,350,"https://images.unsplash.com/photo-1625865272717-d8f7fbedc5ea?w=600&q=85"),

    // ── DRY FRUITS & NUTS (12) ───────────────────────────────
    p("Dry Fruits & Nuts","California Almonds Premium","Large, crunchy California almonds rich in Vitamin E and magnesium.","Happilo","500 g",620,10,150,"https://images.unsplash.com/photo-1591771612040-a1bc1c9b6ab2?w=600&q=85"),
    p("Dry Fruits & Nuts","Whole Cashews W240 Grade","Whole, creamy W240 grade cashews — naturally sweet and great for snacking.","Happilo","250 g",320,0,130,"https://images.unsplash.com/photo-1567892737950-30c4db37cd89?w=600&q=85"),
    p("Dry Fruits & Nuts","Walnut Kernels (Halves)","Fresh walnut halves — brain-healthy nuts loaded with Omega-3 fatty acids.","FruitoLay","250 g",280,5,100,"https://images.unsplash.com/photo-1563412885-139e4045ec52?w=600&q=85"),
    p("Dry Fruits & Nuts","Roasted Pistachios (Salted)","Lightly salted roasted pistachios with open shells — easy to eat and protein-packed.","Happilo","200 g",280,0,120,"https://images.unsplash.com/photo-1572449840847-b8f4cd7f1e0f?w=600&q=85"),
    p("Dry Fruits & Nuts","Kishmish (Seedless Raisins)","Plump, seedless golden raisins from Afghanistan — naturally sweet and high in iron.","DryFruitWala","250 g",120,0,200,"https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?w=600&q=85"),
    p("Dry Fruits & Nuts","Medjool Dates","Premium Medjool dates — caramel-like sweetness and chewy texture. The king of dates.","DryFruitWala","500 g",480,10,90,"https://images.unsplash.com/photo-1573564463397-cc5b6bbf53aa?w=600&q=85"),
    p("Dry Fruits & Nuts","Dried Anjeer (Figs)","Sun-dried Turkish figs — naturally sweet, high in fibre and calcium.","NutriNuts","250 g",280,0,100,"https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=600&q=85"),
    p("Dry Fruits & Nuts","Dried Turkish Apricots","Plump, chewy dried apricots — high in Vitamin A and potassium.","DryFruitWala","250 g",220,0,110,"https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=85"),
    p("Dry Fruits & Nuts","Happilo Premium Mixed Nuts","Power-packed mix of almonds, cashews, walnuts, pistachios and raisins.","Happilo","200 g",340,15,120,"https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?w=600&q=85"),
    p("Dry Fruits & Nuts","Roasted Peanuts (Salted)","Crunchy, lightly salted roasted peanuts — a budget-friendly protein powerhouse.","HarvestGold","500 g",80,0,300,"https://images.unsplash.com/photo-1567892737950-30c4db37cd89?w=600&q=85"),
    p("Dry Fruits & Nuts","Sunflower Seeds (Roasted)","Crunchy roasted sunflower seeds — great for topping salads and yogurt.","SunSeed","200 g",95,0,150,"https://images.unsplash.com/photo-1591771612040-a1bc1c9b6ab2?w=600&q=85"),
    p("Dry Fruits & Nuts","Chia Seeds","Super-seeds with Omega-3, fibre and protein. Soak overnight or add to smoothies.","OrganicBharat","250 g",180,10,130,"https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?w=600&q=85"),

    // ── SPICES & MASALA (12) ─────────────────────────────────
    p("Spices & Masala","Haldi (Turmeric Powder)","Pure ground turmeric with high curcumin content. Bright golden colour and earthy flavour.","Catch","200 g",75,0,300,"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=85"),
    p("Spices & Masala","Lal Mirch (Red Chilli Powder)","Vibrant Guntur red chilli powder — medium heat with rich red colour.","Catch","200 g",80,0,280,"https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&q=85"),
    p("Spices & Masala","Dhania (Coriander Powder)","Freshly ground coriander powder — mild, citrusy and essential for gravies.","MDH","200 g",60,0,260,"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=85"),
    p("Spices & Masala","Whole Jeera (Cumin Seeds)","Prime grade whole cumin seeds — nutty, warm and the foundation of Indian tadka.","Everest","100 g",70,0,250,"https://images.unsplash.com/photo-1599909627600-aac4dc3c6aea?w=600&q=85"),
    p("Spices & Masala","Kali Mirch (Black Pepper)","Bold, pungent ground black pepper — freshly milled from Malabar coast peppercorns.","MDH","100 g",95,0,220,"https://images.unsplash.com/photo-1599909627600-aac4dc3c6aea?w=600&q=85"),
    p("Spices & Masala","Rai (Mustard Seeds)","Small, round black mustard seeds — the starting point of every South Indian dish.","Catch","100 g",45,0,280,"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=85"),
    p("Spices & Masala","MDH Garam Masala","The iconic MDH blend of 14 whole spices — the finishing masala for every curry.","MDH","100 g",90,5,300,"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=85"),
    p("Spices & Masala","Everest Kitchen King Masala","All-in-one masala blend — rich, aromatic and versatile for vegetables and paneer.","Everest","100 g",80,0,250,"https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&q=85"),
    p("Spices & Masala","Laung (Cloves)","Whole cloves with strong, sweet-spicy aroma. Used in biryani, chai and garam masala.","Organic India","50 g",120,0,180,"https://images.unsplash.com/photo-1599909627600-aac4dc3c6aea?w=600&q=85"),
    p("Spices & Masala","Elaichi (Green Cardamom)","Fragrant whole green cardamom pods — the queen of spices. Used in chai, biryani and halwa.","Organic India","50 g",150,0,160,"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=85"),
    p("Spices & Masala","Everest Chole Masala","Perfect blend for restaurant-style Punjabi chole — robust, tangy and deeply aromatic.","Everest","100 g",80,0,230,"https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&q=85"),
    p("Spices & Masala","Hing (Asafoetida) Premium","Pure single-strength asafoetida — the secret behind depth in dal tadka and sabzis.","Catch","50 g",85,0,200,"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=85"),

    // ── OILS & GHEE (12) ─────────────────────────────────────
    p("Oils & Ghee","Fortune Sunflower Oil","Light, refined sunflower oil with high smoke point. Ideal for deep-frying and everyday cooking.","Fortune","1 litre",175,10,200,"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=85"),
    p("Oils & Ghee","Dhara Cold-Pressed Mustard Oil","Kachi Ghani cold-pressed mustard oil — robust, pungent and essential for Indian dishes.","Dhara","1 litre",195,5,180,"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=85"),
    p("Oils & Ghee","Figaro Extra Virgin Olive Oil","Cold-pressed Spanish extra virgin olive oil — fruity, peppery. Ideal for salads.","Figaro","500 ml",580,0,100,"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=85"),
    p("Oils & Ghee","Tirupati Groundnut Oil","Traditional cold-pressed groundnut oil — nutty flavour, high smoke point.","Tirupati","1 litre",220,0,150,"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=85"),
    p("Oils & Ghee","Fortune Rice Bran Oil","Light, healthy rice bran oil with oryzanol — ideal for heart health.","Fortune","1 litre",185,0,140,"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=85"),
    p("Oils & Ghee","Nature Fresh Soybean Oil","Refined soybean oil — light in colour with a neutral taste. Budget-friendly.","Nature Fresh","1 litre",165,5,160,"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=85"),
    p("Oils & Ghee","Til (Sesame) Oil Cold-Pressed","Aromatic cold-pressed sesame oil — used in South Indian tadka and Korean cooking.","Idhayam","500 ml",310,10,90,"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=85"),
    p("Oils & Ghee","Parachute Coconut Oil","Pure, cold-pressed coconut oil — fragrant and versatile for cooking and hair care.","Parachute","500 ml",280,0,200,"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=85"),
    p("Oils & Ghee","Patanjali Cow Ghee","Pure desi cow ghee made by the traditional bilona method. Golden, granular, aromatic.","Patanjali","500 ml",420,0,180,"https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=85"),
    p("Oils & Ghee","Amul Pure Desi Ghee (1 kg Tin)","India's bestselling cow ghee in a classic tin — made from fresh cream by Amul.","Amul","1 kg (tin)",680,5,120,"https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=85"),
    p("Oils & Ghee","Oleev Active Olive Pomace Oil","Budget-friendly olive pomace oil with high smoke point — great for Indian cooking.","Oleev","1 litre",380,10,110,"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=85"),
    p("Oils & Ghee","Freedom Refined Sunflower Oil (5L)","Economy 5-litre pack — light, cholesterol-free. Perfect for households that cook in bulk.","Freedom","5 litre",820,8,80,"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=85"),
  ];
}

// ─── Main ────────────────────────────────────────────────────
async function runCatalogSeeder() {
  const client = await pool.connect();
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   Kisaan Kart — Production Catalog Seeder       ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  try {
    await client.query("BEGIN");

    // Phase 1: Safe cleanup
    console.log("📦 Phase 1: Cleaning up old products...");
    const existing = await client.query("SELECT id FROM products");
    const ids = existing.rows.map(r => r.id);
    console.log(`   Found ${ids.length} existing products.`);

    if (ids.length > 0) {
      const idList = ids.join(",");
      const c1 = await client.query(`DELETE FROM cart WHERE product_id IN (${idList})`);
      const c2 = await client.query(`DELETE FROM wishlist WHERE product_id IN (${idList})`);
      const c3 = await client.query(`DELETE FROM reviews WHERE product_id IN (${idList})`);
      console.log(`   ✓ Removed: ${c1.rowCount} cart rows, ${c2.rowCount} wishlist rows, ${c3.rowCount} reviews`);
      // Preserve order_items by nullifying the FK instead of deleting
      const hasCol = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='order_items' AND column_name='product_id'`);
      if (hasCol.rows.length > 0) {
        const c4 = await client.query(`UPDATE order_items SET product_id = NULL WHERE product_id IN (${idList})`);
        console.log(`   ✓ Preserved order_items (nullified product_id for ${c4.rowCount} rows)`);
      }
      const c5 = await client.query("DELETE FROM products");
      console.log(`   ✓ Deleted ${c5.rowCount} products`);
    }

    // Phase 2: Upsert categories
    console.log("\n🏷️  Phase 2: Upserting categories...");
    const cm = {};
    for (const cat of CATEGORIES) {
      const ex = await client.query("SELECT id FROM categories WHERE name = $1", [cat.name]);
      if (ex.rows.length > 0) {
        cm[cat.name] = ex.rows[0].id;
        console.log(`   ↩  Exists: "${cat.name}" (id=${ex.rows[0].id})`);
      } else {
        const r = await client.query(
          `INSERT INTO categories (name, description, image_url, sort_order, is_active) VALUES ($1,$2,$3,$4,true) RETURNING id`,
          [cat.name, cat.description, cat.image_url, cat.sort_order]
        );
        cm[cat.name] = r.rows[0].id;
        console.log(`   ✓  Created: "${cat.name}" (id=${r.rows[0].id})`);
      }
    }

    // Phase 3: Insert products
    console.log("\n🛒 Phase 3: Inserting 120 real grocery products...");
    const products = buildProducts(cm);
    const now = new Date();
    let inserted = 0, skipped = 0;
    const catCount = {};

    for (let i = 0; i < products.length; i++) {
      const pr = products[i];
      if (!pr.category_id) { console.warn(`   ⚠  No category_id for "${pr.name}" — skipped.`); skipped++; continue; }
      const daysAgo = Math.floor((products.length - i) * (180 / products.length));
      const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      await client.query(
        `INSERT INTO products (name,description,price,discount_price,stock,image_url,category_id,brand,unit,is_available,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [pr.name, pr.description, pr.price, pr.discount_price, pr.stock, pr.image_url,
         pr.category_id, pr.brand, pr.unit, pr.is_available, createdAt.toISOString()]
      );
      inserted++;
      const catName = Object.keys(cm).find(k => cm[k] === pr.category_id) || "Unknown";
      catCount[catName] = (catCount[catName] || 0) + 1;
    }

    await client.query("COMMIT");

    // Summary
    console.log(`\n✅ Done! Inserted: ${inserted} products | Skipped: ${skipped}`);
    console.log("\n   Products per category:");
    for (const [cat, count] of Object.entries(catCount)) {
      console.log(`   ${count >= 10 ? "✅" : "⚠️ "} ${cat}: ${count}`);
    }

    // Validation
    console.log("\n🔍 Final validation:");
    const tot  = await pool.query("SELECT COUNT(*) FROM products");
    const zerp = await pool.query("SELECT COUNT(*) FROM products WHERE price <= 0");
    const noim = await pool.query("SELECT COUNT(*) FROM products WHERE image_url IS NULL OR image_url=''");
    const noca = await pool.query("SELECT COUNT(*) FROM products WHERE category_id IS NULL");
    console.log(`   Total products : ${tot.rows[0].count}`);
    console.log(`   ₹0 priced      : ${zerp.rows[0].count} ${zerp.rows[0].count > 0 ? "❌" : "✅"}`);
    console.log(`   Missing images : ${noim.rows[0].count} ${noim.rows[0].count > 0 ? "❌" : "✅"}`);
    console.log(`   No category    : ${noca.rows[0].count} ${noca.rows[0].count > 0 ? "❌" : "✅"}`);

    const breakdown = await pool.query(`
      SELECT c.name, COUNT(p.id) AS cnt FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name ORDER BY c.sort_order
    `);
    console.log("\n   Category breakdown:");
    for (const row of breakdown.rows) {
      console.log(`   ${row.cnt >= 10 ? "✅" : "⚠️ "} ${row.name}: ${row.cnt} products`);
    }

    console.log("\n🚀 Database ready. Launch the Flutter app!\n");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ SEEDER FAILED — all changes rolled back.");
    console.error("   Error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runCatalogSeeder();
