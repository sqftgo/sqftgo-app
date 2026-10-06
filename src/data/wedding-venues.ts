/**
 * Wedding venues and unique wedding properties per destination, generated from the web
 * catalogue (features/destinations/data/destinations.ts). Tariffs are indicative, never quotes.
 */

export interface WeddingVenue {
  id: string;
  name: string;
  type: string;
  capacity: string;
  pricePerEvent: string;
  image?: string;
  vibe: string;
  highlights: string[];
  description: string;
  areaNote?: string;
}

export interface WeddingProperty {
  id: string;
  title: string;
  propertyType: string;
  price: string;
  specs: string;
  location: string;
  image?: string;
  features: string[];
  description: string;
}

export const WEDDING_CATALOG: Record<string, { venues: WeddingVenue[]; properties: WeddingProperty[] }> = {
  "Udaipur": {
    "venues": [
      {
        "id": "udr-v1",
        "name": "Taj Lake Palace",
        "type": "Island Palace Hotel",
        "capacity": "About 150 – 200 guests",
        "pricePerEvent": "Indicative ₹3–8 Cr+",
        "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
        "vibe": "Floating marble island",
        "highlights": [
          "Boat arrival on Lake Pichola",
          "White-marble island hotel",
          "Intimate buyout weddings"
        ],
        "description": "18th-century marble palace hotel on an island in Lake Pichola — India's most photographed wedding address. Capacity is intimate; guests stay on the island or in sister Taj hotels."
      },
      {
        "id": "udr-v2",
        "name": "Jagmandir Island Palace",
        "type": "Mewar island venue",
        "capacity": "Function venue (stay in the city)",
        "pricePerEvent": "Indicative ₹1.5–5 Cr",
        "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop",
        "vibe": "17th-century pleasure palace",
        "highlights": [
          "Gol Mahal and lake-edge lawns",
          "Boat crossing for pheras",
          "Owned by the Mewar royal family"
        ],
        "description": "A 17th-century pleasure palace on a second Lake Pichola island. It is a ceremony venue rather than a hotel — guests typically stay elsewhere in Udaipur and boat across for functions."
      },
      {
        "id": "udr-v3",
        "name": "Fateh Garh",
        "type": "Hilltop heritage hotel",
        "capacity": "About 150 – 350 guests",
        "pricePerEvent": "Indicative ₹1–3 Cr",
        "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop",
        "vibe": "Aravalli city views",
        "highlights": [
          "Hilltop palace-hotel setting",
          "Panoramic Aravalli and city views",
          "More approachable than the Pichola cluster"
        ],
        "description": "Reconstructed heritage palace-hotel on a hillside above Udaipur, used for palace-feel weddings that do not need a full Lake Pichola buyout."
      }
    ],
    "properties": [
      {
        "id": "udr-p1",
        "title": "The Royal Lakefront Haveli Estate",
        "propertyType": "Heritage Haveli Estate",
        "price": "₹14.5 Crores",
        "specs": "12 Royal Suites • 2.8 Acres • 1,000 Capacity Lawns",
        "location": "Lake Pichola Outer Ring, Udaipur",
        "image": "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Private Boat Dock & Jetty",
          "Marble Amphitheater",
          "Commercial Banquet Kitchen",
          "Helipad Access"
        ],
        "description": "Sprawling 12-suite royal haveli featuring carved marble courtyards, private lakefront jetty, and expansive lawns customized for destination weddings."
      },
      {
        "id": "udr-p2",
        "title": "Mewar Palace View Fort Villa",
        "propertyType": "Fortress Villa",
        "price": "₹9.8 Crores",
        "specs": "8 Suites • 1.6 Acres • 600 Capacity Lawns",
        "location": "Badi Lake Road, Udaipur",
        "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Infinity Pool Facing Hills",
          "Private Sangeet Hall",
          "Traditional Jharokhas",
          "RERA Approved"
        ],
        "description": "A private hilltop fort villa designed for intimate royal weddings, boasting panoramic water views and hand-carved sandstone architecture."
      }
    ]
  },
  "Jaipur": {
    "venues": [
      {
        "id": "jpr-v1",
        "name": "Rambagh Palace",
        "type": "Taj palace hotel",
        "capacity": "Large garden palace (prestige lists)",
        "pricePerEvent": "Indicative ₹2.5–7 Cr",
        "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
        "vibe": "Former Maharaja residence",
        "highlights": [
          "47 acres of Mughal gardens",
          "Suvarna Mahal and palace corridors",
          "Central Jaipur flight access"
        ],
        "description": "Former residence of the Maharaja of Jaipur, now a Taj flagship. Manicured gardens and palace halls make it Jaipur's most prestigious wedding address — not a ₹65-lakh lawn hire."
      },
      {
        "id": "jpr-v2",
        "name": "Samode Palace",
        "type": "Heritage palace buyout",
        "capacity": "Immersive out-of-town buyout",
        "pricePerEvent": "Indicative ₹1.5–4 Cr",
        "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&auto=format&fit=crop",
        "vibe": "Sheesh Mahal & Durbar Hall",
        "highlights": [
          "Hall of Mirrors fresco work",
          "Full-palace heritage buyout",
          "About an hour from Jaipur city"
        ],
        "areaNote": "Samode village, ~1 hour from Jaipur — not inside the Pink City",
        "description": "A 475-year-old palace famed for its Sheesh Mahal and Durbar Hall. It is a countryside heritage buyout near Jaipur, not a venue in C-Scheme or the walled city."
      }
    ],
    "properties": [
      {
        "id": "jpr-p1",
        "title": "The Royal Pink City Courtyard Estate",
        "propertyType": "Palace Mansion",
        "price": "₹18.5 Crores",
        "specs": "16 Royal Suites • 4.2 Acres • 1,500 Guest Lawns",
        "location": "Kukas Palace Corridor, Jaipur",
        "image": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Helipad",
          "Centrally Air-Conditioned Banquet Hall",
          "Ornate Frescoed Courtyard",
          "Guard Towers"
        ],
        "description": "Palatial 16-suite heritage estate equipped with grand banquet lawns, private helipad, and majestic arches designed specifically for royal weddings."
      },
      {
        "id": "jpr-p2",
        "title": "Amer Foothills Heritage Residence",
        "propertyType": "Heritage Mansion",
        "price": "₹11.2 Crores",
        "specs": "10 Suites • 2.2 Acres • 800 Guest Lawns",
        "location": "Amer Fort Road, Jaipur",
        "image": "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Direct Amer Fort Sunset Views",
          "Private Amphitheater",
          "Spa & Wellness Wing",
          "Ample Guest Parking"
        ],
        "description": "Luxury heritage residence offering front-row views of Amer Fort, complete with private courtyard mandaps and guest accommodation suites."
      }
    ]
  },
  "Jaisalmer": {
    "venues": [
      {
        "id": "jsl-v1",
        "name": "Suryagarh",
        "type": "Desert fort-style hotel",
        "capacity": "Cinematic courtyards & ramparts",
        "pricePerEvent": "Indicative ₹1.5–4 Cr",
        "image": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=800&auto=format&fit=crop",
        "vibe": "Golden citadel on the Thar edge",
        "highlights": [
          "Fort-style luxury on the city outskirts",
          "Courtyards, ramparts, desert setting",
          "Among Jaisalmer's most booked wedding hotels"
        ],
        "areaNote": "On the outskirts of Jaisalmer, not inside the living fort",
        "description": "A fort-style luxury hotel outside Jaisalmer, built to feel like an ancient citadel. It is the city's most sought-after wedding address for dune-and-sandstone celebrations."
      }
    ],
    "properties": [
      {
        "id": "jsl-p1",
        "title": "Thar Golden Sandstone Palace Estate",
        "propertyType": "Oasis Palace Estate",
        "price": "₹12.0 Crores",
        "specs": "10 Suites • 5.0 Acres • 1,200 Guest Lawns",
        "location": "Sam Sand Dunes Highway, Jaisalmer",
        "image": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Private Sand Dune Arena",
          "Yellow Sandstone Jali Work",
          "Royal Tent Pavilion Grounds",
          "Borewell & Solar Grid"
        ],
        "description": "Exclusive golden sandstone palace property featuring desert sand dune arenas, sprawling lawns, and luxury guest quarters for royal desert nuptials."
      }
    ]
  },
  "Jodhpur": {
    "venues": [
      {
        "id": "jdh-v1",
        "name": "Umaid Bhawan Palace",
        "type": "Art Deco royal palace hotel",
        "capacity": "Typically 400+ with palace inventory",
        "pricePerEvent": "Indicative ₹4–12 Cr+",
        "image": "https://images.unsplash.com/photo-1564507592208-02754ba318dc?q=80&w=800&auto=format&fit=crop",
        "vibe": "Sandstone fortress palace",
        "highlights": [
          "Still partly a Jodhpur royal residence",
          "26-acre Art Deco palace",
          "Same ultra-luxury tier as Taj Lake Palace"
        ],
        "description": "One of the world's largest private residences, still partly home to the Jodhpur royal family. A 26-acre golden-sandstone Art Deco palace — trophy-tier tariffs, not a sub-crore lawn booking."
      }
    ],
    "properties": [
      {
        "id": "jdh-p1",
        "title": "Mehrangarh Vista Royal Haveli",
        "propertyType": "Heritage Haveli",
        "price": "₹10.5 Crores",
        "specs": "9 Suites • 1.8 Acres • 700 Guest Lawns",
        "location": "Ratanada Palace Zone, Jodhpur",
        "image": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Unobstructed Fort Views",
          "Rooftop Banquet Terrace",
          "Ornate Carved Pillars",
          "Private Swimming Pool"
        ],
        "description": "Historic Rathore haveli featuring uninterrupted vistas of Mehrangarh Fort, a grand rooftop celebration terrace, and luxury suites for wedding guests."
      }
    ]
  },
  "Pali": {
    "venues": [
      {
        "id": "pli-v1",
        "name": "Lawa Sardar Samand Palace",
        "type": "Heritage Lake Lodge",
        "capacity": "250 - 600 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
        "vibe": "Lakeside Marwar Heritage",
        "highlights": [
          "Wildlife Sanctuary Backdrop",
          "Private Lakefront Mandap",
          "Marwari Culinary Feasts"
        ],
        "description": "A heritage hunting lodge of Marwar rulers turned wedding sanctuary, situated alongside a tranquil lake surrounded by nature."
      }
    ],
    "properties": [
      {
        "id": "pli-p1",
        "title": "Marwar Heritage Estate & Farm",
        "propertyType": "Heritage Farmhouse Estate",
        "price": "₹4.8 Crores",
        "specs": "6 Suites • 3.5 Acres • 500 Guest Lawns",
        "location": "Ranakpur Road, Pali",
        "image": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Organic Orchard Lawns",
          "Stone Courtyard",
          "Guest Bungalows"
        ],
        "description": "Serene heritage farmhouse estate surrounded by lush orchards, ideal for intimate eco-luxury destination weddings."
      }
    ]
  },
  "Alwar": {
    "venues": [
      {
        "id": "alw-v1",
        "name": "Neemrana Fort-Palace",
        "type": "15th-Century Hill Fort",
        "capacity": "300 - 800 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
        "vibe": "Tiered Citadel Royalty",
        "highlights": [
          "14-tiered fort structure",
          "Hanging gardens and amphitheater",
          "Delhi–Jaipur highway access"
        ],
        "areaNote": "Neemrana, Alwar district — on the Delhi–Jaipur highway, not Alwar city",
        "description": "A 15th-century fort-palace on the Delhi–Jaipur highway, the closest grand heritage fort wedding to Delhi NCR. Indicative full-wedding bands elsewhere run about ₹80 lakh to ₹2.5 crore — confirm with the property."
      }
    ],
    "properties": [
      {
        "id": "alw-p1",
        "title": "Sariska Valley Fort Resort Property",
        "propertyType": "Fort Resort Villa",
        "price": "₹7.5 Crores",
        "specs": "10 Suites • 3.0 Acres • 800 Guest Lawns",
        "location": "Delhi-Mumbai Expressway Corridor, Alwar",
        "image": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Expressway Proximity",
          "Grand Lawn Pavilion",
          "Private Cottages"
        ],
        "description": "Modernized fort-resort property offering quick connectivity to Delhi NCR, featuring 10 luxury suites and celebration grounds."
      }
    ]
  },
  "Pushkar": {
    "venues": [
      {
        "id": "psk-v1",
        "name": "The Westin Pushkar Resort & Spa",
        "type": "Luxury Desert Spa Resort",
        "capacity": "400 - 1,200 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
        "vibe": "Sacred Oasis Luxury",
        "highlights": [
          "Spiritual Vedic Mandap Ceremonies",
          "Private Villa Pools",
          "Massive Banquet Lawns"
        ],
        "description": "Nestled among the Aravalli hills, offering sacred Vedic wedding rituals combined with world-class resort amenities."
      }
    ],
    "properties": [
      {
        "id": "psk-p1",
        "title": "Aravalli Sacred Lakefront Estate",
        "propertyType": "Spiritual Heritage Estate",
        "price": "₹6.2 Crores",
        "specs": "8 Suites • 2.0 Acres • 600 Guest Lawns",
        "location": "Pushkar Bypass Road, Pushkar",
        "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Vedic Ritual Pavilion",
          "Organic Herb Gardens",
          "Courtyard Mandap"
        ],
        "description": "Peaceful heritage estate combining traditional Marwari architecture with dedicated spaces for sacred wedding mandaps."
      }
    ]
  },
  "Kota": {
    "venues": [
      {
        "id": "kta-v1",
        "name": "Umed Bhawan Palace, Kotah",
        "type": "Heritage palace hotel",
        "capacity": "Multiple palace event spaces",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
        "vibe": "Riverside Victorian Heritage",
        "highlights": [
          "Lush Royal Lawns",
          "High-Ceilinged Ballrooms",
          "Chambal River Breeze"
        ],
        "description": "Kota's principal heritage hotel, owned and operated by the royal family of Kotah. Victorian-Rajput palace grounds used for weddings and gatherings — confirm current tariff directly with the property."
      }
    ],
    "properties": [
      {
        "id": "kta-p1",
        "title": "Chambal Riverside Palace Mansion",
        "propertyType": "Riverside Estate",
        "price": "₹5.5 Crores",
        "specs": "7 Suites • 2.5 Acres • 700 Guest Lawns",
        "location": "Chambal Riverfront Drive, Kota",
        "image": "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Private River Pier",
          "Manicured Gardens",
          "Grand Entrance Gates"
        ],
        "description": "Riverfront mansion offering serene water views and generous lawn grounds for high-capacity weddings."
      }
    ]
  },
  "Bikaner": {
    "venues": [
      {
        "id": "bkn-v1",
        "name": "Lallgarh Palace Lawns",
        "type": "Red Sandstone Palace",
        "capacity": "400 - 1,000 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
        "vibe": "Red Sandstone Grandeur",
        "highlights": [
          "Intricate Carved Carvings",
          "Peacock Courtyards",
          "Authentic Bikaneri Sweets Banquet"
        ],
        "description": "Designed by Sir Swinton Jacob in Indo-Saracenic style with red sandstone lattice work, perfect for royal desert ceremonies."
      }
    ],
    "properties": [
      {
        "id": "bkn-p1",
        "title": "Junagarh Heritage Sandstone Haveli",
        "propertyType": "Red Sandstone Haveli",
        "price": "₹4.2 Crores",
        "specs": "6 Suites • 1.5 Acres • 500 Guest Lawns",
        "location": "Sadul Ganj Heritage Zone, Bikaner",
        "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Carved Sandstone Facade",
          "Rooftop Sheesh Mahal",
          "Inner Courtyard Mandap"
        ],
        "description": "Authentic red sandstone haveli property ideal for boutique heritage weddings and intimate cultural receptions."
      }
    ]
  },
  "Rajsamand": {
    "venues": [
      {
        "id": "rjs-v1",
        "name": "Nathdwara Royal Lakefront Grounds",
        "type": "Lakefront Pilgrimage Resort",
        "capacity": "300 - 800 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop",
        "vibe": "Marble Lakeside Serenity",
        "highlights": [
          "Proximity to Shrinathji Temple",
          "White Marble Promenade Mandap",
          "Pure Vegetarian Feast Facilities"
        ],
        "description": "Situated on the banks of Rajsamand Lake, combining auspicious spiritual proximity with scenic white marble pavilions."
      }
    ],
    "properties": [
      {
        "id": "rjs-p1",
        "title": "White Marble Lakefront Palace Villa",
        "propertyType": "Marble Villa Estate",
        "price": "₹3.8 Crores",
        "specs": "5 Suites • 2.0 Acres • 450 Guest Lawns",
        "location": "Kankroli Lake View, Rajsamand",
        "image": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Carved White Marble Arches",
          "Direct Lake View",
          "Private Prayer Pavilion"
        ],
        "description": "Exclusive villa crafted entirely from fine Makrana marble, featuring lakefront ceremony grounds."
      }
    ]
  },
  "Ahmedabad": {
    "venues": [
      {
        "id": "amd-v1",
        "name": "Hyatt Ahmedabad",
        "type": "City hotel & ballroom",
        "capacity": "Up to about 1,000 guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
        "vibe": "Grand ballroom & show kitchen",
        "highlights": [
          "Grand Ballroom and Merge venues",
          "Show Kitchen dining format",
          "Hotel room inventory for outstation guests"
        ],
        "description": "Hyatt Ahmedabad's wedding programme covers the Grand Ballroom, The Merge, and a show-kitchen format for large city weddings with on-site guest rooms."
      },
      {
        "id": "amd-v2",
        "name": "The House of MG",
        "type": "Heritage boutique hotel",
        "capacity": "Lawns and halls up to about 700 guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&auto=format&fit=crop",
        "vibe": "Old-city pol mansion",
        "highlights": [
          "Ahmedabad's boutique heritage hotel",
          "Courtyards, lawns, and banquet halls",
          "In the historic walled city"
        ],
        "description": "A 1924 heritage mansion and Ahmedabad's boutique heritage hotel, used for lawn and courtyard weddings in the UNESCO historic city. Confirm plate rates and buyout rules with the property."
      }
    ],
    "properties": [
      {
        "id": "amd-p1",
        "title": "Sindhu Bhavan Royal Celebration Villa",
        "propertyType": "Luxury Farmhouse Estate",
        "price": "₹16.8 Crores",
        "specs": "10 Suites • 3.0 Acres • 1,500 Guest Lawns",
        "location": "Sindhu Bhavan Extension, Ahmedabad",
        "image": "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=800&auto=format&fit=crop",
        "features": [
          "2-Acre Manicured Lawns",
          "Commercial Kitchen Infrastructure",
          "Private Guest Bungalows",
          "High-End Security"
        ],
        "description": "Modern palatial villa estate on Sindhu Bhavan Extension featuring massive manicured lawns and luxury guest suites designed for destination weddings."
      }
    ]
  },
  "Surat": {
    "venues": [
      {
        "id": "srt-v1",
        "name": "Summer Palace, Dumas",
        "type": "Dumas wedding venue",
        "capacity": "Large lawn and banquet campus",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
        "vibe": "Coastal Surat celebrations",
        "highlights": [
          "Established Dumas wedding campus",
          "Lawns and indoor banquet spaces",
          "Near the Dumas–Hazira coastal belt"
        ],
        "areaNote": "Dumas, on Surat's coastal belt",
        "description": "An established wedding campus in Dumas used for lawn and banquet celebrations. Confirm current capacity and tariff with the venue."
      }
    ],
    "properties": [
      {
        "id": "srt-p1",
        "title": "Vesu Imperial Celebration Manor",
        "propertyType": "Urban Mansion Estate",
        "price": "₹13.5 Crores",
        "specs": "8 Suites • 2.5 Acres • 1,200 Guest Lawns",
        "location": "Vesu VIP Road, Surat",
        "image": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Covered Glass Pavilion",
          "Private Swimming Pool",
          "Basement Guest Parking"
        ],
        "description": "Stately residence in ultra-prime Vesu equipped with celebration lawns, guest suites, and air-conditioned banquet facilities."
      }
    ]
  },
  "Rajkot": {
    "venues": [
      {
        "id": "raj-v1",
        "name": "Saurashtra Heritage Club Grounds",
        "type": "Heritage Club Estate",
        "capacity": "500 - 1,500 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop",
        "vibe": "Saurashtra Regal Charm",
        "highlights": [
          "Colonial Club Architecture",
          "Royal Kathiawadi Banquet",
          "Cricket Pitch Ground Space"
        ],
        "description": "Sprawling heritage club grounds providing classic Saurashtrian hospitality for high-capacity weddings."
      }
    ],
    "properties": [
      {
        "id": "raj-p1",
        "title": "Kalawad Road Royal Farm Villa",
        "propertyType": "Luxury Farm Villa",
        "price": "₹6.8 Crores",
        "specs": "6 Suites • 3.0 Acres • 1,000 Guest Lawns",
        "location": "Kalawad Road Corridor, Rajkot",
        "image": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800&auto=format&fit=crop",
        "features": [
          "3-Acre Green Lawns",
          "Private Sangeet Stage",
          "Caretaker Quarters"
        ],
        "description": "Expansive farm villa estate along Kalawad Road offering generous open lawns ideal for wedding functions."
      }
    ]
  },
  "Gandhinagar": {
    "venues": [
      {
        "id": "gnd-v1",
        "name": "GIFT City Riverside Resort & Convention",
        "type": "Modern Financial District Resort",
        "capacity": "500 - 2,000 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
        "vibe": "Futuristic Green Luxury",
        "highlights": [
          "Eco-Friendly Helipad",
          "River View Lawns",
          "International Guest Suites"
        ],
        "description": "State-of-the-art green resort adjacent to GIFT City, offering modern luxury convention spaces and riverfront lawns."
      }
    ],
    "properties": [
      {
        "id": "gnd-p1",
        "title": "GIFT Corridor Green Villa Estate",
        "propertyType": "Modern Villa Estate",
        "price": "₹11.5 Crores",
        "specs": "7 Suites • 2.5 Acres • 900 Guest Lawns",
        "location": "Koba Circle - GIFT City Road, Gandhinagar",
        "image": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Wide Tree-Lined Driveway",
          "Solar Power Grid",
          "Indoor Air-Conditioned Banquet"
        ],
        "description": "Ultra-modern villa estate situated in Gandhinagar's green corridor with dedicated event lawns and private suites."
      }
    ]
  },
  "Kutch": {
    "venues": [
      {
        "id": "ktc-v1",
        "name": "White Rann Desert Tent Resort",
        "type": "White Salt Desert Arena",
        "capacity": "300 - 1,000 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=800&auto=format&fit=crop",
        "vibe": "Full Moon White Desert Magic",
        "highlights": [
          "Full Moon Night Mandap",
          "Kutchi Folk Music & Dance",
          "Luxury Swiss Tents"
        ],
        "description": "Unforgettable destination wedding setting on the glistening white salt desert of Kutch under starry skies."
      }
    ],
    "properties": [
      {
        "id": "ktc-p1",
        "title": "Mandvi Beachfront Heritage Villa",
        "propertyType": "Beachfront Villa Estate",
        "price": "₹5.2 Crores",
        "specs": "6 Suites • 2.8 Acres • 600 Guest Lawns",
        "location": "Mandvi Beach Road, Kutch",
        "image": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Private Beach Access",
          "Kutchi Woodwork Carvings",
          "Windmill Vistas"
        ],
        "description": "Coastal villa estate in historic Mandvi offering private beach frontage and serene Arabian Sea backdrop."
      }
    ]
  },
  "Anand": {
    "venues": [
      {
        "id": "and-v1",
        "name": "Vidyanagar Country Club Lawns",
        "type": "Suburban Golf & Country Club",
        "capacity": "400 - 1,200 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop",
        "vibe": "Green Suburb Elegance",
        "highlights": [
          "Golf Course Views",
          "Organic Catering Facilities",
          "Spacious Guest Rooms"
        ],
        "description": "Tranquil golf club resort setting offering lush lawns and pristine suburban air for wedding events."
      }
    ],
    "properties": [
      {
        "id": "and-p1",
        "title": "Karamsad Heritage Ancestral Farmhouse",
        "propertyType": "Heritage Farmhouse",
        "price": "₹4.5 Crores",
        "specs": "5 Suites • 2.2 Acres • 500 Guest Lawns",
        "location": "Karamsad Suburb, Anand",
        "image": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Traditional Courtyard",
          "Manicured Lawns",
          "Fruit Orchards"
        ],
        "description": "Classic Gujarati farmhouse estate featuring authentic courtyard architecture and green celebration lawns."
      }
    ]
  },
  "Shimla": {
    "venues": [
      {
        "id": "sml-v1",
        "name": "Wildflower Hall Mountain Lawns",
        "type": "Luxury Himalayan Mountain Resort",
        "capacity": "200 - 600 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
        "vibe": "Cedar Forest Romance",
        "highlights": [
          "8,250 ft Snow Peak Panorama",
          "Open-Air Heated Jacuzzi Deck",
          "Colonial Ballroom"
        ],
        "description": "Perched 8,250 feet up among pine and cedar forests, offering fairytale mountain mandap setups and colonial luxury."
      },
      {
        "id": "sml-v2",
        "name": "Woodville Palace Estate",
        "type": "Colonial Heritage Manor",
        "capacity": "250 - 500 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&auto=format&fit=crop",
        "vibe": "Tudor Era Elegance",
        "highlights": [
          "Vintage Rose Gardens",
          "Hollywood & Bollywood Heritage",
          "Fireplace Lounge Suites"
        ],
        "description": "Former country residence of the Raja of Jubbal, famous for vintage rose garden ceremonies and pine-clad hillsides."
      }
    ],
    "properties": [
      {
        "id": "sml-p1",
        "title": "Cedar Peak Himalayan Mountain Manor",
        "propertyType": "Mountain Estate Villa",
        "price": "₹8.5 Crores",
        "specs": "7 Alpine Suites • 1.8 Acres • 400 Guest Lawns",
        "location": "Mashobra Heights, Shimla",
        "image": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
        "features": [
          "360° Snow Peak Vistas",
          "Private Pine Forest Path",
          "Helipad Access"
        ],
        "description": "Luxury alpine manor in Mashobra featuring unobstructed Himalayan snow-peak views, private pine forest, and terraced mandap lawns."
      }
    ]
  },
  "Dharamshala": {
    "venues": [
      {
        "id": "dhm-v1",
        "name": "Hyatt Regency Dharamshala Resort",
        "type": "Dhauladhar Mountain Resort",
        "capacity": "250 - 700 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
        "vibe": "Dhauladhar Serenity",
        "highlights": [
          "Pine Forest Sunset Lawn",
          "Tibetan Singing Bowl Welcome",
          "Heated Pool Deck"
        ],
        "description": "Nestled in dense pine forests beneath the majestic Dhauladhar ranges, ideal for serene mountain wedding celebrations."
      }
    ],
    "properties": [
      {
        "id": "dhm-p1",
        "title": "Kangra Valley Pine & Stream Estate",
        "propertyType": "Stream-Side Mountain Villa",
        "price": "₹6.8 Crores",
        "specs": "6 Alpine Suites • 2.2 Acres • 450 Guest Lawns",
        "location": "Sidhbari Valley, Dharamshala",
        "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Natural Mountain Stream",
          "Dhauladhar Views",
          "Yoga & Meditation Deck"
        ],
        "description": "Tranquil mountain estate along a natural stream, offering scenic lawn spaces for intimate destination weddings."
      }
    ]
  },
  "Chandigarh": {
    "venues": [
      {
        "id": "chd-v1",
        "name": "Sukhna Lakefront Club Lawns",
        "type": "Lakefront Country Club",
        "capacity": "500 - 1,800 Guests",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
        "vibe": "Modern Punjabi Glamour",
        "highlights": [
          "Lakefront Sunset Backdrop",
          "Grand Sangeet Stage Infrastructure",
          "Bhangra & Dhol Welcome"
        ],
        "description": "Situated on the banks of Sukhna Lake, offering high-capacity lawn spaces and vibrant Punjabi celebration vibes."
      }
    ],
    "properties": [
      {
        "id": "chd-p1",
        "title": "Kasauli Foothill Farmhouse Estate",
        "propertyType": "Luxury Farmhouse Estate",
        "price": "₹14.2 Crores",
        "specs": "9 Suites • 4.0 Acres • 1,200 Guest Lawns",
        "location": "Chandigarh-Kalka Expressway, Chandigarh",
        "image": "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=800&auto=format&fit=crop",
        "features": [
          "4-Acre Manicured Lawns",
          "Private Guesthouse Wing",
          "Infinity Pool"
        ],
        "description": "Sprawling 4-acre farmhouse estate at the foothills of the Himalayas, designed for large destination weddings and pre-wedding functions."
      }
    ]
  },
  "Agra": {
    "venues": [
      {
        "id": "agr-v1",
        "name": "The Oberoi Amarvilas",
        "type": "Taj-view luxury hotel",
        "capacity": "Garden functions (confirm with hotel)",
        "pricePerEvent": "Tariff on request",
        "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
        "vibe": "Mughal gardens, 600 m from the Taj",
        "highlights": [
          "Taj Mahal views from every room and suite",
          "600 metres from the East Gate",
          "Terraced lawns, pools, and pavilions"
        ],
        "description": "The Oberoi Amarvilas is the Agra luxury hotel with unrestricted Taj Mahal views from all rooms. ITC Mughal is a separate Mughal-garden resort and does not offer that sightline from every space."
      }
    ],
    "properties": [
      {
        "id": "agr-p1",
        "title": "Fatehabad Taj View Mansion",
        "propertyType": "Heritage Mansion",
        "price": "₹7.8 Crores",
        "specs": "7 Suites • 2.0 Acres • 700 Guest Lawns",
        "location": "Fatehabad Tourist Corridor, Agra",
        "image": "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=800&auto=format&fit=crop",
        "features": [
          "Rooftop Taj View Pavilion",
          "Mughal Arch Courtyards",
          "Private Banquet Hall"
        ],
        "description": "Mughal-inspired mansion property on Fatehabad corridor featuring rooftop views of the Taj Mahal and spacious celebration grounds."
      }
    ]
  }
};

export function weddingCatalogFor(city: string) {
  const key = Object.keys(WEDDING_CATALOG).find((k) => k.toLowerCase() === city.trim().toLowerCase());
  return key ? WEDDING_CATALOG[key] : { venues: [], properties: [] };
}
