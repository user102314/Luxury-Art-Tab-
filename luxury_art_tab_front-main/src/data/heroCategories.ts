// Shared hero categories for the home slider and category pages.

const cuisineModules = import.meta.glob("../assets/Cuisine/*.jpeg", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const salonModules = import.meta.glob("../assets/salon/*.jpg", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function toSortedPool(modules: Record<string, string>): string[] {
  return Object.keys(modules)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => modules[key]);
}

const cuisinePool = toSortedPool(cuisineModules);
const salonPool = toSortedPool(salonModules);

/** Alterne les deux collections pour éviter les murs monotones. */
function interleave(a: string[], b: string[]): string[] {
  const out: string[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

const mixedPool = interleave(salonPool, cuisinePool);

export const HERO_IMAGES_PER_CATEGORY = 10;

function pickImages(pool: string[], offset: number, stride: number): string[] {
  const unique = Array.from(new Set(pool));
  if (unique.length === 0) return [];

  const picked: string[] = [];
  for (let i = 0; picked.length < HERO_IMAGES_PER_CATEGORY && i < unique.length * 3; i += 1) {
    const src = unique[(offset + i * stride) % unique.length];
    if (!picked.includes(src)) picked.push(src);
  }
  while (picked.length < HERO_IMAGES_PER_CATEGORY) {
    picked.push(unique[picked.length % unique.length]);
  }
  return picked;
}

export type HeroCategory = {
  slug: string;
  word: string;
  color: string;
  images: string[];
};

export const heroCategories: HeroCategory[] = [
  {
    slug: "enfants",
    word: "enfants",
    color: "text-accent-orange",
    images: pickImages(cuisinePool, 0, 7),
  },
  {
    slug: "femmes",
    word: "femmes",
    color: "text-accent-green",
    images: pickImages(mixedPool, 0, 5),
  },
  {
    slug: "cuisine",
    word: "cuisine",
    color: "text-accent-blue",
    images: pickImages(cuisinePool, 11, 5),
  },
  {
    slug: "animaux",
    word: "animaux",
    color: "text-brand-red",
    images: pickImages(mixedPool, 3, 9),
  },
  {
    slug: "moderne-abstrait",
    word: "moderne abstrait",
    color: "text-accent-orange",
    images: pickImages(mixedPool, 1, 11),
  },
  {
    slug: "florale",
    word: "florale",
    color: "text-accent-green",
    images: pickImages(cuisinePool, 23, 3),
  },
  {
    slug: "calligraphie-et-islamique",
    word: "calligraphie et islamique",
    color: "text-accent-blue",
    images: pickImages(cuisinePool, 41, 6),
  },
  {
    slug: "traditionnel-orientale-mediterraneenne",
    word: "traditionnel, orientale et mediterraneenne",
    color: "text-brand-red",
    images: pickImages(mixedPool, 7, 13),
  },
];
