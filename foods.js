/* Healthy Living - food calorie estimator.
 * Type what you ate ("2 slices bread with omelette and guacamole", "rice and fish curry", "3 chapatis with dal")
 * and get a consistent estimate. Values are typical home portions, so expect roughly +/- 20%.
 * Each row: [display name, kcal per unit, unit, aliases separated by |, default quantity when none is typed]
 * Units "bowl", "cup", "plate", "glass" and "serving" scale with words like plate, cup or tbsp; "piece" and "slice" are counted.
 */
'use strict';

const FOOD_TABLE = [
  // Breads and grains
  ['bread', 80, 'slice', 'bread|toast|white bread|brown bread|wheat bread|multigrain bread|bread slice|sourdough', 2],
  ['chapati', 110, 'piece', 'chapati|chapathi|roti|phulka|fulka|rotli', 2],
  ['plain paratha', 200, 'piece', 'paratha|parotta|plain paratha', 1],
  ['aloo paratha', 290, 'piece', 'aloo paratha|potato paratha', 1],
  ['paneer paratha', 320, 'piece', 'paneer paratha', 1],
  ['gobi paratha', 260, 'piece', 'gobi paratha|methi paratha|mooli paratha', 1],
  ['naan', 260, 'piece', 'naan|nan', 1],
  ['butter naan', 320, 'piece', 'butter naan|garlic naan', 1],
  ['puri', 100, 'piece', 'puri|poori', 3],
  ['bhatura', 300, 'piece', 'bhatura|bhature', 1],
  ['plain dosa', 170, 'piece', 'dosa|plain dosa|dosai', 1],
  ['masala dosa', 350, 'piece', 'masala dosa', 1],
  ['onion dosa', 210, 'piece', 'onion dosa|rava dosa|set dosa', 1],
  ['idli', 40, 'piece', 'idli|idly', 3],
  ['medu vada', 140, 'piece', 'vada|medu vada|vadai|vadas', 2],
  ['uttapam', 220, 'piece', 'uttapam|uthappam', 1],
  ['appam', 120, 'piece', 'appam|hoppers', 2],
  ['upma', 250, 'bowl', 'upma|rava upma', 1],
  ['poha', 250, 'bowl', 'poha|aval', 1],
  ['pongal', 300, 'bowl', 'pongal|ven pongal', 1],
  ['rice', 200, 'cup', 'rice|white rice|steamed rice|plain rice|basmati rice|jeera rice', 1],
  ['brown rice', 215, 'cup', 'brown rice', 1],
  ['chicken biryani', 500, 'plate', 'biryani|chicken biryani', 1],
  ['mutton biryani', 560, 'plate', 'mutton biryani|lamb biryani|goat biryani', 1],
  ['veg biryani', 400, 'plate', 'veg biryani|vegetable biryani|pulao|pulav|veg pulao', 1],
  ['egg biryani', 450, 'plate', 'egg biryani', 1],
  ['fish biryani', 480, 'plate', 'fish biryani|prawn biryani', 1],
  ['fried rice', 450, 'plate', 'fried rice|chicken fried rice|egg fried rice|veg fried rice', 1],
  ['curd rice', 250, 'bowl', 'curd rice|thayir sadam|yogurt rice', 1],
  ['lemon rice', 280, 'bowl', 'lemon rice|tamarind rice|puliyogare|coconut rice', 1],
  ['sambar rice', 300, 'bowl', 'sambar rice|bisi bele bath', 1],
  ['khichdi', 280, 'bowl', 'khichdi|khichri', 1],
  ['pasta', 350, 'plate', 'pasta|spaghetti|penne|macaroni|noodle pasta', 1],
  ['mac and cheese', 400, 'cup', 'mac and cheese|mac n cheese', 1],
  ['noodles', 400, 'plate', 'noodles|hakka noodles|chow mein|ramen|lo mein', 1],
  ['instant noodles', 350, 'serving', 'maggi|instant noodles|cup noodles|top ramen', 1],
  ['oatmeal', 160, 'bowl', 'oats|oatmeal|porridge', 1],
  ['cereal with milk', 220, 'bowl', 'cereal|cornflakes|corn flakes|muesli', 1],
  ['granola', 300, 'cup', 'granola', 0.5],
  ['quinoa', 220, 'cup', 'quinoa', 1],
  ['bagel', 280, 'piece', 'bagel', 1],
  ['croissant', 230, 'piece', 'croissant', 1],
  ['muffin', 400, 'piece', 'muffin', 1],
  ['pancake', 90, 'piece', 'pancake|hotcake', 2],
  ['waffle', 220, 'piece', 'waffle', 1],
  ['tortilla', 120, 'piece', 'tortilla', 1],
  ['pita bread', 170, 'piece', 'pita|pita bread', 1],
  ['bun', 150, 'piece', 'bun|pav|dinner roll|roll', 1],

  // Fast food and mixed dishes
  ['sandwich', 350, 'piece', 'sandwich|sub', 1],
  ['burger', 500, 'piece', 'burger|hamburger|veggie burger', 1],
  ['cheeseburger', 550, 'piece', 'cheeseburger', 1],
  ['pizza', 285, 'slice', 'pizza|pizza slice', 2],
  ['burrito', 600, 'piece', 'burrito', 1],
  ['taco', 170, 'piece', 'taco', 2],
  ['wrap', 380, 'piece', 'wrap|kathi roll|frankie|shawarma', 1],
  ['french fries', 365, 'serving', 'fries|french fries|chips portion', 1],
  ['momos', 35, 'piece', 'momo|momos|dumpling|dim sum', 6],

  // Eggs, meat, fish
  ['egg', 75, 'piece', 'egg|boiled egg|hard boiled egg|poached egg', 1],
  ['fried egg', 90, 'piece', 'fried egg|sunny side up|egg fry', 1],
  ['omelette', 95, 'egg', 'omelette|omelet|egg omelette|egg omelet|masala omelette', 2],
  ['scrambled eggs', 100, 'egg', 'scrambled egg|scrambled eggs|egg bhurji|anda bhurji', 2],
  ['egg curry', 300, 'bowl', 'egg curry|egg masala|anda curry', 1],
  ['chicken', 250, 'serving', 'chicken|grilled chicken|chicken breast|roast chicken', 1],
  ['chicken curry', 300, 'bowl', 'chicken curry|chicken masala|chettinad chicken|chicken gravy|kadai chicken', 1],
  ['butter chicken', 450, 'bowl', 'butter chicken|chicken makhani|chicken tikka masala', 1],
  ['tandoori chicken', 260, 'piece', 'tandoori chicken|chicken leg|chicken thigh', 1],
  ['chicken tikka', 300, 'serving', 'chicken tikka|chicken kebab|seekh kebab|kebab', 1],
  ['chicken 65', 350, 'serving', 'chicken 65|chilli chicken|chicken manchurian|chicken fry', 1],
  ['fried chicken', 300, 'piece', 'fried chicken|chicken nugget serving|kfc', 2],
  ['fish', 200, 'piece', 'fish|fish piece|fish fillet', 1],
  ['fish curry', 250, 'bowl', 'fish curry|fish gravy|fish moilee|meen curry|fish kulambu', 1],
  ['fried fish', 230, 'piece', 'fried fish|fish fry|tawa fish|fish tawa fry', 1],
  ['grilled fish', 180, 'piece', 'grilled fish|baked fish|steamed fish', 1],
  ['salmon', 350, 'piece', 'salmon|salmon fillet', 1],
  ['tuna', 150, 'serving', 'tuna|canned tuna', 1],
  ['prawns', 200, 'serving', 'prawn|prawns|shrimp|prawn fry', 1],
  ['prawn curry', 250, 'bowl', 'prawn curry|shrimp curry|prawn masala', 1],
  ['mutton curry', 400, 'bowl', 'mutton|mutton curry|lamb curry|goat curry|rogan josh|mutton gravy', 1],
  ['keema', 350, 'bowl', 'keema|kheema|minced meat', 1],
  ['beef steak', 500, 'piece', 'steak|beef|beef steak', 1],
  ['pork', 300, 'serving', 'pork|pork chop|ham', 1],
  ['bacon', 45, 'slice', 'bacon', 3],
  ['sausage', 180, 'piece', 'sausage|hot dog', 1],

  // Vegetarian protein
  ['paneer', 265, 'serving', 'paneer|cottage cheese', 1],
  ['paneer butter masala', 400, 'bowl', 'paneer butter masala|shahi paneer|paneer makhani|kadai paneer|paneer masala', 1],
  ['palak paneer', 300, 'bowl', 'palak paneer|saag paneer', 1],
  ['paneer tikka', 300, 'serving', 'paneer tikka', 1],
  ['tofu', 145, 'serving', 'tofu', 1],
  ['dal', 180, 'bowl', 'dal|daal|dhal|lentils|lentil|moong dal|toor dal|masoor dal|dal fry|dal tadka', 1],
  ['dal makhani', 350, 'bowl', 'dal makhani|dal makhni', 1],
  ['sambar', 150, 'bowl', 'sambar|sambhar', 1],
  ['rasam', 60, 'bowl', 'rasam', 1],
  ['rajma', 250, 'bowl', 'rajma|kidney beans|red beans', 1],
  ['chole', 300, 'bowl', 'chole|chana masala|chana|chickpeas|chickpea curry|kabuli chana', 1],
  ['kadhi', 200, 'bowl', 'kadhi|kadi|mor kuzhambu', 1],
  ['sprouts', 100, 'bowl', 'sprouts|sprout salad|moong sprouts', 1],
  ['beans', 230, 'cup', 'baked beans|black beans|pinto beans', 1],

  // Vegetables and sides
  ['vegetable curry', 150, 'bowl', 'sabzi|sabji|subzi|vegetable|vegetables|veg curry|vegetable curry|mixed veg|poriyal|thoran|avial|kootu|veggies', 1],
  ['potato curry', 200, 'bowl', 'aloo|potato|aloo sabzi|potato curry|aloo fry|potato fry|jeera aloo', 1],
  ['aloo gobi', 180, 'bowl', 'aloo gobi|gobi|cauliflower', 1],
  ['bhindi', 150, 'bowl', 'bhindi|okra|lady finger|ladies finger', 1],
  ['baingan', 150, 'bowl', 'baingan|brinjal|eggplant|baingan bharta', 1],
  ['saag', 180, 'bowl', 'saag|sarson ka saag|spinach|palak', 1],
  ['salad', 80, 'bowl', 'salad|green salad|cucumber|kachumber|cucumber salad', 1],
  ['caesar salad', 350, 'bowl', 'caesar salad|chicken salad', 1],
  ['soup', 120, 'bowl', 'soup|tomato soup|vegetable soup|clear soup', 1],
  ['raita', 100, 'bowl', 'raita', 1],
  ['curd', 150, 'cup', 'curd|yogurt|yoghurt|dahi|plain yogurt', 1],
  ['greek yogurt', 150, 'cup', 'greek yogurt', 1],
  ['avocado', 240, 'piece', 'avocado', 0.5],
  ['guacamole', 25, 'tbsp', 'guacamole|guac', 4],
  ['hummus', 35, 'tbsp', 'hummus', 2],
  ['papad', 40, 'piece', 'papad|papadum|appalam', 1],
  ['pickle', 20, 'tbsp', 'pickle|achar', 1],
  ['chutney', 30, 'tbsp', 'chutney|coconut chutney|mint chutney', 2],

  // Dairy, fats and drinks
  ['milk', 150, 'glass', 'milk|glass of milk|whole milk', 1],
  ['tea with milk', 80, 'cup', 'tea|chai|masala chai|milk tea', 1],
  ['black coffee', 5, 'cup', 'black coffee|espresso|americano|black tea|green tea', 1],
  ['coffee with milk', 70, 'cup', 'coffee|filter coffee|coffee with milk', 1],
  ['latte', 190, 'cup', 'latte|cafe latte|mocha', 1],
  ['cappuccino', 120, 'cup', 'cappuccino|flat white', 1],
  ['cheese', 100, 'slice', 'cheese|cheese slice|cheddar', 1],
  ['butter', 100, 'tbsp', 'butter', 1],
  ['ghee', 40, 'tsp', 'ghee', 1],
  ['buttermilk', 60, 'glass', 'buttermilk|chaas|chaach|neer mor', 1],
  ['sweet lassi', 250, 'glass', 'lassi|sweet lassi|mango lassi', 1],
  ['fruit juice', 120, 'glass', 'juice|orange juice|apple juice|fruit juice', 1],
  ['soda', 140, 'can', 'soda|coke|pepsi|soft drink|cola|sprite', 1],
  ['beer', 150, 'bottle', 'beer|lager', 1],
  ['wine', 125, 'glass', 'wine|red wine|white wine', 1],
  ['spirits', 100, 'serving', 'whisky|whiskey|vodka|rum|gin|peg', 1],
  ['coconut water', 45, 'glass', 'coconut water|tender coconut', 1],
  ['smoothie', 250, 'glass', 'smoothie|milkshake|shake', 1],
  ['protein shake', 150, 'glass', 'protein shake|protein', 1],

  // Fruit
  ['apple', 95, 'piece', 'apple', 1],
  ['banana', 105, 'piece', 'banana', 1],
  ['orange', 60, 'piece', 'orange|mosambi|sweet lime|mandarin', 1],
  ['mango', 200, 'piece', 'mango', 1],
  ['grapes', 100, 'cup', 'grapes', 1],
  ['papaya', 60, 'cup', 'papaya', 1],
  ['watermelon', 45, 'cup', 'watermelon|melon|cantaloupe', 1],
  ['berries', 70, 'cup', 'berries|strawberries|blueberries', 1],
  ['pear', 100, 'piece', 'pear', 1],
  ['guava', 70, 'piece', 'guava', 1],
  ['pomegranate', 145, 'cup', 'pomegranate', 1],
  ['dates', 66, 'piece', 'dates|khajur', 2],
  ['fruit bowl', 120, 'bowl', 'fruit|fruits|fruit bowl|fruit salad|cut fruit', 1],

  // Snacks and sweets
  ['samosa', 260, 'piece', 'samosa', 1],
  ['pakora', 60, 'piece', 'pakora|pakoda|bhaji|bajji|bonda|fritters', 5],
  ['bhel puri', 250, 'plate', 'bhel|bhel puri|sev puri|chaat|papdi chaat', 1],
  ['pani puri', 200, 'plate', 'pani puri|golgappa|puchka', 1],
  ['vada pav', 300, 'piece', 'vada pav', 1],
  ['pav bhaji', 450, 'plate', 'pav bhaji', 1],
  ['dhokla', 80, 'piece', 'dhokla|khaman', 2],
  ['kachori', 190, 'piece', 'kachori', 1],
  ['murukku', 150, 'serving', 'murukku|chakli|namkeen|mixture|bhujia|sev', 1],
  ['biscuit', 50, 'piece', 'biscuit|cookie|cracker|rusk', 2],
  ['chips', 150, 'serving', 'chips|crisps|lays', 1],
  ['nuts', 170, 'handful', 'nuts|almonds|peanuts|cashews|walnuts|pistachios|mixed nuts|trail mix', 1],
  ['peanut butter', 95, 'tbsp', 'peanut butter', 2],
  ['popcorn', 200, 'serving', 'popcorn', 1],
  ['chocolate', 230, 'piece', 'chocolate|chocolate bar|candy bar', 1],
  ['ice cream', 140, 'serving', 'ice cream|icecream|kulfi', 1],
  ['cake', 350, 'slice', 'cake|pastry|brownie', 1],
  ['donut', 250, 'piece', 'donut|doughnut', 1],
  ['gulab jamun', 150, 'piece', 'gulab jamun|rasgulla|rasagulla', 2],
  ['jalebi', 150, 'piece', 'jalebi', 2],
  ['ladoo', 180, 'piece', 'ladoo|laddu|laddoo|barfi|burfi|peda|mysore pak', 1],
  ['kheer', 250, 'bowl', 'kheer|payasam|payasa|rice pudding', 1],
  ['halwa', 300, 'bowl', 'halwa|kesari|sheera|gajar halwa', 1],
  ['energy bar', 200, 'piece', 'energy bar|protein bar|granola bar', 1]
];

