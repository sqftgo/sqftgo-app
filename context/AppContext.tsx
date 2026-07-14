import React, { createContext, useContext, useState } from "react";

export interface Property {
  id: string;
  title: string;
  price: number; // in Rupees
  type: "Home" | "Villa" | "Hotel" | "Agricultural Land" | "Apartment" | "Office Space" | "Commercial Space" | "Shop" | "Industrial Plot";
  purpose: "buy" | "sell" | "rent" | "lease";
  bhk?: number;
  city: string;
  locality: string;
  size: number; // in sq.ft.
  furnished: "Furnished" | "Semi-Furnished" | "Unfurnished";
  description: string;
  amenities: string[];
  images: string[];
  ownerName: string;
  ownerPhone: string;
  inquiryCount: number;
  status: "Active" | "Pending Review" | "Sold" | "Rented";
  featured?: boolean;
  reraApproved?: boolean;
  reraId?: string;
  verifiedDate?: string;
  verificationChecks?: {
    titleDeed: boolean;
    taxClearance: boolean;
    utilitiesCheck: boolean;
    physicalVerification: boolean;
    structuralVetted: boolean;
  };
  priceBreakdown?: {
    basePrice: number;
    securityDeposit?: number;
    maintenance: number;
    registrationFees?: number;
    gst?: number;
  };
}

export interface DirectoryProfile {
  id: string;
  firmName: string;
  ownerName: string;
  category: "Agent & Broker" | "Builder & Developer" | "Interior Decorator" | "Architect" | "Building Contractor" | "Property Consultant" | "Vastu Consultant" | "Home Valuation/Inspection" | "Home Shifting/Deep Cleaning";
  city: string;
  address: string;
  email: string;
  website: string;
  mobile: string;
  description: string;
  reraId?: string;
  experience?: string;
  specialties?: string[];
  teamSize?: number;
  listingsCount?: number;
}

