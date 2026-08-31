// Pete's catalogue. Titles, places, prices and edition sizes are placeholders
// until Pete confirms them. `ratio` and `accent` are measured from the files.

export type Photo = {
  slug: string;
  title: string;
  place: string;
  note: string;
  /** width / height of the master, measured. Decides which paper it can go on. */
  ratio: number;
  /** dominant colour sampled from the frame, used as this photo's UI accent */
  accent: string;
  edition: number;
  remaining: number;
};

export const photos: Photo[] = [
  {
    slug: "brown-hut-road",
    title: "The Road In",
    place: "Aorere Valley, Kahurangi",
    note: "Mist in the beech before the climb to Perry Saddle.",
    ratio: 1.3333,
    accent: "#9E724B",
    edition: 25,
    remaining: 7,
  },
  {
    slug: "flanagans",
    title: "First Light Off the Tops",
    place: "Kahurangi National Park",
    note: "Limestone and tussock, with Golden Bay somewhere under the haze.",
    ratio: 1.5004,
    accent: "#3E889E",
    edition: 25,
    remaining: 22,
  },
  {
    slug: "perry-saddle",
    title: "Frost on Gouland Downs",
    place: "Gouland Downs, Heaphy Track",
    note: "Six degrees under. The sign points to Perry Saddle one way, Saxon the other.",
    ratio: 1.5004,
    accent: "#7098EA",
    edition: 25,
    remaining: 15,
  },
  {
    slug: "enchanted-forest",
    title: "Enchanted Forest",
    place: "Gouland Downs, Heaphy Track",
    note: "A creek through the moss-draped beech. It really is called that.",
    ratio: 1.5004,
    accent: "#899E4B",
    edition: 25,
    remaining: 19,
  },
  {
    slug: "gouland-cave",
    title: "Shelter, Lit From Inside",
    place: "Kahurangi National Park",
    note: "Candles under an overhang, forty minutes of exposure and nobody talking.",
    ratio: 1.3396,
    accent: "#D2763A",
    edition: 25,
    remaining: 4,
  },
  {
    slug: "the-light-left-on",
    title: "The Light Left On",
    place: "Kahurangi National Park",
    note: "Somebody was awake. The Milky Way was doing its thing regardless.",
    ratio: 1.5004,
    accent: "#9E610C",
    edition: 25,
    remaining: 7,
  },
  {
    slug: "heaphy-river",
    title: "Heaphy River, Twenty Seconds",
    place: "Heaphy River",
    note: "Long enough for the water to go soft and the stones to stay sharp.",
    ratio: 1.3333,
    accent: "#9E884B",
    edition: 25,
    remaining: 25,
  },
  {
    slug: "nikau",
    title: "Nikau, Near the Coast",
    place: "Heaphy Track, West Coast",
    note: "The last hour of the walk, where the bush turns subtropical.",
    ratio: 1.5004,
    accent: "#5B9E34",
    edition: 25,
    remaining: 12,
  },
  {
    slug: "kohaihai",
    title: "Oystercatchers, Low Tide",
    place: "West Coast",
    note: "What is left of a wharf, and the birds who inherited it.",
    ratio: 1.3333,
    accent: "#4F86A5",
    edition: 25,
    remaining: 9,
  },
  {
    slug: "valley-road",
    title: "Nobody Coming the Other Way",
    place: "South Island backcountry",
    note: "Wet gravel holding the last of the light.",
    ratio: 1.4684,
    accent: "#376C9E",
    edition: 25,
    remaining: 18,
  },
];

export const bySlug = (slug: string) => photos.find((p) => p.slug === slug);
export const preview = (slug: string) => `/photos/${slug}.jpg`;
export const thumb = (slug: string) => `/photos/${slug}-thumb.jpg`;