// Size of each unit in cups, so "a plate of rice" or "2 tbsp peanut butter" scale correctly.
const UNIT_CUPS = {
  bowl: 1, katori: 0.75, cup: 1, mug: 1, glass: 1, plate: 1.5, tbsp: 1 / 16, tablespoon: 1 / 16, spoon: 1 / 16,
  tsp: 1 / 48, teaspoon: 1 / 48, scoop: 0.5, ladle: 0.5, handful: 0.25
};
const UNIT_FACTORS = Object.assign({ serving: null, portion: null, helping: null, can: null, bottle: null }, UNIT_CUPS);
const PIECE_UNITS = new Set(['slice', 'piece', 'pc', 'pcs', 'nos', 'no', 'each', 'whole']);
const SIZE_FACTORS = { small: 0.7, little: 0.6, medium: 1, regular: 1, large: 1.4, big: 1.4, huge: 1.8, extra: 1 };
const NUMBER_WORDS = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, couple: 2, few: 3, several: 3, dozen: 12, half: 0.5, quarter: 0.25
};
const FILLER = new Set(['of', 'with', 'and', 'some', 'my', 'the', 'homemade', 'fresh', 'cooked', 'plain', 'side', 'hot',
  'cold', 'little', 'bit', 'spicy', 'home', 'made', 'leftover', 'veg', 'nonveg', 'non', 'had', 'ate', 'for', 'in', 'on',
  'at', 'more', 'less', 'like', 'about', 'around', 'approx', 'x', 'pieces', 'only', 'just', 'also', 'then', 'to']);