interface AppContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  addProperty: (property: Omit<Property, "id" | "inquiryCount" | "status" | "ownerName" | "ownerPhone">) => void;
  directoryProfiles: DirectoryProfile[];
  setDirectoryProfiles: React.Dispatch<React.SetStateAction<DirectoryProfile[]>>;
  addDirectoryProfile: (profile: Omit<DirectoryProfile, "id">) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  userRole: "user" | "broker" | "admin" | null;
  setUserRole: (role: "user" | "broker" | "admin" | null) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialProperties: Property[] = [
  {
    id: "prop-1",
    title: "Ultra Luxury Lake-Facing Villa",
    price: 37500000,
    type: "Villa",
    purpose: "buy",
    bhk: 4,
    city: "Udaipur",
    locality: "Lake Palace Road",
    size: 4200,
    furnished: "Furnished",
    description: "Nestled along the iconic Lake Palace Road in Udaipur, this 4 BHK luxury villa offers breathtaking Pichola Lake views, a private infinity pool, a lush landscaped terrace garden, and bespoke Mewari marble arches. Experience absolute royalty with high-tech automated climate controls and personal elevators.",
    amenities: ["Swimming Pool", "Private Garden", "Lake View", "Power Backup", "Gym", "Security", "Parking"],
    images: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80"
    ],
    ownerName: "Rajendra Singh Mewar",
    ownerPhone: "+91 98765 43210",
    inquiryCount: 12,
    status: "Active",
    featured: true,
    reraApproved: true,
    reraId: "RAJ/RERA/P/2023/1204",
    verifiedDate: "2026-06-25",
    verificationChecks: {
      titleDeed: true,
      taxClearance: true,
      utilitiesCheck: true,
      physicalVerification: true,
      structuralVetted: true,
    },
    priceBreakdown: {
      basePrice: 37500000,
      maintenance: 12000,
      registrationFees: 2250000,
      gst: 1875000,
    },
  },
  {
    id: "prop-2",
    title: "Premium 3 BHK Flat in C-Scheme",
    price: 8500000,
    type: "Apartment",
    purpose: "buy",
    bhk: 3,
    city: "Jaipur",
    locality: "C-Scheme",
    size: 1850,
    furnished: "Semi-Furnished",
    description: "A gorgeous, modern 3 BHK apartment located in the prime area of C-Scheme, Jaipur. Comes with dynamic false ceilings, high-end teakwood modular kitchen, spacious balconies overlooking the garden skyline, and complete security. Perfect for families looking for proximity to leading business hubs, cafes, and schools.",
    amenities: ["Gym", "Security", "Clubhouse", "Children Play Area", "Parking", "Power Backup"],
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
    ],
    ownerName: "Anil Sharma",
    ownerPhone: "+91 94140 12345",
    inquiryCount: 4,
    status: "Active",
    featured: true,
    reraApproved: true,
    reraId: "RAJ/RERA/P/2024/0932",
    verifiedDate: "2026-06-28",
    verificationChecks: {
      titleDeed: true,
      taxClearance: true,
      utilitiesCheck: true,
      physicalVerification: true,
      structuralVetted: true,
    },
    priceBreakdown: {
      basePrice: 8500000,
      maintenance: 3500,
      registrationFees: 510000,
      gst: 425000,
    },
  },
  {
    id: "prop-3",
    title: "Modern 2 BHK Fully Furnished Flat",
    price: 22000,
    type: "Apartment",
    purpose: "rent",
    bhk: 2,
    city: "Udaipur",
    locality: "Fatehsagar Lake",
    size: 1200,
    furnished: "Furnished",
    description: "Tastefully furnished 2 BHK apartment near Fatehsagar Lake, Udaipur's most sought-after residential hub. Rent includes high-speed Wi-Fi, modern appliances, smart TV, double-door refrigerator, modular kitchen, and double beds. Features close proximity to top restaurants and hospitals.",
    amenities: ["Elevator", "Security", "Modular Kitchen", "Power Backup", "Parking"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
    ],
    ownerName: "Meenakshi Vyas",
    ownerPhone: "+91 98290 87654",
    inquiryCount: 9,
    status: "Active",
    featured: true,
    reraApproved: true,
    reraId: "RAJ/RERA/P/2023/0481",
    verifiedDate: "2026-06-29",
    verificationChecks: {
      titleDeed: true,
      taxClearance: true,
      utilitiesCheck: true,
      physicalVerification: true,
      structuralVetted: true,
    },
    priceBreakdown: {
      basePrice: 22000,
      securityDeposit: 44000,
      maintenance: 2000,
    },
  },
  {
    id: "prop-4",
    title: "Heritage 5 BHK Bungalow",
    price: 85000000,
    type: "Home",
    purpose: "buy",
    bhk: 5,
    city: "Jodhpur",
    locality: "Ratanada",
    size: 5500,
    furnished: "Furnished",
    description: "Live the royal lifestyle in this meticulously restored heritage Bungalow. Located in the diplomatic heart of Ratanada in Jodhpur. This property displays majestic stone jharokhas, a central open courtyard, detailed frescos, and a rooftop lounge that gives a 360-degree view of the city skyline.",
    amenities: ["Heritage Courtyard", "Rooftop Lounge", "Fort View", "Security", "Private Parking"],
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
    ],
    ownerName: "Gajendra Singh Rathore",
    ownerPhone: "+91 99887 76655",
    inquiryCount: 18,
    status: "Active",
    featured: true,
    reraApproved: true,
    reraId: "RAJ/RERA/P/2022/1199",
    verifiedDate: "2026-06-18",
    verificationChecks: {
      titleDeed: true,
      taxClearance: true,
      utilitiesCheck: true,
      physicalVerification: true,
      structuralVetted: true,
    },
    priceBreakdown: {
      basePrice: 85000000,
      maintenance: 25000,
      registrationFees: 5100000,
      gst: 4250000,
    },
  },
  {
    id: "prop-5",
    title: "Cozy 3 BHK House in Vaishali Nagar",
    price: 32000,
    type: "Home",
    purpose: "rent",
    bhk: 3,
    city: "Jaipur",
    locality: "Vaishali Nagar",
    size: 2000,
    furnished: "Semi-Furnished",
    description: "Spacious 3 BHK home with a small front lawn and secure car parking. Ideally situated in Vaishali Nagar, Jaipur, near major universities and shopping malls. Highly recommended for families looking for peaceful, independent housing.",
    amenities: ["Private Lawn", "Parking", "Water Reservoir", "Power Backup"],
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
    ],
    ownerName: "Dr. K. K. Verma",
    ownerPhone: "+91 94142 54321",
    inquiryCount: 3,
    status: "Active",
    verifiedDate: "2026-07-02",
    verificationChecks: {
      titleDeed: true,
      taxClearance: true,
      utilitiesCheck: true,
      physicalVerification: true,
      structuralVetted: false,
    },
    priceBreakdown: {
      basePrice: 32000,
      securityDeposit: 64000,
      maintenance: 1500,
    },
  },
  {
    id: "prop-6",
    title: "Premium Commercial Plot near Fort Road",
    price: 4500000,
    type: "Industrial Plot",
    purpose: "sell",
    city: "Bikaner",
    locality: "Sadul Ganj",
    size: 2400,
    furnished: "Unfurnished",
    description: "East-facing commercial plot measuring 40x60 in the upscale Sadul Ganj expansion, Bikaner. Features 40ft wide internal tar roads, underground electricity grid, municipal water connections, and a green park boundary. Ready for immediate construction.",
    amenities: ["Park view", "Corner Plot", "Water Supply", "Gated Boundary"],
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"],
    ownerName: "Vikram Chauhan",
    ownerPhone: "+91 98281 12233",
    inquiryCount: 2,
    status: "Active",
    verifiedDate: "2026-06-20",
    verificationChecks: {
      titleDeed: true,
      taxClearance: true,
      utilitiesCheck: true,
      physicalVerification: true,
      structuralVetted: false,
    },
    priceBreakdown: {
      basePrice: 4500000,
      maintenance: 0,
      registrationFees: 270000,
      gst: 225000,
    },
  },
  {
    id: "prop-7",
    title: "Chic 1 BHK Studio Apartment",
    price: 12000,
    type: "Apartment",
    purpose: "lease",
    bhk: 1,
    city: "Jaipur",
    locality: "Malviya Nagar",
    size: 650,
    furnished: "Furnished",
    description: "A compact, modern, fully-furnished studio apartment, perfect for solo professionals or couples. Equipped with split AC, double bed, smart TV, modular kitchenette, wardrobe, and balcony. Located in a secure gated community in Malviya Nagar, Jaipur.",
    amenities: ["Security", "Elevator", "Parking", "Gym"],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
    ],
    ownerName: "Rahul Sharma",
    ownerPhone: "+91 99999 88888",
    inquiryCount: 7,
    status: "Active",
    reraApproved: true,
    reraId: "RAJ/RERA/P/2024/1608",
    verifiedDate: "2026-07-04",
    verificationChecks: {
      titleDeed: true,
      taxClearance: true,
      utilitiesCheck: true,
      physicalVerification: true,
      structuralVetted: true,
    },
    priceBreakdown: {
      basePrice: 12000,
      securityDeposit: 36000,
      maintenance: 1000,
    },
  },
  {
    id: "prop-8",
    title: "Luxury 4 BHK Penthouse",
    price: 18000000,
    type: "Apartment",
    purpose: "sell",
    bhk: 4,
    city: "Kota",
    locality: "Talwandi",
    size: 3600,
    furnished: "Furnished",
    description: "Magnificent 4 BHK Penthouse in Talwandi, the most upscale neighborhood of Kota. Spread across two floors, it offers panoramic river valley vistas, a massive private terrace with deck seating, a fully-loaded personal gym area, home theater room, and premium Italian marble flooring.",
    amenities: ["Private Terrace", "Home Theater", "Gym", "Power Backup", "Security", "Swimming Pool"],
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"
    ],
    ownerName: "Devendra Jindal",
    ownerPhone: "+91 98888 77777",
    inquiryCount: 15,
    status: "Active",
    featured: true,
    reraApproved: true,
    reraId: "RAJ/RERA/P/2023/0744",
    verifiedDate: "2026-06-11",
    verificationChecks: {
      titleDeed: true,
      taxClearance: true,
      utilitiesCheck: true,
      physicalVerification: true,
      structuralVetted: true,
    },
    priceBreakdown: {
      basePrice: 18000000,
      maintenance: 6500,
      registrationFees: 1080000,
      gst: 900000,
    },
  }
];

