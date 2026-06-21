// Shared hero categories for the home slider and category pages.
import cuisine1 from "@/assets/Cuisine/WhatsApp Image 2026-04-19 at 23.02.14 (1).jpeg";
import cuisine2 from "@/assets/Cuisine/WhatsApp Image 2026-04-19 at 23.02.15.jpeg";
import cuisine3 from "@/assets/Cuisine/WhatsApp Image 2026-04-19 at 23.02.18.jpeg";
import cuisine4 from "@/assets/Cuisine/WhatsApp Image 2026-04-19 at 23.02.19.jpeg";
import cuisine5 from "@/assets/Cuisine/WhatsApp Image 2026-04-19 at 23.02.20.jpeg";
import cuisine6 from "@/assets/Cuisine/WhatsApp Image 2026-04-19 at 23.02.14.jpeg";
import cuisine7 from "@/assets/Cuisine/WhatsApp Image 2026-04-19 at 23.02.22.jpeg";
import cuisine8 from "@/assets/Cuisine/WhatsApp Image 2026-04-19 at 23.09.39.jpeg";
import cuisine9 from "@/assets/Cuisine/WhatsApp Image 2026-04-19 at 23.09.40.jpeg";
import cuisine10 from "@/assets/Cuisine/WhatsApp Image 2026-04-19 at 23.02.21.jpeg";
import salon1 from "@/assets/salon/art-abstract-warm.jpg";
import salon2 from "@/assets/salon/art-botanical.jpg";
import salon3 from "@/assets/salon/art-desert.jpg";
import salon4 from "@/assets/salon/art-figure.jpg";
import salon5 from "@/assets/salon/art-geometric.jpg";
import salon6 from "@/assets/salon/art-vintage.jpg";
import salon7 from "@/assets/salon/art-abstract-warm.jpg";
import salon8 from "@/assets/salon/art-botanical.jpg";
import salon9 from "@/assets/salon/art-desert.jpg";
import salon10 from "@/assets/salon/art-figure.jpg";

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
    images: [cuisine1, cuisine2, cuisine3, cuisine4, cuisine5],
  },
  {
    slug: "femmes",
    word: "femmes",
    color: "text-accent-green",
    images: [salon1, salon2, salon3, salon4, salon5],
  },
  {
    slug: "cuisine",
    word: "cuisine",
    color: "text-accent-blue",
    images: [cuisine6, cuisine7, cuisine8, cuisine9, cuisine10],
  },
  {
    slug: "animaux",
    word: "animaux",
    color: "text-brand-red",
    images: [salon6, salon7, salon8, salon9, salon10],
  },
  {
    slug: "moderne-abstrait",
    word: "moderne abstrait",
    color: "text-accent-orange",
    images: [salon1, salon3, salon5, salon6, salon8],
  },
  {
    slug: "florale",
    word: "florale",
    color: "text-accent-green",
    images: [salon2, salon8, cuisine2, cuisine7, cuisine10],
  },
  {
    slug: "calligraphie-et-islamique",
    word: "calligraphie et islamique",
    color: "text-accent-blue",
    images: [cuisine1, cuisine4, cuisine6, cuisine8, cuisine9],
  },
  {
    slug: "traditionnel-orientale-mediterraneenne",
    word: "traditionnel, orientale et mediterraneenne",
    color: "text-brand-red",
    images: [cuisine3, cuisine5, cuisine7, cuisine9, cuisine10],
  },
];