function singularWord(w) {
  if (w.length < 4) return w;
  if (/ies$/.test(w)) return w.slice(0, -3) + 'y';
  if (/(ches|shes|xes|oes|sses)$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w) && !/(ss|us)$/.test(w)) return w.slice(0, -1);
  return w;
}

function foodTokens(text) {
  return String(text).toLowerCase()
    .replace(/(\d)\s*\/\s*(\d)/g, '$1/$2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/[^a-z0-9./\s]/g, ' ')
    .split(/\s+/).filter(Boolean).map(singularWord);
}

let FOOD_INDEX = null;
function buildFoodIndex(custom) {
  const entries = [];
  FOOD_TABLE.forEach(([name, kcal, unit, aliases, def]) => {
    aliases.split('|').forEach(a => entries.push({ toks: foodTokens(a), food: { name, kcal, unit, def: def || 1 } }));
  });
  (custom || []).forEach(c => {
    entries.push({ toks: foodTokens(c.name), food: { name: c.name, kcal: Number(c.kcal) || 0, unit: 'serving', def: 1, custom: true }, custom: true });
  });
  // Longest alias first; your own foods win a tie.
  entries.sort((x, y) => (y.toks.length - x.toks.length) || ((y.custom ? 1 : 0) - (x.custom ? 1 : 0)));
  FOOD_INDEX = entries;
  return entries;
}

function parseNumberToken(t) {
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  if (/^\d+\/\d+$/.test(t)) { const [a, b] = t.split('/').map(Number); return b ? a / b : null; }
  return Object.prototype.hasOwnProperty.call(NUMBER_WORDS, t) ? NUMBER_WORDS[t] : null;
}

// Look at the words just before a matched food for a quantity, a unit and a size.
function readQuantity(words, food, after) {
  let nums = [], unit = null, size = 1;
  words.forEach(w => {
    const n = parseNumberToken(w);
    if (n != null) nums.push({ w, n });
    else if (w in UNIT_FACTORS || PIECE_UNITS.has(w)) unit = w;
    else if (SIZE_FACTORS[w] != null) size *= SIZE_FACTORS[w];
  });
  // "a" and "an" only count when no other number is given ("half a bowl" = 0.5, "a bowl" = 1).
  // "chapatis (3)" or "dosa x2": a number right after the food counts when none comes before it.
  if (!nums.length && after) {
    const n = after.map(parseNumberToken).find(v => v != null);
    if (n != null) nums.push({ w: String(n), n });
  }
  const real = nums.filter(x => x.w !== 'a' && x.w !== 'an');
  const used = real.length ? real : nums;
  let qty = used.length ? used.reduce((p, x) => p * x.n, 1) : null;
  let factor = 1;
  if (unit && UNIT_CUPS[unit] != null && UNIT_CUPS[food.unit] != null) factor = UNIT_CUPS[unit] / UNIT_CUPS[food.unit];
  else if (unit === 'plate' && food.unit === 'serving') factor = 1.5;
  if (qty == null) qty = unit ? 1 : food.def;
  return { qty: qty * factor * size, shownQty: qty, unit, factor, size };
}

function estimateMeal(text, custom) {
  const index = buildFoodIndex(custom);
  const segments = String(text || '').split(/,|;|\+|&|\n|\bwith\b|\band\b|\bplus\b/i).map(s => s.trim()).filter(Boolean);
  const items = [], unknown = [];
  segments.forEach(seg => {
    const toks = foodTokens(seg);
    if (!toks.length) return;
    const used = new Array(toks.length).fill(false);
    const found = [];
    index.forEach(entry => {
      const L = entry.toks.length;
      if (!L) return;
      for (let i = 0; i + L <= toks.length; i++) {
        let ok = true;
        for (let j = 0; j < L; j++) if (used[i + j] || toks[i + j] !== entry.toks[j]) { ok = false; break; }
        if (ok) {
          for (let j = 0; j < L; j++) used[i + j] = true;
          found.push({ start: i, end: i + L, food: entry.food });
        }
      }
    });
    if (!found.length) {
      const meaningful = toks.filter(t => !FILLER.has(t) && parseNumberToken(t) == null && !(t in UNIT_FACTORS) && !PIECE_UNITS.has(t) && SIZE_FACTORS[t] == null);
      if (meaningful.length) unknown.push(seg);
      return;
    }
    found.sort((a, b) => a.start - b.start);
    let prevEnd = 0;
    found.forEach((f, i) => {
      const before = toks.slice(prevEnd, f.start);
      const next = found[i + 1] ? found[i + 1].start : toks.length;
      const after = toks.slice(f.end, Math.min(next, f.end + 2)).filter(t => t !== 'a' && t !== 'an');
      const q = readQuantity(before, f.food, i === found.length - 1 ? after : null);
      prevEnd = f.end;
      items.push({ name: f.food.name, qty: q.qty, kcal: Math.round(f.food.kcal * q.qty), unit: f.food.unit, custom: !!f.food.custom });
    });
  });
  const total = Math.round(items.reduce((s, x) => s + x.kcal, 0) / 10) * 10;
  return { total, items, unknown };
}

function describeItem(it) {
  const q = Math.round(it.qty * 100) / 100;
  if (it.unit === 'egg') return `${q}-egg ${it.name} (${it.kcal})`;
  const plural = { glass: 'glasses', tsp: 'tsp', tbsp: 'tbsp', half: 'halves', handful: 'handfuls' };
  const unit = it.unit === 'piece' ? '' : ` ${q === 1 ? it.unit : (plural[it.unit] || it.unit + 's')}`;
  return `${q}${unit} ${it.name} (${it.kcal})`;
}

if (typeof module !== 'undefined') module.exports = { estimateMeal, describeItem, FOOD_TABLE };