const initialDirectoryProfiles: DirectoryProfile[] = [
  {
    id: "dir-dealer-1",
    firmName: "Lake City Brokerage",
    ownerName: "Rajesh Mehta",
    category: "Agent & Broker",
    city: "Udaipur",
    address: "Panchwati, Udaipur",
    email: "rajesh@lakecitybrokerage.com",
    website: "www.lakecitybrokerage.com",
    mobile: "+91 98290 12345",
    description: "Trusted broker specializing in lakefront villas, luxury apartments, and commercial lease verification in Shobhagpura & Panchwati.",
    reraId: "RAJ/A/UDZ/2021/0492",
    experience: "8+ Years",
    specialties: ["Heritage Havelis", "Lakefront Villas", "Agricultural Lands"],
    teamSize: 5,
    listingsCount: 12,
  },
  {
    id: "dir-dealer-2",
    firmName: "Mewar Property Consultants",
    ownerName: "Vikram Singh Rathore",
    category: "Property Consultant",
    city: "Udaipur",
    address: "Shobhagpura Circle, Udaipur",
    email: "vikram@mewarproperty.in",
    website: "www.mewarproperty.in",
    mobile: "+91 94141 56789",
    description: "Professional property consultant for heritage land title checks, agricultural conversions, and Udaipur RERA verification services.",
    reraId: "RAJ/A/UDZ/2023/1188",
    experience: "5+ Years",
    specialties: ["RERA Clearances", "Commercial Leases", "Title Checks"],
    teamSize: 3,
    listingsCount: 8,
  },
  {
    id: "dir-dealer-3",
    firmName: "Pink City Realty",
    ownerName: "Amit Sharma",
    category: "Agent & Broker",
    city: "Jaipur",
    address: "Malviya Nagar, Jaipur",
    email: "amit@pinkcityrealty.com",
    website: "www.pinkcityrealty.com",
    mobile: "+91 98290 98765",
    description: "Leading agent for high-end residential deals in C-Scheme, Vaishali Nagar, and Malviya Nagar.",
    reraId: "RAJ/A/JPR/2019/0082",
    experience: "12+ Years",
    specialties: ["Luxury Apartments", "Heritage Hotels", "Bungalows"],
    teamSize: 8,
    listingsCount: 24,
  },
  {
    id: "dir-dealer-4",
    firmName: "Marwar Property Hub",
    ownerName: "Sunil Bhati",
    category: "Property Consultant",
    city: "Jodhpur",
    address: "Shastri Nagar, Jodhpur",
    email: "sunil@marwarproperty.com",
    website: "www.marwarproperty.com",
    mobile: "+91 98291 11122",
    description: "Expert consultant in Jodhpur for sandstone havelis, heritage hotel leaseholds, and RERA property acquisition.",
    reraId: "RAJ/A/JDH/2022/0744",
    experience: "6+ Years",
    specialties: ["Haveli Restoration Projects", "Plots & Land", "Office Leases"],
    teamSize: 4,
    listingsCount: 15,
  },
  {
    id: "dir-dealer-5",
    firmName: "Thar Desert Brokers",
    ownerName: "Karan Singh",
    category: "Agent & Broker",
    city: "Jaisalmer",
    address: "Fort Road, Jaisalmer",
    email: "karan@thardesertbrokers.com",
    website: "www.thardesertbrokers.com",
    mobile: "+91 99887 65432",
    description: "Specialized brokers for resort land plots, sandstone villa listings, and heritage homestay rentals around Jaisalmer Fort.",
    reraId: "RAJ/A/JSM/2024/1820",
    experience: "4+ Years",
    specialties: ["Desert Camps & Resort Plots", "Sandstone Havelis", "Homestay Renting"],
    teamSize: 2,
    listingsCount: 6,
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState("Udaipur");
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [directoryProfiles, setDirectoryProfiles] = useState<DirectoryProfile[]>(initialDirectoryProfiles);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userEmail, setUserEmail] = useState("broker@svrepl.com");
  const [userRole, setUserRole] = useState<"user" | "broker" | "admin" | null>("broker");
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  const addProperty = (prop: Omit<Property, "id" | "inquiryCount" | "status" | "ownerName" | "ownerPhone">) => {
    const newProperty: Property = {
      ...prop,
      id: `prop-${Date.now()}`,
      inquiryCount: 0,
      status: "Active",
      ownerName: "App User",
      ownerPhone: "+91 98765 00000",
    };
    setProperties((prev) => [newProperty, ...prev]);
  };

  const addDirectoryProfile = (prof: Omit<DirectoryProfile, "id">) => {
    const newProfile: DirectoryProfile = {
      ...prof,
      id: `dir-${Date.now()}`,
    };
    setDirectoryProfiles((prev) => [newProfile, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        properties,
        setProperties,
        favorites,
        toggleFavorite,
        addProperty,
        directoryProfiles,
        setDirectoryProfiles,
        addDirectoryProfile,
        isLoggedIn,
        setIsLoggedIn,
        userEmail,
        setUserEmail,
        userRole,
        setUserRole,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
