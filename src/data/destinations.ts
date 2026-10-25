/**
 * Slim destination hub — editorial copy aligned with web destinations.
 * Images: verified Unsplash landmarks for each city (wrong/404 IDs cause blank navy tiles).
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

/** Cropped Unsplash CDN URL for card/hero use. */
function photo(id: string, w = 900) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
}

const RAW: Omit<DestinationHub, "slug">[] = [
  {
    name: "Udaipur",
    title: "The City of Lakes",
    desc: "Marble palaces, Mewar arches, and lakeside living — from Fatehsagar villas to heritage boutique stays.",
    // City Palace on Lake Pichola (not Gateway of India)
    image: photo("photo-1615836245337-f5b9b2303f10"),
    tag: "Rajasthan",
    vibe: "Royal Lakefront",
    investmentIndex: "9.4/10",
    topLocalities: ["Lake Palace Road", "Panchwati", "Shobhagpura", "Fatehsagar"],
    averagePrice: "₹45 L – ₹8.5 Cr",
  },
  {
    name: "Jaipur",
    title: "The Pink City",
    desc: "Pink City heritage cores meeting modern townships, IT corridors, and strong family-home demand.",
    // Hawa Mahal
    image: photo("photo-1603262110263-fb0112e7cc33"),
    tag: "Rajasthan",
    vibe: "Heritage + Growth",
    investmentIndex: "9.1/10",
    topLocalities: ["C-Scheme", "Malviya Nagar", "Jagatpura", "Vaishali Nagar"],
    averagePrice: "₹35 L – ₹6 Cr",
  },
  {
    name: "Jodhpur",
    title: "The Blue City",
    desc: "Fort views, blue-city lanes, and expanding residential belts along Pal Road and Chopasni.",
    // Blue City rooftops
    image: photo("photo-1686825780583-8be7c349a4b4"),
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
    // Jaisalmer Fort
    image: photo("photo-1710347454810-e3d493dcc538"),
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
    // Atal Bridge / Sabarmati riverfront
    image: photo("photo-1651408451633-ff492f347ec1"),
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
    // Tapi riverfront, Surat
    image: photo("photo-1662528567133-324caf7bf71e"),
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
    // Pushkar Lake aerial
    image: photo("photo-1538158851102-3fb1f36d910c"),
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
    // Kota / Chambal cable-stayed bridge
    image: photo("photo-1590572852289-02c47eb0f3f9"),
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
