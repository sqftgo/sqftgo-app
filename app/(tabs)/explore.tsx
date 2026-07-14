import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  TextInput,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import {
  Heart,
  Search,
  MapPin,
  Star,
  Home,
  ShieldCheck,
  ChevronRight,
  Phone,
  Mail,
  RotateCcw,
  Sparkles,
  Map as MapIcon,
  List,
  Compass,
  X,
} from "lucide-react-native";



export default function ExploreSearchScreen() {
  const router = useRouter();
  const { properties, directoryProfiles, selectedCity, favorites, toggleFavorite } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSegment, setActiveSegment] = useState<"properties" | "dealers">("properties");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // On-page Quick Filters
  const [selectedPurpose, setSelectedPurpose] = useState<"all" | "buy" | "rent" | "commercial">("all");
  const [selectedType, setSelectedType] = useState<"all" | "Villa" | "Apartment" | "Home" | "Industrial Plot">("all");
  const [selectedBhk, setSelectedBhk] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all");
  const [selectedPrice, setSelectedPrice] = useState<"all" | "under-50k" | "under-50L" | "under-2Cr" | "under-10Cr">("all");

  // Selected property for map-view overlay peek card
  const [activeMapPropId, setActiveMapPropertyId] = useState<string | null>(null);

  // Advanced LIVE Filtering for Properties
  const filteredProperties = properties.filter((prop) => {
    const matchesCity = prop.city.toLowerCase() === selectedCity.toLowerCase();
    
    const matchesSearch = searchQuery === "" ||
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === "all" || prop.type === selectedType;
    const matchesBhk = selectedBhk === "all" || prop.bhk === parseInt(selectedBhk);
    
    let matchesPrice = true;
    if (selectedPrice !== "all") {
      if (selectedPrice === "under-50k") matchesPrice = prop.price <= 50000;
      else if (selectedPrice === "under-50L") matchesPrice = prop.price > 50000 && prop.price <= 5000000;
      else if (selectedPrice === "under-2Cr") matchesPrice = prop.price <= 20000000;
      else if (selectedPrice === "under-10Cr") matchesPrice = prop.price <= 100000000;
    }

    let matchesPurpose = true;
    if (selectedPurpose !== "all") {
      if (selectedPurpose === "buy") matchesPurpose = prop.purpose === "buy";
      else if (selectedPurpose === "rent") matchesPurpose = prop.purpose === "rent";
      else if (selectedPurpose === "commercial") {
        matchesPurpose = (prop.type === "Commercial Space" || prop.type === "Office Space" || prop.type === "Shop" || prop.type === "Industrial Plot");
      }
    }

    return matchesCity && matchesSearch && matchesType && matchesBhk && matchesPrice && matchesPurpose;
  });

  // Dynamic coordinates mapping for map mockup
  const propertiesWithCoordinates = filteredProperties.map((prop, index) => {
    const coordsSeeds = [
      { left: "20%", top: "25%" },
      { left: "65%", top: "45%" },
      { left: "45%", top: "70%" },
      { left: "80%", top: "20%" },
      { left: "15%", top: "75%" },
      { left: "55%", top: "15%" },
      { left: "30%", top: "50%" },
      { left: "75%", top: "65%" },
    ];
    return {
      ...prop,
      position: coordsSeeds[index % coordsSeeds.length],
    };
  });

  // Selected property model for peek card overlay
  const activeMapProperty = filteredProperties.find(p => p.id === (activeMapPropId || filteredProperties[0]?.id));

  // Live filter for Certified Local Experts
  const filteredDealers = directoryProfiles.filter((dealer) => {
    const matchesCity = dealer.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesSearch = searchQuery === "" ||
      dealer.firmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Error", "Unable to make calls from this device.");
    });
  };

  const handleEmail = (email: string, firmName: string) => {
    Linking.openURL(`mailto:${email}?subject=Inquiry regarding SVR Certified Agent: ${firmName}`).catch(() => {
      Alert.alert("Error", "No email application found.");
    });
  };

  const handleResetExploreFilters = () => {
    setSearchQuery("");
    setSelectedPurpose("all");
    setSelectedType("all");
    setSelectedBhk("all");
    setSelectedPrice("all");
  };

  const formatPrice = (num: number) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(0)}L`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatIndianCurrency = (num: number) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Crore`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} Lakh`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      
      {/* Header and Search Area */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.title}>Search Portal</Text>
            <Text style={styles.subtitle}>Discover verified listings in {selectedCity}</Text>
          </View>
          {/* Toggle View Mode Button (Only for Properties Segment) */}
          {activeSegment === "properties" && (
            <View style={styles.viewModeToggleRow}>
              <Pressable
                onPress={() => setViewMode("list")}
                style={[styles.viewModeToggleBtn, viewMode === "list" && styles.viewModeToggleBtnActive]}
              >
                <List size={13} color={viewMode === "list" ? "#FFFFFF" : "#94A3B8"} />
                <Text style={[styles.viewModeToggleText, viewMode === "list" && styles.viewModeToggleTextActive]}>List</Text>
              </Pressable>
              <Pressable
                onPress={() => setViewMode("map")}
                style={[styles.viewModeToggleBtn, viewMode === "map" && styles.viewModeToggleBtnActive]}
              >
                <MapIcon size={13} color={viewMode === "map" ? "#FFFFFF" : "#94A3B8"} />
                <Text style={[styles.viewModeToggleText, viewMode === "map" && styles.viewModeToggleTextActive]}>Map</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Unified Search Input */}
        <View style={styles.searchBar}>
          <Search size={18} color="#E05A36" style={styles.searchIcon} />
          <TextInput
            placeholder={
              activeSegment === "properties"
                ? "Search luxury flats, villas, plots..."
                : "Search brokers, consultants, builders..."
            }
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery !== "" && (
            <Pressable onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
              <X size={14} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Curved Content Container */}
      <View style={styles.curvedContentWrapper}>
        
        {/* Segment Tabs: Properties vs Local Certified Experts */}
        <View style={styles.segmentWrapper}>
          <View style={styles.segmentContainer}>
            <Pressable
              onPress={() => setActiveSegment("properties")}
              style={[styles.segmentBtn, activeSegment === "properties" && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, activeSegment === "properties" && styles.segmentTextActive]}>
                Properties ({filteredProperties.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setActiveSegment("dealers");
                setViewMode("list");
              }}
              style={[styles.segmentBtn, activeSegment === "dealers" && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, activeSegment === "dealers" && styles.segmentTextActive]}>
                Certified Experts ({filteredDealers.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── QUICK FILTER PILLS ROW (Only in Properties Segment) ── */}
        {activeSegment === "properties" && viewMode === "list" && (
          <View style={styles.quickFilterWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFilterScroll}>
              
              {/* Purpose Pill */}
              <Pressable
                onPress={() => setSelectedPurpose(prev => prev === "buy" ? "all" : "buy")}
                style={[styles.quickPill, selectedPurpose === "buy" && styles.quickPillActive]}
              >
                <Text style={[styles.quickPillText, selectedPurpose === "buy" && styles.quickPillTextActive]}>
                  For Sale
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedPurpose(prev => prev === "rent" ? "all" : "rent")}
                style={[styles.quickPill, selectedPurpose === "rent" && styles.quickPillActive]}
              >
                <Text style={[styles.quickPillText, selectedPurpose === "rent" && styles.quickPillTextActive]}>
                  For Rent
                </Text>
              </Pressable>

              {/* BHK Pill */}
              <Pressable
                onPress={() => setSelectedBhk(prev => prev === "3" ? "all" : "3")}
                style={[styles.quickPill, selectedBhk === "3" && styles.quickPillActive]}
              >
                <Text style={[styles.quickPillText, selectedBhk === "3" && styles.quickPillTextActive]}>
                  3 BHK
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedBhk(prev => prev === "4" ? "all" : "4")}
                style={[styles.quickPill, selectedBhk === "4" && styles.quickPillActive]}
              >
                <Text style={[styles.quickPillText, selectedBhk === "4" && styles.quickPillTextActive]}>
                  4 BHK
                </Text>
              </Pressable>

              {/* Property Type Pill */}
              <Pressable
                onPress={() => setSelectedType(prev => prev === "Villa" ? "all" : "Villa")}
                style={[styles.quickPill, selectedType === "Villa" && styles.quickPillActive]}
              >
                <Text style={[styles.quickPillText, selectedType === "Villa" && styles.quickPillTextActive]}>
                  Villa
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedType(prev => prev === "Apartment" ? "all" : "Apartment")}
                style={[styles.quickPill, selectedType === "Apartment" && styles.quickPillActive]}
              >
                <Text style={[styles.quickPillText, selectedType === "Apartment" && styles.quickPillTextActive]}>
                  Apartment
                </Text>
              </Pressable>

              {/* Reset explore filters */}
              {(selectedPurpose !== "all" || selectedType !== "all" || selectedBhk !== "all" || selectedPrice !== "all" || searchQuery !== "") && (
                <Pressable onPress={handleResetExploreFilters} style={styles.quickResetBtn}>
                  <RotateCcw size={11} color="#E05A36" />
                  <Text style={styles.quickResetText}>Clear</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        )}

        {/* ── MAIN RESULTS CONTAINER ── */}
        {viewMode === "list" ? (
          /* ────────────────────────────────────────────────────────
             ── STANDARD LIST VIEW LAYOUT (PROPERTIES & BROKERS)   ──
             ──────────────────────────────────────────────────────── */
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
            {activeSegment === "properties" ? (
              // --- Properties List ---
              filteredProperties.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Compass size={40} color="#94A3B8" style={{ marginBottom: 10 }} />
                  <Text style={styles.emptyText}>No properties matched your search in {selectedCity}.</Text>
                  <Pressable onPress={handleResetExploreFilters} style={styles.emptyResetBtn}>
                    <Text style={styles.emptyResetBtnText}>Reset Filters</Text>
                  </Pressable>
                </View>
              ) : (
                filteredProperties.map((prop) => {
                  const isFav = favorites.includes(prop.id);
                  return (
                    <Pressable
                      key={prop.id}
                      onPress={() => router.push({ pathname: "/property/[id]", params: { id: prop.id } } as any)}
                      style={styles.listCard}
                    >
                      {/* Left side: Cover Photo + Overlays */}
                      <View style={styles.cardImageContainer}>
                        <Image source={{ uri: prop.images[0] }} style={styles.cardImage} />
                        {prop.reraApproved && (
                          <View style={styles.reraBadge}>
                            <ShieldCheck size={8} color="#FFFFFF" fill="#10B981" />
                            <Text style={styles.reraBadgeText}>RERA</Text>
                          </View>
                        )}
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>{prop.type.toUpperCase()}</Text>
                        </View>
                      </View>

                      {/* Right side: Detailed Property Info */}
                      <View style={styles.cardContent}>
                        <View style={styles.priceRow}>
                          <Text style={styles.cardPrice}>
                            {formatPrice(prop.price)}
                            {(prop.purpose === "rent" || prop.purpose === "lease") && (
                              <Text style={styles.cardPriceSub}>/ mo</Text>
                            )}
                          </Text>
                          <Pressable 
                            onPress={() => toggleFavorite(prop.id)} 
                            style={styles.cardFav}
                          >
                            <Heart 
                              size={12} 
                              color={isFav ? "#FF4D4D" : "#9CA3AF"} 
                              fill={isFav ? "#FF4D4D" : "transparent"} 
                            />
                          </Pressable>
                        </View>

                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {prop.title}
                        </Text>

                        <View style={styles.locationRow}>
                          <MapPin size={10} color="#6B7280" style={{ marginTop: 1 }} />
                          <Text style={styles.cardLocation} numberOfLines={1}>
                            {prop.locality}, {prop.city}
                          </Text>
                        </View>

                        {/* Property Specifications icons */}
                        <View style={styles.metaRow}>
                          {prop.bhk && (
                            <View style={styles.specItem}>
                              <Home size={10} color="#6B7280" />
                              <Text style={styles.metaText}>{prop.bhk} BHK</Text>
                            </View>
                          )}
                          <View style={styles.specItem}>
                            <Compass size={10} color="#6B7280" />
                            <Text style={styles.metaText}>{prop.size} sqft</Text>
                          </View>
                          <View style={styles.specItem}>
                            <Star size={10} color="#FFB800" fill="#FFB800" />
                            <Text style={styles.metaText}>4.8</Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )
            ) : (
              // --- Certified Local Experts (Dealers) List ---
              filteredDealers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ShieldCheck size={40} color="#94A3B8" style={{ marginBottom: 10 }} />
                  <Text style={styles.emptyText}>No registered experts matched your search in {selectedCity}.</Text>
                </View>
              ) : (
                filteredDealers.map((dealer) => (
                  <View key={dealer.id} style={styles.dealerCard}>
                    {/* Header: Avatar, Name & verified badge */}
                    <View style={styles.dealerHeader}>
                      <View style={styles.dealerHeaderLeft}>
                        <View style={styles.dealerAvatar}>
                          <Sparkles size={16} color="#FFFFFF" />
                        </View>
                        <View>
                          <Text style={styles.firmName}>{dealer.firmName}</Text>
                          <Text style={styles.categoryBadge}>{dealer.category}</Text>
                        </View>
                      </View>
                      
                      {dealer.reraId && (
                        <View style={styles.dealerReraBadge}>
                          <ShieldCheck size={10} color="#FFFFFF" fill="#10B981" />
                          <Text style={styles.dealerReraText}>Certified</Text>
                        </View>
                      )}
                    </View>

                    {/* Description */}
                    <Text style={styles.description} numberOfLines={2}>
                      {dealer.description}
                    </Text>

                    {/* Specialties Pills */}
                    {dealer.specialties && (
                      <View style={styles.dealerTagsContainer}>
                        {dealer.specialties.slice(0, 3).map((spec, i) => (
                          <View key={i} style={styles.dealerTagBadge}>
                            <Text style={styles.dealerTagBadgeText}>{spec}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Meta stats block */}
                    <View style={styles.infoBlock}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Licence RERA ID:</Text>
                        <Text style={styles.infoValue}>{dealer.reraId || "Under Verification"}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Experience:</Text>
                        <Text style={styles.infoValue}>{dealer.experience || "5+ Years"}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Team Size / Listings:</Text>
                        <Text style={styles.infoValue}>{dealer.teamSize} Experts • {dealer.listingsCount} Properties</Text>
                      </View>
                    </View>

                    {/* Call / Email action buttons */}
                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={() => handleCall(dealer.mobile)}
                        style={[styles.actionButton, styles.callButton]}
                      >
                        <Phone size={13} color="#E05A36" />
                        <Text style={[styles.actionButtonText, styles.callButtonText]}>Call Now</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleEmail(dealer.email, dealer.firmName)}
                        style={[styles.actionButton, styles.emailButton]}
                      >
                        <Mail size={13} color="#FFFFFF" />
                        <Text style={[styles.actionButtonText, styles.emailButtonText]}>Send Mail</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )
            )}
          </ScrollView>
        ) : (
          /* ────────────────────────────────────────────────────────
             ── INTERACTIVE REAL-ESTATE MAP VIEW MOCKUP             ──
             ──────────────────────────────────────────────────────── */
          <View style={styles.mapContainer}>
            {/* Map Canvas Background (Simulated vector geography) */}
            <View style={styles.mapCanvas}>
              
              {/* Decorative geography shapes */}
              <View style={styles.mapLakeShape}><Text style={styles.mapLakeText}>LAKE PICHOLA</Text></View>
              <View style={styles.mapParkShape}><Text style={styles.mapParkText}>CITY CENTER PARK</Text></View>
              <View style={[styles.mapRouteLine, { transform: [{ rotate: "25deg" }], top: 120 }]} />
              <View style={[styles.mapRouteLine, { transform: [{ rotate: "-40deg" }], top: 180, left: 10 }]} />

              {/* Dynamic Coordinate Properties pins mapping */}
              {propertiesWithCoordinates.length === 0 ? (
                <View style={styles.mapEmptyOverlay}>
                  <Compass size={24} color="#94A3B8" />
                  <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: '700', marginTop: 4 }}>No pins in active city</Text>
                </View>
              ) : (
                propertiesWithCoordinates.map((prop) => {
                  const isActive = activeMapPropId === prop.id || (!activeMapPropId && prop.id === filteredProperties[0]?.id);
                  return (
                    <Pressable
                      key={prop.id}
                      onPress={() => setActiveMapPropertyId(prop.id)}
                      style={[
                        styles.mapPinContainer, 
                        { left: prop.position.left as any, top: prop.position.top as any },
                        isActive && styles.mapPinContainerActive
                      ]}
                    >
                      <View style={[styles.mapPinValueBubble, isActive && styles.mapPinValueBubbleActive]}>
                        <Text style={[styles.mapPinValueText, isActive && styles.mapPinValueTextActive]}>
                          {formatPrice(prop.price)}
                        </Text>
                      </View>
                      <View style={[styles.mapPinTrianglePointer, isActive && styles.mapPinTrianglePointerActive]} />
                    </Pressable>
                  );
                })
              )}
            </View>

            {/* Bottom floating Property Detail Peek Card overlay */}
            {activeMapProperty && (
              <Pressable
                onPress={() => router.push({ pathname: "/property/[id]", params: { id: activeMapProperty.id } } as any)}
                style={styles.mapPeekCard}
              >
                <Image source={{ uri: activeMapProperty.images[0] }} style={styles.mapPeekImg} />
                <View style={styles.mapPeekContent}>
                  <View style={styles.mapPeekPriceRow}>
                    <Text style={styles.mapPeekPrice}>{formatIndianCurrency(activeMapProperty.price)}</Text>
                    {activeMapProperty.reraApproved && (
                      <View style={styles.mapPeekReraBadge}>
                        <ShieldCheck size={8} color="#FFFFFF" fill="#10B981" />
                        <Text style={styles.mapPeekReraText}>RERA</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.mapPeekTitle} numberOfLines={1}>{activeMapProperty.title}</Text>
                  <Text style={styles.mapPeekLoc} numberOfLines={1}>📍 {activeMapProperty.locality}, {activeMapProperty.city}</Text>
                  <View style={styles.mapPeekMetaRow}>
                    {activeMapProperty.bhk && <Text style={styles.mapPeekMetaText}>{activeMapProperty.bhk} BHK • </Text>}
                    <Text style={styles.mapPeekMetaText}>{activeMapProperty.size} sqft • </Text>
                    <Text style={styles.mapPeekMetaText}>{activeMapProperty.furnished}</Text>
                  </View>
                </View>
                <View style={styles.mapPeekChevronBox}>
                  <ChevronRight size={18} color="#E05A36" />
                </View>
              </Pressable>
            )}
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F1E36", 
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: "#0F1E36",
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.72)",
    marginTop: 2,
    fontWeight: "500",
  },
  viewModeToggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  viewModeToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  viewModeToggleBtnActive: {
    backgroundColor: "#E05A36",
  },
  viewModeToggleText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
  },
  viewModeToggleTextActive: {
    color: "#FFFFFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#0F1E36",
    fontWeight: "600",
  },
  curvedContentWrapper: {
    flex: 1,
    backgroundColor: "#FAF9F6", 
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -10,
    paddingTop: 10,
  },
  segmentWrapper: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 30, 54, 0.05)",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  segmentTextActive: {
    color: "#0F1E36",
    fontWeight: "800",
  },

  // Quick Filters wrapper
  quickFilterWrapper: {
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  quickFilterScroll: {
    paddingHorizontal: 10,
    gap: 6,
    alignItems: "center",
  },
  quickPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  quickPillActive: {
    backgroundColor: "#0F1E36",
    borderColor: "#0F1E36",
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
  },
  quickPillTextActive: {
    color: "#FFFFFF",
  },
  quickResetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(224, 90, 54, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 4,
  },
  quickResetText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#E05A36",
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 95, 
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 15,
  },
  emptyResetBtn: {
    backgroundColor: "#0F1E36",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyResetBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // Premium Property Card in search (Horizontal Row layout)
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    marginVertical: 6,
    flexDirection: "row",
    height: 114,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  cardImageContainer: {
    width: 114,
    height: "100%",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  reraBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(15, 30, 54, 0.8)",
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  reraBadgeText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "800",
  },
  typeBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(15, 30, 54, 0.7)",
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "800",
  },
  cardContent: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardPrice: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#E05A36",
  },
  cardPriceSub: {
    fontSize: 10.5,
    color: "#6B7280",
    fontWeight: "600",
  },
  cardFav: {
    backgroundColor: "#FFFFFF",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  cardTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F1E36",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 3,
  },
  cardLocation: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 9.5,
    color: "#4B5563",
    fontWeight: "700",
  },

  // Restructured Expert Broker card layout
  dealerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  dealerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FAF9F6",
    paddingBottom: 8,
  },
  dealerHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dealerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#0F1E36",
    alignItems: "center",
    justifyContent: "center",
  },
  firmName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F1E36",
  },
  categoryBadge: {
    fontSize: 10.5,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 1,
  },
  dealerReraBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dealerReraText: {
    fontSize: 9,
    color: "#10B981",
    fontWeight: "800",
  },
  description: {
    fontSize: 11.5,
    color: "#4B5563",
    lineHeight: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  dealerTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  dealerTagBadge: {
    backgroundColor: "rgba(0, 91, 150, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 91, 150, 0.08)",
  },
  dealerTagBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#005B96",
  },
  infoBlock: {
    backgroundColor: "#FAF9F6",
    borderRadius: 12,
    padding: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "700",
  },
  infoValue: {
    fontSize: 10,
    color: "#0F1E36",
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
  },
  callButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(224, 90, 54, 0.2)",
  },
  callButtonText: {
    color: "#E05A36",
  },
  emailButton: {
    backgroundColor: "#E05A36",
    borderColor: "#E05A36",
  },
  emailButtonText: {
    color: "#FFFFFF",
  },
  actionButtonText: {
    fontSize: 11.5,
    fontWeight: "800",
  },

  // ────────────────────────────────────────────────────────
  // ── PREMIUM MOCKUP INTERACTIVE MAP VIEW LAYOUT        ──
  // ────────────────────────────────────────────────────────
  mapContainer: {
    flex: 1,
    paddingBottom: 95,
  },
  mapCanvas: {
    height: 340,
    backgroundColor: "#E2E8F0", // Slate gray base canvas
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 5,
  },
  mapLakeShape: {
    position: "absolute",
    top: 60,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#BAE6FD", // Light blue water
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: "15deg" }],
  },
  mapLakeText: {
    fontSize: 9,
    color: "#0284C7",
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mapParkShape: {
    position: "absolute",
    bottom: 20,
    right: -20,
    width: 140,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DCFCE7", // Light green park
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapParkText: {
    fontSize: 8,
    color: "#166534",
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mapRouteLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: "#FFFFFF", // Road lines
    width: "120%",
    left: "-10%",
  },
  mapEmptyOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  
  // Interactive Map Pin Bubble
  mapPinContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mapPinContainerActive: {
    zIndex: 99, // Floating on top
  },
  mapPinValueBubble: {
    backgroundColor: "#0F1E36", // Slate Blue base theme pin
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  mapPinValueBubbleActive: {
    backgroundColor: "#E05A36", // Brand Orange active pin
    borderColor: "#FFFFFF",
  },
  mapPinValueText: {
    fontSize: 10,
    fontWeight: '900',
    color: "#FFFFFF",
  },
  mapPinValueTextActive: {
    fontWeight: '900',
  },
  mapPinTrianglePointer: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#0F1E36",
    transform: [{ rotate: "180deg" }],
    marginTop: -1,
  },
  mapPinTrianglePointerActive: {
    borderBottomColor: "#E05A36",
  },

  // Floating Overlay Peek Card (Map view bottom peek)
  mapPeekCard: {
    position: "absolute",
    bottom: 12,
    left: 30,
    right: 30,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  mapPeekImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  mapPeekContent: {
    flex: 1,
    paddingHorizontal: 10,
    gap: 3,
  },
  mapPeekPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mapPeekPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#E05A36",
  },
  mapPeekReraBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mapPeekReraText: {
    fontSize: 7,
    color: "#10B981",
    fontWeight: "800",
  },
  mapPeekTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F1E36",
  },
  mapPeekLoc: {
    fontSize: 9,
    color: "#6B7280",
    fontWeight: "600",
  },
  mapPeekMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapPeekMetaText: {
    fontSize: 9,
    color: "#9CA3AF",
    fontWeight: "700",
  },
  mapPeekChevronBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
