(function (root) {
  'use strict';
  const pick = (a, k) => (Array.isArray(a) ? a[k % a.length] : a);
  function step3(r) { let h = Math.floor(r * 1.7320508); while (h * h < 3 * r * r) h++; return h; }
  function rows(p, x, y, widths, dir) {
    const out = [], h = step3(p.r), sgn = dir === 'S' || dir === 'E' ? 1 : -1, vert = dir === 'S' || dir === 'N';
    let k = 0;
    widths.forEach((n, row) => {
      for (let j = 0; j < n; j++) {
        const along = sgn * row * h, side = (2 * j - (n - 1)) * p.r;
        const b = { kind: p.kind, x: vert ? x + side : x + along, y: vert ? y + along : y + side, r: p.r, g: pick(p.g, k) };
        const v = pick(p.v, k);
        if (v !== undefined) b.variant = v;
        out.push(b); k++;
      }
    });
    return out;
  }
  const TRI10 = [1, 2, 3, 4], TRI6 = [1, 2, 3];
  const PLUSH = { kind: 'plush', r: 120, g: [220, 180, 260], v: ['bear', 'rabbit', 'dino'] };
  const BOOKS = { kind: 'books', r: 130, g: [600, 450, 700, 520], v: [0, 1, 2, 3] };
  const BOTTLE = { kind: 'bottle', r: 65, g: [500, 350, 450, 400], v: ['water', 'tea'] };
  const PILLOW = { kind: 'pillow', r: 150, g: [400, 350, 450], v: [0, 1, 2] };
  const SHOES = { kind: 'shoe', r: 110, g: [350, 300, 500, 400], v: ['sneaker', 'loafer', 'boot', 'geta'] };
  const LAYOUTS = [
    {
      id: 'ie', name: 'いつもの家', theme: '寝室 → 廊下 → 玄関', day: 1,
      medals: { gold: 20, silver: 45, bronze: 95 },
      w: 4600, h: 7600, wallT: 160,
      door: { x1: 2250, x2: 3550 },
      start: { x: 1100, y: 1500 },
      walls: [
        { x1: 0, y1: 3300, x2: 2400, y2: 3460 }, { x1: 3600, y1: 3300, x2: 4600, y2: 3460 },
        { x1: 0, y1: 5400, x2: 1100, y2: 5560 }, { x1: 2300, y1: 5400, x2: 4600, y2: 5560 },
      ],
      rects: [
        { kind: 'closet', x1: 1900, y1: 160, x2: 3100, y2: 600, face: 'S' },
        { kind: 'desk', x1: 3700, y1: 160, x2: 4440, y2: 760, face: 'S' },
        { kind: 'bookshelf', x1: 160, y1: 2760, x2: 1000, y2: 3300, face: 'N' },
        { kind: 'sofa', x1: 2800, y1: 4900, x2: 4000, y2: 5400, face: 'N' },
        { kind: 'shoebox', x1: 4040, y1: 5560, x2: 4440, y2: 6800, face: 'W' },
      ],
      circles: [
        { kind: 'plant', x: 380, y: 3680, r: 220 },
        { kind: 'kasa', x: 330, y: 7270, r: 170 },
      ],
      bodies: [
        { kind: 'cat', x: 3400, y: 4600, r: 220, g: 4000, variant: 'chatora' },
        { kind: 'chair', x: 3300, y: 1150, r: 260, g: 5000 },
        { kind: 'ball', x: 1900, y: 2650, r: 120, g: 400 },
        { kind: 'robot', x: 3900, y: 4000, r: 170, g: 3000 },
        ...rows(PLUSH, 3000, 2150, TRI10, 'S'),
        ...rows(BOOKS, 2200, 4200, [3], 'S'),
        ...rows(SHOES, 2900, 6400, TRI6, 'S'),
      ],
      rooms: [
        { name: '寝室', x1: 0, y1: 0, x2: 4600, y2: 3300, floor: 'oak', label: { x: 1700, y: 2950 } },
        { name: '廊下', x1: 0, y1: 3300, x2: 4600, y2: 5400, floor: 'hall', label: { x: 1200, y: 4600 } },
        { name: '', x1: 0, y1: 5400, x2: 4600, y2: 6300, floor: 'tile' },
        { name: '玄関', x1: 0, y1: 6300, x2: 4600, y2: 7600, floor: 'doma', label: { x: 1300, y: 6900 } },
      ],
      decor: [
        { kind: 'futon', x: 1100, y: 1500, w: 1300, h: 1800 },
        { kind: 'doormat', x: 2900, y: 6800, w: 900, h: 450 },
        { kind: 'window', side: 'N', a: 400, b: 1700 },
        { kind: 'window', side: 'E', a: 1300, b: 2700 },
        { kind: 'window', side: 'W', a: 4050, b: 5050 },
      ],
    },
    {
      id: 'apart', name: '1K のアパート', theme: 'せまくて家具だらけ', day: 2,
      medals: { gold: 15, silver: 40, bronze: 100 },
      w: 4600, h: 7600, wallT: 160,
      door: { x1: 600, x2: 1800 },
      start: { x: 1100, y: 1500 },
      walls: [
        { x1: 0, y1: 3900, x2: 3100, y2: 4060 }, { x1: 4200, y1: 3900, x2: 4600, y2: 4060 },
      ],
      rects: [
        { kind: 'closet', x1: 1800, y1: 160, x2: 3000, y2: 600, face: 'S' },
        { kind: 'table', x1: 2500, y1: 1600, x2: 3400, y2: 2400, face: 'S' },
        { kind: 'fridge', x1: 160, y1: 4060, x2: 800, y2: 4700, face: 'S' },
        { kind: 'kitchen', x1: 3840, y1: 4700, x2: 4440, y2: 6000, face: 'W' },
        { kind: 'table', x1: 1700, y1: 5000, x2: 2500, y2: 5700, face: 'S' },
        { kind: 'shoebox', x1: 4000, y1: 6400, x2: 4440, y2: 7440, face: 'W' },
      ],
      circles: [
        { kind: 'kasa', x: 330, y: 7270, r: 170 },
      ],
      bodies: [
        { kind: 'cushion', x: 2950, y: 2660, r: 260, g: 800 },
        { kind: 'cushion', x: 3660, y: 2050, r: 260, g: 800 },
        { kind: 'basket', x: 1300, y: 3300, r: 180, g: 1000, variant: 0 },
        { kind: 'chair', x: 1100, y: 5350, r: 260, g: 5000 },
        { kind: 'slipper', x: 2000, y: 6700, r: 100, g: 150 },
        { kind: 'slipper', x: 2200, y: 6750, r: 100, g: 150 },
        ...rows(PLUSH, 3650, 2950, TRI6, 'S'),
        ...rows({ ...BOTTLE, r: 70 }, 3170, 5350, [4], 'S'),
        ...rows(SHOES, 1200, 6550, TRI6, 'S'),
      ],
      rooms: [
        { name: '洋室', x1: 0, y1: 0, x2: 4600, y2: 3900, floor: 'oak', label: { x: 1800, y: 3350 } },
        { name: '台所', x1: 0, y1: 3900, x2: 4600, y2: 6300, floor: 'tile', label: { x: 2400, y: 4500 } },
        { name: '玄関', x1: 0, y1: 6300, x2: 4600, y2: 7600, floor: 'doma', label: { x: 2900, y: 6900 } },
      ],
      decor: [
        { kind: 'futon', x: 1100, y: 1500, w: 1300, h: 1800 },
        { kind: 'rug', x: 2950, y: 2000, w: 1600, h: 1400 },
        { kind: 'doormat', x: 1200, y: 6850, w: 900, h: 450 },
        { kind: 'window', side: 'N', a: 400, b: 1500 },
        { kind: 'window', side: 'E', a: 1200, b: 2600 },
        { kind: 'window', side: 'E', a: 4600, b: 5900 },
        { kind: 'window', side: 'W', a: 1200, b: 2400 },
      ],
    },
    {
      id: 'rouka', name: '長い廊下の家', theme: 'まっすぐ、長い。突き当たりに注意', day: 3,
      medals: { gold: 35, silver: 65, bronze: 125 },
      w: 4600, h: 7600, wallT: 160,
      door: { x1: 1000, x2: 2200 },
      start: { x: 1100, y: 1500 },
      walls: [
        { x1: 3160, y1: 0, x2: 3320, y2: 2600 }, { x1: 3160, y1: 3700, x2: 3320, y2: 6000 },
        { x1: 0, y1: 5840, x2: 3320, y2: 6000 },
      ],
      rects: [
        { kind: 'closet', x1: 1960, y1: 160, x2: 3160, y2: 600, face: 'S' },
        { kind: 'table', x1: 1300, y1: 4100, x2: 2100, y2: 4700, face: 'S' },
        { kind: 'sofa', x1: 1100, y1: 5240, x2: 2300, y2: 5840, face: 'N' },
        { kind: 'shoebox', x1: 160, y1: 6000, x2: 600, y2: 7000, face: 'E' },
      ],
      circles: [
        { kind: 'vase', x: 4270, y: 7270, r: 170 },
      ],
      bodies: [
        { kind: 'robot', x: 3880, y: 1300, r: 170, g: 3000 },
        { kind: 'ball', x: 3880, y: 5500, r: 120, g: 400 },
        { kind: 'cat', x: 3700, y: 6750, r: 220, g: 4000, variant: 'hachi' },
        ...rows(PLUSH, 2150, 2350, [1, 2], 'E'),
        ...rows({ ...BOTTLE, r: 60 }, 3880, 4650, TRI10, 'S'),
        ...rows({ ...SHOES, r: 100 }, 1600, 6500, TRI6, 'S'),
      ],
      rooms: [
        { name: '寝室', x1: 0, y1: 0, x2: 3160, y2: 5840, floor: 'oak', label: { x: 2200, y: 3300 } },
        { name: '廊下', x1: 3160, y1: 0, x2: 4600, y2: 5840, floor: 'hall', label: { x: 3880, y: 700 } },
        { name: '', x1: 0, y1: 5840, x2: 4600, y2: 6500, floor: 'tile' },
        { name: '玄関', x1: 0, y1: 6500, x2: 4600, y2: 7600, floor: 'doma', label: { x: 1100, y: 7100 } },
      ],
      decor: [
        { kind: 'futon', x: 1100, y: 1500, w: 1300, h: 1800 },
        { kind: 'rug', x: 1700, y: 4450, w: 1700, h: 1400 },
        { kind: 'rug', x: 3880, y: 4600, w: 600, h: 2200 },
        { kind: 'doormat', x: 1600, y: 6850, w: 900, h: 450 },
        { kind: 'window', side: 'N', a: 400, b: 1400 },
        { kind: 'window', side: 'E', a: 900, b: 2000 },
        { kind: 'window', side: 'E', a: 3800, b: 5000 },
        { kind: 'window', side: 'W', a: 1200, b: 2400 },
      ],
    },
    {
      id: 'washitsu', name: '和室とふすまの家', theme: 'ふすまのすき間をぬけて', day: 4,
      medals: { gold: 35, silver: 65, bronze: 110 },
      w: 4600, h: 7600, wallT: 160,
      door: { x1: 2100, x2: 3300 },
      start: { x: 1100, y: 1500 },
      walls: [
        { x1: 160, y1: 2700, x2: 2700, y2: 2760, kind: 'fusuma' }, { x1: 3800, y1: 2700, x2: 4440, y2: 2760, kind: 'fusuma' },
        { x1: 160, y1: 5460, x2: 850, y2: 5520, kind: 'fusuma' }, { x1: 2050, y1: 5460, x2: 4440, y2: 5520, kind: 'fusuma' },
      ],
      rects: [
        { kind: 'tansu', x1: 1900, y1: 160, x2: 2900, y2: 620, face: 'S' },
        { kind: 'closet', x1: 2900, y1: 160, x2: 4440, y2: 700, face: 'S' },
        { kind: 'kotatsu', x1: 2700, y1: 4150, x2: 3550, y2: 5000, face: 'S' },
        { kind: 'shoebox', x1: 4000, y1: 5520, x2: 4440, y2: 6600, face: 'W' },
      ],
      circles: [
        { kind: 'lamp', x: 4290, y: 2550, r: 150 },
        { kind: 'kasa', x: 330, y: 7270, r: 170 },
      ],
      bodies: [
        { kind: 'cushion', x: 3125, y: 3900, r: 250, g: 700 },
        { kind: 'cushion', x: 2450, y: 4575, r: 250, g: 700 },
        { kind: 'cushion', x: 3800, y: 4575, r: 250, g: 700 },
        { kind: 'basket', x: 3000, y: 6050, r: 180, g: 1000, variant: 1 },
        { kind: 'plush', x: 700, y: 2250, r: 120, g: 200, variant: 'rabbit' },
        ...rows({ ...PILLOW, r: 140 }, 2600, 1700, TRI6, 'S'),
        ...rows(BOOKS, 2250, 3220, TRI6, 'S'),
        ...rows({ ...SHOES, r: 100, v: ['geta', 'geta', 'sneaker', 'loafer'] }, 2700, 6650, TRI6, 'S'),
      ],
      rooms: [
        { name: '奥の間', x1: 0, y1: 0, x2: 4600, y2: 2730, floor: 'tatami', label: { x: 2600, y: 2200 } },
        { name: '茶の間', x1: 0, y1: 2730, x2: 4600, y2: 5490, floor: 'tatami', label: { x: 1200, y: 4300 } },
        { name: '板の間', x1: 0, y1: 5490, x2: 4600, y2: 6400, floor: 'oak', label: { x: 2400, y: 5950 } },
        { name: '玄関', x1: 0, y1: 6400, x2: 4600, y2: 7600, floor: 'doma', label: { x: 1300, y: 6950 } },
      ],
      decor: [
        { kind: 'futon', x: 1100, y: 1500, w: 1300, h: 1800 },
        { kind: 'doormat', x: 2700, y: 6950, w: 900, h: 450 },
        { kind: 'window', side: 'N', a: 400, b: 1700 },
        { kind: 'window', side: 'E', a: 1100, b: 2300 },
        { kind: 'window', side: 'W', a: 1200, b: 2400 },
        { kind: 'window', side: 'W', a: 3400, b: 4700 },
      ],
    },
    {
      id: 'neko', name: 'ねこが 3 匹いる家', theme: '戸口ごとに、ねこ', day: 5,
      medals: { gold: 30, silver: 50, bronze: 90 },
      w: 4600, h: 7600, wallT: 160,
      door: { x1: 1200, x2: 2400 },
      start: { x: 3500, y: 1500 },
      walls: [
        { x1: 0, y1: 3000, x2: 900, y2: 3160 }, { x1: 2200, y1: 3000, x2: 4600, y2: 3160 },
        { x1: 0, y1: 5300, x2: 2400, y2: 5460 }, { x1: 3700, y1: 5300, x2: 4600, y2: 5460 },
      ],
      rects: [
        { kind: 'closet', x1: 160, y1: 160, x2: 1400, y2: 600, face: 'S' },
        { kind: 'bookshelf', x1: 1400, y1: 160, x2: 2400, y2: 560, face: 'S' },
        { kind: 'sofa', x1: 800, y1: 4700, x2: 2000, y2: 5300, face: 'N' },
        { kind: 'shelf', x1: 3940, y1: 3160, x2: 4440, y2: 4100, face: 'W' },
        { kind: 'shoebox', x1: 4040, y1: 5460, x2: 4440, y2: 6600, face: 'W' },
      ],
      circles: [
        { kind: 'plant', x: 380, y: 2780, r: 220 },
        { kind: 'kasa', x: 330, y: 7270, r: 170 },
      ],
      bodies: [
        { kind: 'cat', x: 1250, y: 3080, r: 220, g: 4000, variant: 'chatora' },
        { kind: 'cat', x: 3350, y: 5380, r: 220, g: 4000, variant: 'kuro' },
        { kind: 'cat', x: 1650, y: 6900, r: 220, g: 4000, variant: 'mike' },
        { kind: 'ball', x: 3200, y: 4500, r: 120, g: 400 },
        { kind: 'box', x: 3300, y: 3700, r: 200, g: 1500 },
        ...rows(PLUSH, 2300, 2050, TRI6, 'S'),
        ...rows(BOTTLE, 2050, 3700, TRI6, 'S'),
        ...rows({ ...SHOES, r: 100 }, 2650, 6100, TRI6, 'S'),
      ],
      rooms: [
        { name: '寝室', x1: 0, y1: 0, x2: 4600, y2: 3000, floor: 'oak', label: { x: 2000, y: 2500 } },
        { name: 'リビング', x1: 0, y1: 3000, x2: 4600, y2: 5300, floor: 'oak', label: { x: 2300, y: 3650 } },
        { name: '', x1: 0, y1: 5300, x2: 4600, y2: 6100, floor: 'tile' },
        { name: '玄関', x1: 0, y1: 6100, x2: 4600, y2: 7600, floor: 'doma', label: { x: 3000, y: 6800 } },
      ],
      decor: [
        { kind: 'futon', x: 3500, y: 1500, w: 1300, h: 1800 },
        { kind: 'rug', x: 2000, y: 4100, w: 2000, h: 1100 },
        { kind: 'doormat', x: 1800, y: 6900, w: 900, h: 450 },
        { kind: 'window', side: 'N', a: 2700, b: 4000 },
        { kind: 'window', side: 'E', a: 900, b: 2200 },
        { kind: 'window', side: 'W', a: 1000, b: 2200 },
        { kind: 'window', side: 'W', a: 3600, b: 4600 },
      ],
    },
    {
      id: 'kutsu', name: '靴だらけの玄関の家', theme: '玄関が靴の海', day: 6,
      medals: { gold: 25, silver: 50, bronze: 110 },
      w: 4600, h: 7600, wallT: 160,
      door: { x1: 2700, x2: 3900 },
      start: { x: 3500, y: 1400 },
      walls: [
        { x1: 0, y1: 2900, x2: 2900, y2: 3060 }, { x1: 4000, y1: 2900, x2: 4600, y2: 3060 },
        { x1: 0, y1: 4700, x2: 600, y2: 4860 }, { x1: 1900, y1: 4700, x2: 4600, y2: 4860 },
      ],
      rects: [
        { kind: 'closet', x1: 160, y1: 160, x2: 1400, y2: 600, face: 'S' },
        { kind: 'desk', x1: 160, y1: 1400, x2: 760, y2: 2500, face: 'E' },
        { kind: 'bench', x1: 2300, y1: 4300, x2: 3500, y2: 4700, face: 'N' },
        { kind: 'shoebox', x1: 160, y1: 4860, x2: 600, y2: 6100, face: 'E' },
        { kind: 'shoebox', x1: 4040, y1: 4860, x2: 4440, y2: 6100, face: 'W' },
      ],
      circles: [
        { kind: 'plant', x: 4220, y: 3280, r: 220 },
        { kind: 'kasa', x: 330, y: 7270, r: 170 },
      ],
      bodies: [
        { kind: 'slipper', x: 1400, y: 7000, r: 100, g: 120 },
        { kind: 'slipper', x: 4000, y: 6900, r: 100, g: 120 },
        ...rows({ ...BOTTLE, r: 65 }, 3450, 2100, TRI6, 'S'),
        ...rows(SHOES, 2000, 5500, TRI10, 'S'),
        ...rows({ ...SHOES, r: 120, v: ['boot', 'sneaker', 'loafer'] }, 3300, 6450, TRI6, 'S'),
      ],
      rooms: [
        { name: '寝室', x1: 0, y1: 0, x2: 4600, y2: 2900, floor: 'oak', label: { x: 2000, y: 2400 } },
        { name: 'ホール', x1: 0, y1: 2900, x2: 4600, y2: 4700, floor: 'tile', label: { x: 1300, y: 3700 } },
        { name: '玄関', x1: 0, y1: 4700, x2: 4600, y2: 7600, floor: 'doma', label: { x: 1200, y: 6900 } },
      ],
      decor: [
        { kind: 'futon', x: 3500, y: 1400, w: 1300, h: 1800 },
        { kind: 'doormat', x: 3300, y: 6850, w: 900, h: 450 },
        { kind: 'window', side: 'N', a: 2600, b: 4000 },
        { kind: 'window', side: 'E', a: 800, b: 2000 },
        { kind: 'window', side: 'W', a: 3300, b: 4400 },
      ],
    },
    {
      id: 'hiroi', name: '家具の少ない広い家', theme: '広い。速い。でもドアは狭い', day: 0,
      medals: { gold: 20, silver: 50, bronze: 105 },
      w: 4600, h: 7600, wallT: 160,
      door: { x1: 3100, x2: 4300 },
      start: { x: 3500, y: 1400 },
      walls: [
        { x1: 0, y1: 5800, x2: 800, y2: 5960 }, { x1: 2000, y1: 5800, x2: 4600, y2: 5960 },
      ],
      rects: [
        { kind: 'kitchen', x1: 160, y1: 160, x2: 2200, y2: 760, face: 'S' },
        { kind: 'table', x1: 900, y1: 1700, x2: 1900, y2: 2400, face: 'S' },
        { kind: 'sofa', x1: 160, y1: 3300, x2: 860, y2: 4700, face: 'E' },
        { kind: 'shoebox', x1: 160, y1: 5960, x2: 600, y2: 7000, face: 'E' },
      ],
      circles: [
        { kind: 'pillar', x: 3500, y: 3000, r: 150 },
        { kind: 'pillar', x: 1600, y: 4500, r: 150 },
        { kind: 'kasa', x: 4270, y: 6130, r: 170 },
      ],
      bodies: [
        { kind: 'chair', x: 1400, y: 1250, r: 260, g: 5000 },
        { kind: 'ball', x: 1500, y: 3000, r: 120, g: 400 },
        { kind: 'cat', x: 3700, y: 4700, r: 220, g: 4000, variant: 'shiro' },
        { kind: 'robot', x: 3950, y: 2300, r: 170, g: 3000 },
        ...rows({ ...BOTTLE, r: 70 }, 3100, 2200, [4], 'S'),
        ...rows(BOOKS, 2600, 3200, TRI10, 'S'),
        ...rows(SHOES, 3600, 6500, TRI6, 'S'),
      ],
      rooms: [
        { name: 'リビング', x1: 0, y1: 0, x2: 4600, y2: 5800, floor: 'oak', label: { x: 3300, y: 5450 } },
        { name: '', x1: 0, y1: 5800, x2: 4600, y2: 6400, floor: 'tile' },
        { name: '玄関', x1: 0, y1: 6400, x2: 4600, y2: 7600, floor: 'doma', label: { x: 2000, y: 6900 } },
      ],
      decor: [
        { kind: 'futon', x: 3500, y: 1400, w: 1300, h: 1800 },
        { kind: 'rug', x: 3700, y: 4650, w: 1300, h: 1500 },
        { kind: 'doormat', x: 3700, y: 6850, w: 900, h: 450 },
        { kind: 'window', side: 'N', a: 2600, b: 4000 },
        { kind: 'window', side: 'E', a: 900, b: 2300 },
        { kind: 'window', side: 'E', a: 3200, b: 4600 },
        { kind: 'window', side: 'W', a: 1200, b: 2600 },
      ],
    },
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = { LAYOUTS };
  else root.NF_LAYOUTS = LAYOUTS;
})(typeof self !== 'undefined' ? self : this);
