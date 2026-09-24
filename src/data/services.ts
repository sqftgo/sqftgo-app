export interface ServiceProvider {
  id: string;
  name: string;
  firmName: string;
  category: string;
  rating: number;
  reviewsCount: number;
  experience: string;
  pricingStarts: string;
  verified: boolean;
  city: string;
  mobile: string;
  avatarUrl: string;
  description: string;
  specialties: string[];
  badges: string[];
}

export interface ServiceCategory {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  tag?: string;
  startingPrice: string;
  providersCount: number;
  popularServices: string[];
  providers: ServiceProvider[];
}

/** Mock categories aligned with web `/api/service-types` seed names. */
export const REAL_ESTATE_SERVICES: ServiceCategory[] = [
  {
    id: "architect-interior",
    slug: "architect-interior-designer",
    title: "Architect & Interior Designer",
    subtitle: "Plans, interiors & turnkey styling",
    description:
      "Architects and interior designers for heritage restorations, modern homes, and full turnkey interiors.",
    iconName: "EditPencil",
    tag: "Popular",
    startingPrice: "₹99,000",
    providersCount: 16,
    popularServices: [
      "Floor plans & elevations",
      "Modular kitchens",
      "3D visualization",
      "Turnkey interiors",
    ],
    providers: [
      {
        id: "prov-int-1",
        name: "Studio Luxe Living",
        firmName: "Studio Luxe Interiors",
        category: "Architect & Interior Designer",
        rating: 5.0,
        reviewsCount: 164,
        experience: "11+ Years",
        pricingStarts: "₹1,200 / Sq.Ft",
        verified: true,
        city: "Jaipur",
        mobile: "+91 98290 44556",
        avatarUrl:
          "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=300&q=80",
        description:
          "Award-winning studio creating bespoke contemporary interiors and custom lighting blueprints.",
        specialties: ["3D Virtual Renderings", "German Hardware Fitting", "10-Year Warranty"],
        badges: ["Top Designer", "Turnkey Pro"],
      },
    ],
  },
  {
    id: "house-services",
    slug: "house-services",
    title: "House Services",
    subtitle: "Cleaning, upkeep & move-in readiness",
    description:
      "Deep cleaning, maintenance, and move-in services for apartments and independent homes.",
    iconName: "Droplet",
    startingPrice: "₹1,899",
    providersCount: 20,
    popularServices: [
      "Full home deep cleaning",
      "Move-in scrub",
      "Plumbing & electrical",
      "Pest control",
    ],
    providers: [
      {
        id: "prov-clean-1",
        name: "SparkleClean Pro Care",
        firmName: "SparkleClean Facilities",
        category: "House Services",
        rating: 4.8,
        reviewsCount: 240,
        experience: "5+ Years",
        pricingStarts: "₹1,899 Base",
        verified: true,
        city: "Surat",
        mobile: "+91 98290 33221",
        avatarUrl:
          "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80",
        description:
          "Hospital-grade eco-friendly chemicals for move-in ready sanitization.",
        specialties: ["Single-Day Turnaround", "Eco Chemical Wash"],
        badges: ["Certified Clean"],
      },
    ],
  },
  {
    id: "interior-decorator",
    slug: "interior-decorator",
    title: "Interior Decorator",
    subtitle: "Styling & soft furnishings",
    description: "Decorators for furniture layout, soft furnishings, and styling consultations.",
    iconName: "Sparkles",
    startingPrice: "₹15,000",
    providersCount: 12,
    popularServices: ["Home styling", "Furniture layout", "Curtains & soft furnishings"],
    providers: [],
  },
  {
    id: "architect",
    slug: "architect",
    title: "Architect",
    subtitle: "Structural plans & sanctions",
    description: "Licensed architects for residential and commercial designs.",
    iconName: "Building2",
    startingPrice: "₹25,000",
    providersCount: 14,
    popularServices: ["2D/3D plans", "Municipal sanction drawings", "Site supervision"],
    providers: [],
  },
  {
    id: "building-contractor",
    slug: "building-contractor",
    title: "Building Contractor",
    subtitle: "Civil works & turnkey build",
    description: "Contractors for construction, renovation, and structural execution.",
    iconName: "Settings",
    startingPrice: "₹1,650 / sq.ft",
    providersCount: 15,
    popularServices: ["Turnkey construction", "Renovation", "Waterproofing"],
    providers: [],
  },
  {
    id: "vastu",
    slug: "vastu-consultant",
    title: "Vastu Consultant",
    subtitle: "Harmonize energy & layouts",
    description: "Certified Vastu experts for homes, plots, and commercial spaces.",
    iconName: "Compass",
    tag: "Trending",
    startingPrice: "₹1,499",
    providersCount: 14,
    popularServices: [
      "Residential Vastu audit",
      "Plot direction analysis",
      "Commercial layout",
    ],
    providers: [
      {
        id: "prov-vastu-1",
        name: "Acharya Arvind Shastri",
        firmName: "Aura Vastu Research Center",
        category: "Vastu Consultant",
        rating: 4.9,
        reviewsCount: 186,
        experience: "15+ Years",
        pricingStarts: "₹2,100 / Session",
        verified: true,
        city: "Jaipur",
        mobile: "+91 98290 11223",
        avatarUrl:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
        description:
          "Specializes in non-structural Vastu adjustments for flats and offices.",
        specialties: ["Non-Structural Remedies", "Flat Floorplan Vetting"],
        badges: ["Top Rated"],
      },
    ],
  },
  {
    id: "home-valuation",
    slug: "home-valuation-inspection",
    title: "Home Valuation/Inspection",
    subtitle: "Price checks & condition reports",
    description: "Independent valuation and property inspection before you buy or rent.",
    iconName: "DocStar",
    startingPrice: "₹2,999",
    providersCount: 10,
    popularServices: ["Market valuation", "Structural inspection", "Due diligence"],
    providers: [],
  },
  {
    id: "home-shifting",
    slug: "home-shifting-deep-cleaning",
    title: "Home Shifting/Deep Cleaning",
    subtitle: "Move & sanitize in one go",
    description: "Combined relocation and deep-cleaning packages for relocators.",
    iconName: "ShoppingBag",
    startingPrice: "₹3,999",
    providersCount: 18,
    popularServices: ["Local shifting", "Intercity move", "Post-move clean"],
    providers: [],
  },
  {
    id: "movers-packers",
    slug: "movers-and-packers",
    title: "Movers & Packers",
    subtitle: "Safe home relocation",
    description: "Professional packing, transit insurance, and doorstep unpacking.",
    iconName: "ShoppingBag",
    tag: "Essential",
    startingPrice: "₹3,999",
    providersCount: 22,
    popularServices: ["1/2/3 BHK relocation", "Intercity moving", "Vehicle transport"],
    providers: [
      {
        id: "prov-pack-1",
        name: "Express Swift Logistics",
        firmName: "Express Swift Packers & Movers",
        category: "Movers & Packers",
        rating: 4.9,
        reviewsCount: 312,
        experience: "8+ Years",
        pricingStarts: "₹4,500 Base",
        verified: true,
        city: "Jaipur",
        mobile: "+91 98290 88776",
        avatarUrl:
          "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80",
        description: "5-layer packing with enclosed fleet and same-day local shifting.",
        specialties: ["Zero-Damage Guarantee", "Live GPS Tracking"],
        badges: ["Insured Transit"],
      },
    ],
  },
  {
    id: "contractors",
    slug: "contractors",
    title: "Contractors",
    subtitle: "Skilled trade partners",
    description: "Verified contractors for civil, electrical, and renovation work.",
    iconName: "Settings",
    startingPrice: "₹499",
    providersCount: 28,
    popularServices: ["Electrical", "Plumbing", "Painting", "Carpentry"],
    providers: [],
  },
  {
    id: "event-managers",
    slug: "event-managers",
    title: "Event Managers",
    subtitle: "Venue & event coordination",
    description: "Event planners for property launches, housewarmings, and corporate events.",
    iconName: "Sparkles",
    startingPrice: "₹25,000",
    providersCount: 8,
    popularServices: ["Housewarming", "Launch events", "Corporate gatherings"],
    providers: [],
  },
  {
    id: "wedding-planners",
    slug: "wedding-planners",
    title: "Wedding Planners",
    subtitle: "Heritage & destination weddings",
    description: "Wedding planners for palace venues and destination celebrations.",
    iconName: "Sparkles",
    startingPrice: "₹75,000",
    providersCount: 6,
    popularServices: ["Destination weddings", "Venue booking", "Full planning"],
    providers: [],
  },
];
