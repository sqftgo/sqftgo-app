/**
 * Slim destination hub — editorial copy aligned with web destinations.
 * Images use Unsplash (web uses /public assets that aren't in the Expo bundle).
 */

export type DestinationHub = {
  name: string;
  slug: string;
  title: string;
  desc: string;
  image: string;
  tag: string;
  vibe: string;
  investmentIndex: string;
  topLocalities: string[];
  averagePrice: string;
};

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

const RAW: Omit<DestinationHub, "slug">[] = [
  {
    name: "Udaipur",
    title: "The City of Lakes",
    desc: "Marble palaces, Mewar arches, and lakeside living.",
    image:
      "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=800&q=80",
    tag: "Rajasthan",
    vibe: "Royal Lakefront",
    investmentIndex: "9.4/10",
    topLocalities: ["Lake Palace Road", "Panchwati", "Shobhagpura", "Fatehsagar"],
    averagePrice: "₹45 L – ₹8.5 Cr",
  },
  {
    name: "Jaipur",
    title: "The Pink City",
    desc: "Heritage cores meeting modern townships and IT corridors.",
    image:
      "https://images.unsplash.com/photo-1477587458883-471a5ed94245?auto=format&fit=crop&w=800&q=80",
    tag: "Rajasthan",
    vibe: "Heritage + Growth",
    investmentIndex: "9.1/10",
    topLocalities: ["C-Scheme", "Malviya Nagar", "Jagatpura", "Vaishali Nagar"],
    averagePrice: "₹35 L – ₹6 Cr",
  },
  {
    name: "Jodhpur",
    title: "The Blue City",
    desc: "Fort views, old city lanes, and expanding residential belts.",
    image:
      "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
    tag: "Rajasthan",
    vibe: "Desert Heritage",
    investmentIndex: "8.6/10",
    topLocalities: ["Ratanada", "Sardarpura", "Chopasni", "Pal Road"],
    averagePrice: "₹25 L – ₹4 Cr",
  },
  {
    name: "Jaisalmer",
    title: "The Golden City",
    desc: "Fort living, desert resorts, and hospitality-led inventory.",
    image:
      "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80",
    tag: "Rajasthan",
    vibe: "Desert Escape",
    investmentIndex: "8.2/10",
    topLocalities: ["Fort Area", "Sam Road", "Gandhi Colony"],
    averagePrice: "₹20 L – ₹3.5 Cr",
  },
  {
    name: "Ahmedabad",
    title: "Gujarat's Commercial Hub",
    desc: "Strong rental demand across west and SG Highway belts.",
    image:
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74070?auto=format&fit=crop&w=800&q=80",
    tag: "Gujarat",
    vibe: "Business Capital",
    investmentIndex: "9.0/10",
    topLocalities: ["SG Highway", "Bopal", "Satellite", "Navrangpura"],
    averagePrice: "₹40 L – ₹5 Cr",
  },
  {
    name: "Surat",
    title: "Diamond City",
    desc: "Fast-growing mid-segment apartments and commercial strips.",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
    tag: "Gujarat",
    vibe: "Industrial Growth",
    investmentIndex: "8.7/10",
    topLocalities: ["Vesu", "Adajan", "Piplod", "City Light"],
    averagePrice: "₹30 L – ₹3 Cr",
  },
  {
    name: "Pushkar",
    title: "Temple Town",
    desc: "Boutique stays and second homes around the sacred lake.",
    image:
      "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
    tag: "Rajasthan",
    vibe: "Spiritual Escape",
    investmentIndex: "7.9/10",
    topLocalities: ["Lake Area", "Main Bazaar", "Ajmer Road"],
    averagePrice: "₹18 L – ₹2.5 Cr",
  },
  {
    name: "Kota",
    title: "Education Hub",
    desc: "Strong PG and rental demand driven by coaching institutes.",
    image:
      "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=800&q=80",
    tag: "Rajasthan",
    vibe: "Student City",
    investmentIndex: "8.3/10",
    topLocalities: ["Talwandi", "Rajeev Gandhi Nagar", "Vigyan Nagar"],
    averagePrice: "₹20 L – ₹2 Cr",
  },
];

export const DESTINATIONS: DestinationHub[] = RAW.map((d) => ({
  ...d,
  slug: slugify(d.name),
}));

export function getDestinationBySlug(slug: string): DestinationHub | undefined {
  return DESTINATIONS.find((d) => d.slug === slug || d.name.toLowerCase() === slug.toLowerCase());
}

export const DESTINATION_TAGS = [...new Set(DESTINATIONS.map((d) => d.tag))];
