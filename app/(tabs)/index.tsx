import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Dimensions,
  TextInput,
  FlatList,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import {
  Heart,
  Search,
  Bell,
  MapPin,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  RotateCcw,
  Home,
  Building2,
  Building,
  Tag,
  Key,
  Map,
  Percent,
  TrendingUp,
  ShieldCheck,
  Star,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

const CITIES = ["Udaipur", "Jaipur", "Jodhpur", "Bikaner", "Kota"];

const SEARCH_SUGGESTIONS = [
  "3 BHK in Udaipur",
  "Villa near Lake Pichola",
  "Commercial space in Jaipur",
  "Plots in Jodhpur",
];

// Unified single notifications list
const initialNotifications = [
  {
    id: "n-1",
    title: "New Inquiry Received 📩",
    message: "App User submitted an inquiry for your property 'Premium 3 BHK Flat in C-Scheme'. Get client details now.",
    time: "30 mins ago",
    read: false,
    tag: "Lead",
    isBroker: true,
  },
  {
    id: "n-2",
    title: "Price Drop Alert! 📉",
    message: "Ultra Luxury Lake-Facing Villa price dropped by ₹15 Lakhs! Tap to view current valuation details.",
    time: "2 hrs ago",
    read: false,
    tag: "Price Drop",
    isBroker: false,
  },
  {
    id: "n-3",
    title: "Property Verification Completed ✅",
    message: "The Premium 3 BHK Flat in C-Scheme, Jaipur has completed 5-point physical & legal verification check.",
    time: "5 hrs ago",
    read: false,
    tag: "Verified",
    isBroker: false,
  },
  {
    id: "n-4",
    title: "Listing Verification Success 🎉",
    message: "Your newly listed property 'Heritage 5 BHK Bungalow' has successfully passed RERA and title-deed checks.",
    time: "4 hrs ago",
    read: false,
    tag: "RERA Clear",
    isBroker: true,
  },
  {
    id: "n-5",
    title: "Broker Callback Confirmed 📞",
    message: "Rajesh Mehta from Lake City Brokerage has accepted your callback request for 5:30 PM today.",
    time: "1 day ago",
    read: true,
    tag: "Callback",
    isBroker: false,
  },
  {
    id: "n-6",
    title: "Missing Document Alert ⚠️",
    message: "Action Required: Re-upload tax clearance files to keep 'Cozy 3 BHK House' listing active.",
    time: "1 day ago",
    read: true,
    tag: "Compliance",
    isBroker: true,
  }
];

export default function HomeScreen() {
  const router = useRouter();
  const { properties, selectedCity, setSelectedCity, favorites, toggleFavorite, userRole } = useApp();

  const [searchText, setSearchText] = useState("");
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [activePurpose, setActivePurpose] = useState<"buy" | "rent" | "commercial">("buy");
  const scrollRef = useRef<ScrollView>(null);

  // Layout states
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  // Custom Filter State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterPurpose, setFilterPurpose] = useState<"all" | "buy" | "rent" | "commercial">("all");
  const [filterType, setFilterType] = useState<"all" | "Villa" | "Apartment" | "Home" | "Industrial Plot">("all");
  const [filterBhk, setFilterBhk] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all");
  const [filterFurnishing, setFilterFurnishing] = useState<"all" | "Furnished" | "Semi-Furnished" | "Unfurnished">("all");
  const [filterPrice, setFilterPrice] = useState<"all" | "under-50k" | "under-50L" | "under-2Cr" | "under-10Cr">("all");

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatPrice = (num: number) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(0)}L`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatIndianPrice = (num: number) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} Lakh`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setShowCityDropdown(false);
  };

  const handleClearAllFilters = () => {
    setSearchText("");
    setFilterPurpose("all");
    setFilterType("all");
    setFilterBhk("all");
    setFilterFurnishing("all");
    setFilterPrice("all");
  };

  // Live filter evaluation
  const filteredProperties = properties.filter((prop) => {
    // 1. City Filter (matches selectedCity)
    const matchesCity = prop.city.toLowerCase() === selectedCity.toLowerCase();
    
    // 2. Search Text Filter (matches title, locality, type)
    const matchesSearch = searchText === "" || 
      prop.title.toLowerCase().includes(searchText.toLowerCase()) ||
      prop.locality.toLowerCase().includes(searchText.toLowerCase()) ||
      prop.type.toLowerCase().includes(searchText.toLowerCase());

    // 3. Purpose Filter
    let matchesPurpose = true;
    if (filterPurpose !== "all") {
      if (filterPurpose === "buy") matchesPurpose = prop.purpose === "buy";
      else if (filterPurpose === "rent") matchesPurpose = prop.purpose === "rent";
      else if (filterPurpose === "commercial") {
        matchesPurpose = (prop.type === "Commercial Space" || prop.type === "Office Space" || prop.type === "Shop" || prop.type === "Industrial Plot");
      }
    }

    // 4. Property Type Filter
    const matchesType = filterType === "all" || prop.type === filterType;

    // 5. BHK Filter
    const matchesBhk = filterBhk === "all" || prop.bhk === parseInt(filterBhk);

    // 6. Furnishing Filter
    const matchesFurnishing = filterFurnishing === "all" || prop.furnished === filterFurnishing;

    // 7. Price Filter
    let matchesPrice = true;
    if (filterPrice !== "all") {
      if (filterPrice === "under-50k") matchesPrice = prop.price <= 50000;
      else if (filterPrice === "under-50L") matchesPrice = prop.price > 50000 && prop.price <= 5000000;
      else if (filterPrice === "under-2Cr") matchesPrice = prop.price <= 20000000;
      else if (filterPrice === "under-10Cr") matchesPrice = prop.price <= 100000000;
    }

    return matchesCity && matchesSearch && matchesPurpose && matchesType && matchesBhk && matchesFurnishing && matchesPrice;
  });

  const isFilteringActive = searchText !== "" || 
    filterPurpose !== "all" || 
    filterType !== "all" || 
    filterBhk !== "all" || 
    filterFurnishing !== "all" || 
    filterPrice !== "all";

  // Dashboard content calculations
  const featuredProps = properties
    .filter((p) => (p.featured || p.reraApproved) && p.city.toLowerCase() === selectedCity.toLowerCase())
    .slice(0, 6);

  const purposeFiltered = properties.filter((p) => {
    const cityMatch = p.city.toLowerCase() === selectedCity.toLowerCase();
    if (!cityMatch) return false;
    if (activePurpose === "buy") return p.purpose === "buy";
    if (activePurpose === "rent") return p.purpose === "rent";
    return p.type === "Commercial Space" || p.type === "Office Space" || p.type === "Shop" || p.type === "Industrial Plot";
  }).slice(0, 8);

  const services = [
    { label: "Buy", icon: Home, tint: "#005B96", bg: "#EEF7FC", action: () => router.push("/explore") },
    { label: "Rent", icon: Key, tint: "#E05A36", bg: "#FDF2EE", action: () => router.push("/explore") },
    { label: "Sell", icon: Tag, tint: "#15803D", bg: "#F0FDF4", action: () => router.push("/post-property" as any) },
    { label: "Plots", icon: Map, tint: "#D97706", bg: "#FEF3C7", action: () => router.push("/explore") },
    { label: "Commercial", icon: Building, tint: "#7C3AED", bg: "#FAF5FF", action: () => router.push("/explore") },
    { label: "New Projects", icon: Building2, tint: "#0891B2", bg: "#ECFEFF", action: () => router.push("/explore") },
    { label: "Home Loan", icon: Percent, tint: "#2563EB", bg: "#EFF6FF", action: () => Alert.alert("Home Loan", "Pre-approved at 8.4% p.a.") },
    { label: "Valuation", icon: TrendingUp, tint: "#DC2626", bg: "#FEF2F2", action: () => Alert.alert("Valuation", "Free property valuation by experts.") },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── STICKY HEADER ── */}
        <View style={styles.stickyHeader}>
          {/* Top bar: greeting + city dropdown + notifications */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
                
                {/* Custom Dropdown Trigger */}
                <Pressable
                  onPress={() => setShowCityDropdown(!showCityDropdown)}
                  style={styles.cityRow}
                >
                  <MapPin size={11} color="#E05A36" />
                  <Text style={styles.cityText}>{selectedCity}, India</Text>
                  <ChevronDown size={11} color="rgba(255,255,255,0.8)" />
                </Pressable>
              </View>
            </View>

            <View style={styles.topBarRight}>
              {/* Trigger Notification Drawer */}
              <Pressable style={styles.iconBtn} onPress={() => setShowNotifications(true)}>
                <Bell size={18} color="#FFFFFF" />
                <View style={styles.notifDot} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => router.push("/favorites")}>
                <Heart size={18} color="#FFFFFF" fill={favorites.length > 0 ? "#FF4D4D" : "transparent"} />
                {favorites.length > 0 && <View style={styles.notifDot} />}
              </Pressable>
            </View>
          </View>

          {/* Absolute Dropdown Overlay */}
          {showCityDropdown && (
            <View style={styles.dropdownOverlay}>
              {CITIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => handleCitySelect(c)}
                  style={[styles.dropdownItem, selectedCity === c && styles.dropdownItemActive]}
                >
                  <MapPin size={12} color={selectedCity === c ? "#E05A36" : "#94A3B8"} />
                  <Text style={[styles.dropdownItemText, selectedCity === c && styles.dropdownItemTextActive]}>
                    {c}
                  </Text>
                  {selectedCity === c && <Check size={12} color="#E05A36" style={{ marginLeft: "auto" }} />}
                </Pressable>
              ))}
            </View>
          )}

          {/* Search Bar & Custom Filters Toggle */}
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Search size={16} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search flats, villas, plots in ${selectedCity}…`}
                placeholderTextColor="#9CA3AF"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText !== "" && (
                <Pressable onPress={() => setSearchText("")} style={{ padding: 4 }}>
                  <X size={14} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
            <Pressable style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
              <SlidersHorizontal size={18} color="#FFFFFF" />
              {isFilteringActive && <View style={styles.filterActiveDot} />}
            </Pressable>
          </View>

          {/* Quick city pill selectors */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cityPillsRow}
          >
            {CITIES.map((city) => (
              <Pressable
                key={city}
                onPress={() => handleCitySelect(city)}
                style={[styles.cityPill, selectedCity === city && styles.cityPillActive]}
              >
                <Text style={[styles.cityPillText, selectedCity === city && styles.cityPillTextActive]}>
                  {city}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── BODY ── */}
        <View style={styles.body}>
          {isFilteringActive ? (
            /* ────────────────────────────────────────────────────────
               ── FILTERED PROPERTIES LIST (ACCURATE HIGH-END LAYOUT) ──
               ──────────────────────────────────────────────────────── */
            <View style={styles.filteredContainer}>
              <View style={styles.filteredHeaderRow}>
                <Text style={styles.filteredTitle}>
                  {filteredProperties.length} {filteredProperties.length === 1 ? "Property" : "Properties"} Found
                </Text>
                <Pressable onPress={handleClearAllFilters} style={styles.clearFiltersBtn}>
                  <RotateCcw size={12} color="#E05A36" />
                  <Text style={styles.clearFiltersText}>Reset</Text>
                </Pressable>
              </View>

              {filteredProperties.length === 0 ? (
                <View style={styles.emptyFilteredContainer}>
                  <View style={{ marginBottom: 15, width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(224, 90, 54, 0.08)", alignItems: 'center', justifyContent: 'center' }}>
                    <Search size={30} color="#E05A36" />
                  </View>
                  <Text style={styles.emptyFilteredText}>No properties match your filters</Text>
                  <Text style={styles.emptyFilteredSub}>Try loosening your search query or adjusting your filters.</Text>
                  <Pressable onPress={handleClearAllFilters} style={styles.resetBtnLarge}>
                    <Text style={styles.resetBtnLargeText}>Reset All Filters</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.filteredCardsGrid}>
                  {filteredProperties.map((prop) => {
                    const isFav = favorites.includes(prop.id);
                    return (
                      <Pressable
                        key={prop.id}
                        onPress={() => router.push({ pathname: "/property/[id]", params: { id: prop.id } } as any)}
                        style={styles.accurateCard}
                      >
                        <View style={styles.accurateCardImgWrap}>
                          <Image source={{ uri: prop.images[0] }} style={styles.accurateCardImg} />
                          {prop.reraApproved && (
                            <View style={styles.accurateCardReraBadge}>
                              <ShieldCheck size={9} color="#FFFFFF" fill="#10B981" />
                              <Text style={styles.accurateCardReraText}>RERA APPROVED</Text>
                            </View>
                          )}
                          <View style={styles.accurateCardPurposeBadge}>
                            <Text style={styles.accurateCardPurposeText}>
                              {prop.purpose === "buy" ? "FOR SALE" : prop.purpose === "rent" ? "FOR RENT" : "LEASE"}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => toggleFavorite(prop.id)}
                            style={styles.accurateCardFavBtn}
                          >
                            <Heart size={14} color={isFav ? "#FF4D4D" : "#6B7280"} fill={isFav ? "#FF4D4D" : "transparent"} />
                          </Pressable>
                        </View>
                        <View style={styles.accurateCardInfo}>
                          <View style={styles.accurateCardPriceRow}>
                            <Text style={styles.accurateCardPrice}>{formatIndianPrice(prop.price)}</Text>
                            {(prop.purpose === "rent" || prop.purpose === "lease") && (
                              <Text style={styles.accurateCardPriceSub}>/ mo</Text>
                            )}
                          </View>
                          <Text style={styles.accurateCardTitle} numberOfLines={1}>{prop.title}</Text>
                          <View style={styles.accurateCardLocRow}>
                            <MapPin size={11} color="#6B7280" />
                            <Text style={styles.accurateCardLoc} numberOfLines={1}>{prop.locality}, {prop.city}</Text>
                          </View>
                          <View style={styles.accurateCardMeta}>
                            {prop.bhk && (
                              <View style={styles.accurateCardMetaChip}>
                                <Text style={styles.accurateCardMetaChipText}>{prop.bhk} BHK</Text>
                              </View>
                            )}
                            <View style={styles.accurateCardMetaChip}>
                              <Text style={styles.accurateCardMetaChipText}>{prop.size} sqft</Text>
                            </View>
                            <View style={styles.accurateCardMetaChip}>
                              <Text style={styles.accurateCardMetaChipText}>{prop.furnished}</Text>
                            </View>
                            <View style={[styles.accurateCardMetaChip, { backgroundColor: "rgba(0, 91, 150, 0.05)" }]}>
                              <Text style={[styles.accurateCardMetaChipText, { color: "#005B96" }]}>{prop.type}</Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ) : (
            /* ────────────────────────────────────────────────────────
               ── DEFAULT DASHBOARD LAYOUT (RICH EXPERIENTIAL HUB)   ──
               ──────────────────────────────────────────────────────── */
            <>
              {/* ── PURPOSE TABS + PROPERTY LIST ── */}
              <View style={styles.purposeSection}>
                <View style={styles.purposeTabRow}>
                  {(["buy", "rent", "commercial"] as const).map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setActivePurpose(p)}
                      style={[styles.purposeTab, activePurpose === p && styles.purposeTabActive]}
                    >
                      <Text style={[styles.purposeTabText, activePurpose === p && styles.purposeTabTextActive]}>
                        {p === "buy" ? "Buy" : p === "rent" ? "Rent" : "Commercial"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Horizontal property cards */}
                {purposeFiltered.length === 0 ? (
                  <View style={{ paddingVertical: 30, alignItems: "center" }}>
                    <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: '600' }}>No matching properties in {selectedCity} yet.</Text>
                  </View>
                ) : (
                  <FlatList
                    data={purposeFiltered}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.propListContent}
                    renderItem={({ item: prop }) => {
                      const isFav = favorites.includes(prop.id);
                      return (
                        <Pressable
                          onPress={() => router.push({ pathname: "/property/[id]", params: { id: prop.id } } as any)}
                          style={styles.propCard}
                        >
                          <View style={styles.propImgWrap}>
                            <Image source={{ uri: prop.images[0] }} style={styles.propImg} />
                            {/* Badges */}
                            <View style={styles.propBadges}>
                              {prop.reraApproved && (
                                <View style={styles.reraMini}>
                                  <ShieldCheck size={8} color="#10B981" />
                                  <Text style={styles.reraMiniText}>RERA</Text>
                                </View>
                              )}
                              <View style={[styles.purposeBadge, prop.purpose === "buy" ? styles.buyBadge : styles.rentBadge]}>
                                <Text style={styles.purposeBadgeText}>
                                  {prop.purpose === "buy" ? "For Sale" : "For Rent"}
                                </Text>
                              </View>
                            </View>
                            {/* Fav button */}
                            <Pressable onPress={() => toggleFavorite(prop.id)} style={styles.favBtn}>
                              <Heart size={11} color={isFav ? "#FF4D4D" : "#6B7280"} fill={isFav ? "#FF4D4D" : "transparent"} />
                            </Pressable>
                          </View>
                          <View style={styles.propInfo}>
                            <Text style={styles.propPrice}>{formatPrice(prop.price)}</Text>
                            <Text style={styles.propTitle} numberOfLines={1}>{prop.title}</Text>
                            <View style={styles.propLocRow}>
                              <MapPin size={9} color="#9CA3AF" />
                              <Text style={styles.propLoc} numberOfLines={1}>{prop.locality}</Text>
                            </View>
                            <View style={styles.propSpecsRow}>
                              {prop.bhk && <Text style={styles.propSpec}>{prop.bhk} BHK</Text>}
                              {prop.bhk && <View style={styles.propSpecDot} />}
                              <Text style={styles.propSpec}>{prop.size} sqft</Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    }}
                  />
                )}
              </View>

              {/* ── SERVICES GRID ── */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Our Services</Text>
                </View>
                <View style={styles.servicesGrid}>
                  {services.map((svc, idx) => {
                    const Icon = svc.icon;
                    return (
                      <Pressable key={idx} onPress={svc.action} style={styles.svcItem}>
                        <View style={[styles.svcIconBox, { backgroundColor: svc.bg }]}>
                          <Icon size={20} color={svc.tint} />
                        </View>
                        <Text style={styles.svcLabel}>{svc.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* ── PROMO BANNER ── */}
              <View style={styles.promoBannerOuter}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={(e) => setActivePromoIndex(Math.round(e.nativeEvent.contentOffset.x / (width - 40)))}
                  scrollEventThrottle={16}
                >
                  {/* Slide 1 */}
                  <View style={[styles.promoBanner, styles.promoBanner1, { width: width - 40 }]}>
                    <View style={styles.promoLeft}>
                      <View style={styles.promoChip}>
                        <Sparkles size={9} color="#FFFFFF" />
                        <Text style={styles.promoChipText}>Premium</Text>
                      </View>
                      <Text style={styles.promoH1}>Find Your{"\n"}Dream Home</Text>
                      <Text style={styles.promoSub}>Starting at ₹45 Lakh</Text>
                      <Pressable onPress={() => router.push("/explore")} style={styles.promoBtn}>
                        <Text style={styles.promoBtnText}>Explore</Text>
                        <ArrowRight size={12} color="#FFFFFF" />
                      </Pressable>
                    </View>
                    <Image
                      source={{ uri: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&h=240&q=80" }}
                      style={styles.promoImg}
                    />
                  </View>

                  {/* Slide 2 */}
                  <View style={[styles.promoBanner, styles.promoBanner2, { width: width - 40 }]}>
                    <View style={styles.promoLeft}>
                      <View style={styles.promoChip}>
                        <ShieldCheck size={9} color="#FFFFFF" />
                        <Text style={styles.promoChipText}>Verified</Text>
                      </View>
                      <Text style={styles.promoH1}>RERA-Cleared{"\n"}Plots & Lands</Text>
                      <Text style={styles.promoSub}>Direct title deed verification</Text>
                      <Pressable onPress={() => router.push("/explore")} style={styles.promoBtn}>
                        <Text style={styles.promoBtnText}>View Plots</Text>
                        <ArrowRight size={12} color="#FFFFFF" />
                      </Pressable>
                    </View>
                    <Image
                      source={{ uri: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=300&h=240&q=80" }}
                      style={styles.promoImg}
                    />
                  </View>
                </ScrollView>

                {/* Dots */}
                <View style={styles.dotRow}>
                  {[0, 1].map((i) => (
                    <View key={i} style={[styles.dot, activePromoIndex === i && styles.dotActive]} />
                  ))}
                </View>
              </View>

              {/* ── FEATURED / NEW LISTINGS ── */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.fireEmoji}>🔥</Text>
                    <Text style={styles.sectionTitle}>Featured Listings</Text>
                  </View>
                  <Pressable onPress={() => router.push("/explore")} style={styles.viewAllBtn}>
                    <Text style={styles.viewAllText}>See All</Text>
                    <ChevronRight size={12} color="#E05A36" />
                  </Pressable>
                </View>

                {featuredProps.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: '600' }}>No featured properties in {selectedCity} currently.</Text>
                  </View>
                ) : (
                  <FlatList
                    data={featuredProps}
                    keyExtractor={(item) => `featured-${item.id}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.propListContent}
                    renderItem={({ item: prop }) => {
                      const isFav = favorites.includes(prop.id);
                      return (
                        <Pressable
                          onPress={() => router.push({ pathname: "/property/[id]", params: { id: prop.id } } as any)}
                          style={styles.featuredCard}
                        >
                          <View style={styles.featuredImgWrap}>
                            <Image source={{ uri: prop.images[0] }} style={styles.featuredImg} />
                            <View style={styles.featuredGradient} />
                            {/* Price overlay */}
                            <Text style={styles.featuredPriceOverlay}>{formatPrice(prop.price)}</Text>
                            {/* RERA chip */}
                            {prop.reraApproved && (
                              <View style={styles.reraChip}>
                                <ShieldCheck size={9} color="#10B981" />
                                <Text style={styles.reraChipText}>RERA</Text>
                              </View>
                            )}
                            {/* Fav */}
                            <Pressable onPress={() => toggleFavorite(prop.id)} style={styles.featuredFavBtn}>
                              <Heart size={12} color={isFav ? "#FF4D4D" : "#FFFFFF"} fill={isFav ? "#FF4D4D" : "transparent"} />
                            </Pressable>
                          </View>
                          <View style={styles.featuredInfo}>
                            <Text style={styles.featuredTitle} numberOfLines={1}>{prop.title}</Text>
                            <View style={styles.featuredLocRow}>
                              <MapPin size={10} color="#9CA3AF" />
                              <Text style={styles.featuredLoc} numberOfLines={1}>{prop.locality}, {prop.city}</Text>
                            </View>
                            <View style={styles.featuredMeta}>
                              {prop.bhk && (
                                <View style={styles.metaChip}>
                                  <Text style={styles.metaChipText}>{prop.bhk} BHK</Text>
                                </View>
                              )}
                              <View style={styles.metaChip}>
                                <Text style={styles.metaChipText}>{prop.size} sqft</Text>
                              </View>
                              <View style={styles.metaChip}>
                                <Text style={styles.metaChipText}>{prop.furnished}</Text>
                              </View>
                            </View>
                          </View>
                        </Pressable>
                      );
                    }}
                  />
                )}
              </View>

              {/* ── QUICK SEARCH SUGGESTIONS ── */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Trending Searches</Text>
                </View>
                <View style={styles.suggestionsGrid}>
                  {SEARCH_SUGGESTIONS.map((s, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setSearchText(s.replace(` in ${selectedCity}`, ""))}
                      style={styles.suggestionChip}
                    >
                      <Search size={11} color="#005B96" />
                      <Text style={styles.suggestionText}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* ── TRUST BADGES ROW ── */}
              <View style={[styles.section, { marginBottom: 0 }]}>
                <View style={styles.trustRow}>
                  {[
                    { icon: ShieldCheck, label: "RERA Verified", sub: "All listings checked", color: "#10B981" },
                    { icon: Star, label: "4.8 Rating", sub: "Trusted by 10k+", color: "#F59E0B" },
                    { icon: Home, label: "500+ Properties", sub: "Across 5 cities", color: "#005B96" },
                  ].map((t, i) => {
                    const TIcon = t.icon;
                    return (
                      <View key={i} style={styles.trustCard}>
                        <View style={[styles.trustIconWrap, { backgroundColor: t.color + "18" }]}>
                          <TIcon size={20} color={t.color} />
                        </View>
                        <Text style={styles.trustLabel}>{t.label}</Text>
                        <Text style={styles.trustSub}>{t.sub}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {/* bottom padding for floating tab bar */}
          <View style={{ height: 90 }} />
        </View>
      </ScrollView>

      {/* ────────────────────────────────────────────────────────
         ── NOTIFICATION CENTER MODAL (DUAL ROLE MESSAGES)      ──
         ──────────────────────────────────────────────────────── */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notifModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Center</Text>
              <Pressable onPress={() => setShowNotifications(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#0F1E36" />
              </Pressable>
            </View>

            {/* Notification messages list */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.notifScroll}>
              {notifications.map((notif) => {
                const IconComponent = notif.isBroker ? Building : Bell;
                return (
                  <View key={notif.id} style={[styles.notifCard, !notif.read && styles.notifUnreadCard]}>
                    <View style={[styles.notifIconBox, !notif.read && styles.notifUnreadIconBox]}>
                      <IconComponent size={16} color={!notif.read ? (notif.isBroker ? "#005B96" : "#E05A36") : "#0F1E36"} />
                    </View>
                    <View style={styles.notifTextContent}>
                      <View style={styles.notifHeaderRow}>
                        <Text style={[styles.notifTag, notif.isBroker && styles.notifTagAlt]}>{notif.tag}</Text>
                        <Text style={styles.notifTime}>{notif.time}</Text>
                      </View>
                      <Text style={styles.notifCardTitle}>{notif.title}</Text>
                      <Text style={styles.notifCardMsg}>{notif.message}</Text>
                    </View>
                    {!notif.read && <View style={styles.notifBadgeDot} />}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ────────────────────────────────────────────────────────
         ── FILTER SELECTOR MODAL                               ──
         ──────────────────────────────────────────────────────── */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Filters</Text>
              <Pressable onPress={() => setShowFilterModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#0F1E36" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {/* Purpose Filter */}
              <Text style={styles.filterSectionTitle}>Deal Purpose</Text>
              <View style={styles.filterOptionsRow}>
                {[
                  { value: "all", label: "Any" },
                  { value: "buy", label: "Buy" },
                  { value: "rent", label: "Rent" },
                  { value: "commercial", label: "Commercial" },
                ].map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => setFilterPurpose(item.value as any)}
                    style={[styles.filterOptionBtn, filterPurpose === item.value && styles.filterOptionBtnActive]}
                  >
                    <Text style={[styles.filterOptionText, filterPurpose === item.value && styles.filterOptionTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Property Type Filter */}
              <Text style={styles.filterSectionTitle}>Property Type</Text>
              <View style={styles.filterOptionsRow}>
                {[
                  { value: "all", label: "Any" },
                  { value: "Villa", label: "Villa" },
                  { value: "Apartment", label: "Apartment" },
                  { value: "Home", label: "Home" },
                  { value: "Industrial Plot", label: "Industrial Plot" },
                ].map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => setFilterType(item.value as any)}
                    style={[styles.filterOptionBtn, filterType === item.value && styles.filterOptionBtnActive]}
                  >
                    <Text style={[styles.filterOptionText, filterType === item.value && styles.filterOptionTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* BHK Filter */}
              <Text style={styles.filterSectionTitle}>Bedrooms (BHK)</Text>
              <View style={styles.filterOptionsRow}>
                {[
                  { value: "all", label: "Any" },
                  { value: "1", label: "1 BHK" },
                  { value: "2", label: "2 BHK" },
                  { value: "3", label: "3 BHK" },
                  { value: "4", label: "4 BHK" },
                  { value: "5", label: "5 BHK" },
                ].map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => setFilterBhk(item.value as any)}
                    style={[styles.filterOptionBtn, filterBhk === item.value && styles.filterOptionBtnActive]}
                  >
                    <Text style={[styles.filterOptionText, filterBhk === item.value && styles.filterOptionTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Furnishing Status */}
              <Text style={styles.filterSectionTitle}>Furnishing</Text>
              <View style={styles.filterOptionsRow}>
                {[
                  { value: "all", label: "Any" },
                  { value: "Furnished", label: "Furnished" },
                  { value: "Semi-Furnished", label: "Semi-Furnished" },
                  { value: "Unfurnished", label: "Unfurnished" },
                ].map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => setFilterFurnishing(item.value as any)}
                    style={[styles.filterOptionBtn, filterFurnishing === item.value && styles.filterOptionBtnActive]}
                  >
                    <Text style={[styles.filterOptionText, filterFurnishing === item.value && styles.filterOptionTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Price limit Filter */}
              <Text style={styles.filterSectionTitle}>Price Range Limit</Text>
              <View style={styles.filterOptionsRow}>
                {[
                  { value: "all", label: "Any" },
                  { value: "under-50k", label: "Under ₹50k" },
                  { value: "under-50L", label: "Under ₹50 Lakh" },
                  { value: "under-2Cr", label: "Under ₹2 Cr" },
                  { value: "under-10Cr", label: "Under ₹10 Cr" },
                ].map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => setFilterPrice(item.value as any)}
                    style={[styles.filterOptionBtn, filterPrice === item.value && styles.filterOptionBtnActive]}
                  >
                    <Text style={[styles.filterOptionText, filterPrice === item.value && styles.filterOptionTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable onPress={handleClearAllFilters} style={styles.resetModalBtn}>
                <RotateCcw size={12} color="#6B7280" />
                <Text style={styles.resetModalBtnText}>Reset All</Text>
              </Pressable>
              <Pressable onPress={() => setShowFilterModal(false)} style={styles.applyFiltersBtn}>
                <Text style={styles.applyFiltersBtnText}>
                  Show {filteredProperties.length} Properties
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0F1E36",
  },
  scrollContent: {
    backgroundColor: "#FAF9F6",
  },
  stickyHeader: {
    backgroundColor: "#0F1E36",
    paddingBottom: 15,
    zIndex: 1000,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 12,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E05A36",
  },
  greetingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  cityText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
  },
  topBarRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#E05A36",
    borderWidth: 1,
    borderColor: "#0F1E36",
  },

  // Custom city dropdown styling
  dropdownOverlay: {
    position: "absolute",
    top: 54,
    left: 65,
    backgroundColor: "#1E293B", // Dark slate theme matching header
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    width: 150,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    padding: 6,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: "rgba(224, 90, 54, 0.15)",
  },
  dropdownItemText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "600",
  },
  dropdownItemTextActive: {
    color: "#E05A36",
    fontWeight: "800",
  },

  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#0F1E36",
    fontWeight: "600",
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E05A36",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#E05A36",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterActiveDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E05A36",
  },

  cityPillsRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  cityPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cityPillActive: {
    backgroundColor: "#E05A36",
    borderColor: "#E05A36",
  },
  cityPillText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11.5,
    fontWeight: "700",
  },
  cityPillTextActive: {
    color: "#FFFFFF",
  },

  body: {
    backgroundColor: "#FAF9F6",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 15,
    marginTop: -10,
  },

  purposeSection: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 15,
    paddingBottom: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  purposeTabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  purposeTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  purposeTabActive: {
    backgroundColor: "#0F1E36",
  },
  purposeTabText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#4B5563",
  },
  purposeTabTextActive: {
    color: "#FFFFFF",
  },

  propListContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  propCard: {
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  propImgWrap: {
    width: "100%",
    height: 110,
    position: "relative",
  },
  propImg: {
    width: "100%",
    height: "100%",
  },
  propBadges: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    gap: 4,
  },
  reraMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  reraMiniText: {
    fontSize: 7,
    color: "#10B981",
    fontWeight: "800",
  },
  purposeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  buyBadge: { backgroundColor: "#E05A36" },
  rentBadge: { backgroundColor: "#005B96" },
  purposeBadgeText: {
    fontSize: 7,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  propInfo: {
    padding: 10,
    gap: 2,
  },
  propPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#E05A36",
  },
  propTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0F1E36",
  },
  propLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  propLoc: {
    fontSize: 9.5,
    color: "#9CA3AF",
    fontWeight: "600",
    flex: 1,
  },
  propSpecsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  propSpec: {
    fontSize: 9,
    color: "#6B7280",
    fontWeight: "700",
  },
  propSpecDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D1D5DB",
  },

  section: {
    backgroundColor: "#FFFFFF",
    marginBottom: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fireEmoji: {
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0F1E36",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E05A36",
  },

  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 14,
  },
  svcItem: {
    width: "25%",
    alignItems: "center",
  },
  svcIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  svcLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4B5563",
    textAlign: "center",
  },

  promoBannerOuter: {
    marginBottom: 15,
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  promoBanner: {
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    height: 140,
    overflow: "hidden",
  },
  promoBanner1: {
    backgroundColor: "#0F1E36",
  },
  promoBanner2: {
    backgroundColor: "#111827",
  },
  promoLeft: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  promoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 2,
  },
  promoChipText: {
    fontSize: 8,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  promoH1: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 20,
  },
  promoSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  promoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E05A36",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 4,
  },
  promoBtnText: {
    fontSize: 9.5,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  promoImg: {
    width: 100,
    height: 100,
    borderRadius: 14,
    marginLeft: 10,
  },
  dotRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#D1D5DB",
  },
  dotActive: {
    backgroundColor: "#E05A36",
    width: 14,
  },

  featuredCard: {
    width: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredImgWrap: {
    width: "100%",
    height: 125,
    position: "relative",
  },
  featuredImg: {
    width: "100%",
    height: "100%",
  },
  featuredGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  featuredPriceOverlay: {
    position: "absolute",
    bottom: 8,
    left: 10,
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  reraChip: {
    position: "absolute",
    top: 8,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(16,185,129,0.15)",
    borderWidth: 1,
    borderColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reraChipText: {
    fontSize: 7.5,
    color: "#10B981",
    fontWeight: "800",
  },
  featuredFavBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredInfo: {
    padding: 12,
    gap: 4,
  },
  featuredTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F1E36",
  },
  featuredLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredLoc: {
    fontSize: 10.5,
    color: "#9CA3AF",
    fontWeight: "600",
    flex: 1,
  },
  featuredMeta: {
    flexDirection: "row",
    gap: 5,
    marginTop: 4,
    flexWrap: "wrap",
  },
  metaChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaChipText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#4B5563",
  },

  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE9E4",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#005B96",
  },

  trustRow: {
    flexDirection: "row",
    gap: 8,
  },
  trustCard: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  trustIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  trustLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#0F1E36",
    textAlign: "center",
  },
  trustSub: {
    fontSize: 8.5,
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
  },

  // ────────────────────────────────────────────────────────
  // ── FILTERED RESULTS STYLING                          ──
  // ────────────────────────────────────────────────────────
  filteredContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  filteredHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  filteredTitle: {
    fontSize: 16.5,
    fontWeight: "900",
    color: "#0F1E36",
  },
  clearFiltersBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(224, 90, 54, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: "#E05A36",
    fontSize: 11.5,
    fontWeight: "800",
  },
  emptyFilteredContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyFilteredText: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#0F1E36",
    marginBottom: 4,
    textAlign: "center",
  },
  emptyFilteredSub: {
    fontSize: 11.5,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 20,
    fontWeight: "500",
  },
  resetBtnLarge: {
    backgroundColor: "#0F1E36",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetBtnLargeText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
  },
  filteredCardsGrid: {
    gap: 15,
    paddingBottom: 20,
  },
  
  // ─── ACCURATE HIGH-END PROPERTY CARD ───
  accurateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
  },
  accurateCardImgWrap: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  accurateCardImg: {
    width: "100%",
    height: "100%",
  },
  accurateCardReraBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(15, 30, 54, 0.85)", 
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  accurateCardReraText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  accurateCardPurposeBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(224, 90, 54, 0.9)", 
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  accurateCardPurposeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  accurateCardFavBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accurateCardInfo: {
    padding: 15,
    gap: 4,
  },
  accurateCardPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  accurateCardPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: "#E05A36",
  },
  accurateCardPriceSub: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
  },
  accurateCardTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0F1E36",
    lineHeight: 19,
  },
  accurateCardLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  accurateCardLoc: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    flex: 1,
  },
  accurateCardMeta: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  accurateCardMetaChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  accurateCardMetaChipText: {
    fontSize: 10,
    color: "#4B5563",
    fontWeight: "700",
  },

  // ────────────────────────────────────────────────────────
  // ── MODAL & NOTIFICATIONS GENERAL STYLES              ──
  // ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 30, 54, 0.6)", 
    justifyContent: "flex-end", 
  },
  notifModalContent: {
    backgroundColor: "#FAF9F6", 
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "80%",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18.5,
    fontWeight: "900",
    color: "#0F1E36",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15, 30, 54, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifRoleToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 30, 54, 0.05)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 15,
    gap: 4,
  },
  notifRoleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  notifRoleBtnActive: {
    backgroundColor: "#E05A36", 
    shadowColor: "#E05A36",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  notifRoleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
  },
  notifRoleTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  notifScroll: {
    paddingBottom: 40,
  },
  notifCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  notifUnreadCard: {
    borderColor: "rgba(224, 90, 54, 0.2)",
    backgroundColor: "rgba(224, 90, 54, 0.01)",
    borderLeftWidth: 3.5,
    borderLeftColor: "#E05A36",
  },
  notifIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(15, 30, 54, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifUnreadIconBox: {
    backgroundColor: "rgba(224, 90, 54, 0.1)",
  },
  notifTextContent: {
    flex: 1,
    gap: 4,
  },
  notifHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifTag: {
    fontSize: 9,
    fontWeight: "800",
    color: "#E05A36",
    backgroundColor: "rgba(224, 90, 54, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: "uppercase",
  },
  notifTagAlt: {
    color: "#005B96",
    backgroundColor: "rgba(0, 91, 150, 0.1)",
  },
  notifTime: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  notifCardTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F1E36",
  },
  notifCardMsg: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 17,
    fontWeight: "500",
  },
  notifBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E05A36",
    position: "absolute",
    top: 14,
    right: 14,
  },

  // ─── FILTER MODAL UNIQUE STYLES ───
  filterModalContent: {
    backgroundColor: "#FAF9F6",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "85%",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  filterScroll: {
    paddingBottom: 25,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F1E36",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 10,
  },
  filterOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 5,
  },
  filterOptionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  filterOptionBtnActive: {
    backgroundColor: "#0F1E36", 
    borderColor: "#0F1E36",
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  filterOptionTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  modalActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#EAE9E4",
    paddingVertical: 15,
    gap: 12,
    backgroundColor: "#FAF9F6",
  },
  resetModalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  resetModalBtnText: {
    color: "#4B5563",
    fontSize: 13.5,
    fontWeight: "800",
  },
  applyFiltersBtn: {
    flex: 2.2,
    backgroundColor: "#E05A36",
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E05A36",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  applyFiltersBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
  },
});
