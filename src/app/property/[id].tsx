import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  Share,
  Linking,
  TextInput,
} from "react-native";
import { appAlert } from "@/components/ui/app-alert";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, Stack, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import {
  ChevronLeft,
  Share2,
  Heart,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Compass,
  Sparkles,
  Droplet,
  Phone,
  MessageSquare,
  Train,
  PlusCircle,
  Star,
  ShieldCheck,
  CheckCircle2,
  Info,
} from "@/components/ui/icons";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import { colors } from "@/theme/tokens";


const { width } = Dimensions.get("window");
const CAROUSEL_WIDTH = width - 32;

// Indian Context Neighborhood Reviews
const LOCALITY_REVIEWS = [
  {
    id: "rev-1",
    authorName: "Rajesh Vyas",
    role: "Resident Broker",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 5,
    comment: "Excellent connectivity, close to main markets. The water supply is available 24/7. Highly recommended for families."
  },
  {
    id: "rev-2",
    authorName: "Sonia Verma",
    role: "Home Owner",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 5,
    comment: "Lived here for 3 years. It is highly secure and peaceful at night. Local metro station is only 1.2 km away."
  },
  {
    id: "rev-3",
    authorName: "Amit Mehra",
    role: "Resident",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    rating: 4,
    comment: "Very safe gated township. Daily needs bazaars are at walking distance. No issues with power outages."
  }
];

// Nearby landmarks from the dealer listing, with generic fallbacks for older properties.
function nearbyFacilities(property: {
  nearbyHospital?: string;
  nearbySchool?: string;
  nearbyTransportation?: string;
}) {
  return [
    {
      id: "hospital",
      name: "Hospital",
      icon: PlusCircle,
      detail: property.nearbyHospital || "Ask the dealer for the nearest hospital",
    },
    {
      id: "school",
      name: "School",
      icon: Sparkles,
      detail: property.nearbySchool || "Ask the dealer for the nearest school",
    },
    {
      id: "transport",
      name: "Transportation",
      icon: Train,
      detail: property.nearbyTransportation || "Ask the dealer for transit access",
    },
  ];
}

const FALLBACK_GALLERY = [
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"
];

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    properties,
    favorites,
    toggleFavorite,
    directoryProfiles,
    submitInquiry,
    bookVisit,
    userRole,
    userEmail,
    userName,
    profile,
  } = useApp();

  const property = properties.find((p) => p.id === id);

  // Scroll reference for swiper carousel
  const mainScrollRef = useRef<ScrollView>(null);

  // States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState("hospital");
  const [showInquiry, setShowInquiry] = useState(false);
  const [showVisit, setShowVisit] = useState(false);
  const [inquiryName, setInquiryName] = useState(userName || "");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState(profile?.phone ?? "");
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("11:00 AM");
  const [visitPhone, setVisitPhone] = useState(profile?.phone ?? "");

  // Home Loan Calculator states
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTermYears, setLoanTermYears] = useState(15);
  const [interestRate, setInterestRate] = useState(8.5);

  if (!property) {
    return (
      <SafeAreaView style={styles.errorArea}>
        <Text style={styles.errorText}>Property not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.errorBackBtn}>
          <Text style={styles.errorBackBtnText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isFav = favorites.includes(property.id);

  // Combine property images with fallback gallery to ensure at least 4 pictures
  const galleryImages = [...property.images];
  while (galleryImages.length < 4) {
    galleryImages.push(FALLBACK_GALLERY[galleryImages.length % FALLBACK_GALLERY.length]);
  }

  // Format Indian Currency (Lakhs / Crores)
  const formatIndianCurrency = (num: number) => {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Crore`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)} Lakh`;
    }
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const handleCall = () => {
    Linking.openURL(`tel:${property.ownerPhone}`).catch(() => {
      appAlert("Error", "Unable to open phone dialer.");
    });
  };

  const handleWhatsApp = () => {
    const message = `Namaste, I'm interested in your property: "${property.title}" in ${property.locality}, ${property.city}.`;
    Linking.openURL(`whatsapp://send?phone=${property.ownerPhone}&text=${encodeURIComponent(message)}`).catch(() => {
      Linking.openURL(`https://wa.me/${property.ownerPhone}?text=${encodeURIComponent(message)}`).catch(() => {
        appAlert("Error", "Unable to open WhatsApp.");
      });
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this property: "${property.title}" in ${property.locality}, ${property.city} for ${formatIndianCurrency(property.price)} ${
          property.purpose === "rent" || property.purpose === "lease" ? "/ month" : ""
        }`,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  const handleRentOrBuy = () => {
    const isRent = property.purpose === "rent" || property.purpose === "lease";
    appAlert(
      isRent ? "Rent Property" : "Buy Property",
      `Would you like to connect with ${property.ownerName} regarding "${property.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Contact Owner", onPress: handleWhatsApp }
      ]
    );
  };

  const handleSubmitInquiry = async () => {
    if (!inquiryName.trim()) {
      appAlert("Name required", "Enter your name for the inquiry.");
      return;
    }
    if (!inquiryMessage.trim()) {
      appAlert("Message required", "Tell the dealer what you are looking for.");
      return;
    }
    const created = await submitInquiry({
      propertyId: property.id,
      name: inquiryName.trim(),
      email: userEmail,
      phone: inquiryPhone.trim() || undefined,
      message: inquiryMessage,
    });
    if (!created) {
      appAlert("Error", "Could not submit inquiry. Listing must be Active.");
      return;
    }
    setShowInquiry(false);
    setInquiryMessage("");
    appAlert("Inquiry sent", "The dealer will see this in their leads inbox.", [
      { text: "View my inquiries", onPress: () => router.push("/my-inquiries" as Href) },
      { text: "OK" },
    ]);
  };

  const handleBookVisit = async () => {
    if (!visitDate.trim()) {
      appAlert("Date required", "Enter a visit date (YYYY-MM-DD).");
      return;
    }
    const created = await bookVisit({
      propertyId: property.id,
      visitDate: visitDate.trim(),
      visitTime: visitTime.trim() || "11:00 AM",
      phone: visitPhone.trim() || undefined,
    });
    if (!created) {
      appAlert("Error", "Could not book visit. Sign in as a buyer on an Active listing.");
      return;
    }
    setShowVisit(false);
    appAlert("Visit requested", "Status: Pending Approval. The dealer will confirm.", [
      { text: "My visits", onPress: () => router.push("/my-visits" as Href) },
      { text: "OK" },
    ]);
  };

  // Thumbnail press scrolls to matching image page
  const handleThumbnailPress = (index: number) => {
    setActiveImageIndex(index);
    mainScrollRef.current?.scrollTo({ x: index * CAROUSEL_WIDTH, animated: true });
  };

  // Tracks horizontal swipe completion to update indexes
  const handleMomentumScrollEnd = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / CAROUSEL_WIDTH);
    setActiveImageIndex(index);
  };

  // Find matching broker details or fallback
  const matchedBroker = directoryProfiles.find(
    (profile) => profile.ownerName.toLowerCase() === property.ownerName.toLowerCase()
  );

  // Dynamic Indian Specs Based on Property
  const buildYear = 2018 + ((parseInt(property.id.replace(/\D/g, "")) || 0) % 7);
  const facingDirection = ["East Facing", "North-East Facing", "North Facing", "West Facing"][(parseInt(property.id.replace(/\D/g, "")) || 0) % 4];
  const vaastuScore = ["95% Vaastu Compliant", "100% Vaastu Compliant", "Yes (Vaastu Clear)", "North Entrance (Vaastu Approved)"][(parseInt(property.id.replace(/\D/g, "")) || 0) % 4];
  const waterSupply = property.type === "Villa" || property.type === "Home" ? "24/7 Corp + Borewell" : "24/7 Corporation Water";
  const parkingInfo = property.amenities.includes("Parking") ? "1 Covered Parking" : "Open Parking Space";
  const statusInfo = property.purpose === "buy" || property.purpose === "sell" ? "For Sale" : "For Rent";

  const publicFacilities = nearbyFacilities(property);
  const selectedFacilityObj = publicFacilities.find(f => f.id === selectedFacility) || publicFacilities[0];

  // EMI Calculator calculations
  const calculateEMI = () => {
    const P = property.price;
    const D = P * (downPaymentPercent / 100);
    const L = P - D;
    const r = (interestRate / 100) / 12;
    const n = loanTermYears * 12;
    if (r === 0) return Math.round(L / n);
    const emi = (L * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const calculatedEMI = calculateEMI();
  const loanAmount = property.price * (1 - downPaymentPercent / 100);
  const downPaymentVal = property.price * (downPaymentPercent / 100);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.headerIconBtn}>
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Details</Text>
        <View style={styles.headerRightActions}>
          <Pressable onPress={handleShare} style={styles.headerIconBtn}>
            <Share2 size={20} color={colors.ink} />
          </Pressable>
          <Pressable onPress={() => toggleFavorite(property.id)} style={styles.headerIconBtn}>
            <Heart
              size={20}
              color={isFav ? colors.accent : colors.ink}
              fill={isFav ? colors.accent : "transparent"}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Main Swipeable Image Carousel Container */}
        <View style={styles.imageCardContainer}>
          <ScrollView
            ref={mainScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}
            style={styles.carouselScrollView}
          >
            {galleryImages.map((img, index) => (
              <View key={index} style={{ width: CAROUSEL_WIDTH, height: 280 }}>
                <Image source={{ uri: img }} style={styles.mainPropertyImage} contentFit="cover" />
              </View>
            ))}
          </ScrollView>
          
          {/* Dot indicators */}
          <View style={styles.carouselIndicators}>
            {galleryImages.slice(0, 4).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicatorDot,
                  activeImageIndex === index && styles.indicatorDotActive
                ]}
              />
            ))}
          </View>

          {/* RERA Badge Overlay */}
          {property.reraApproved && (
            <View style={styles.reraBadge}>
              <ShieldCheck size={12} color="#FFFFFF" fill="#E05A36" />
              <Text style={styles.reraBadgeText}>RERA APPROVED</Text>
            </View>
          )}
        </View>

        {/* Thumbnail Gallery Row */}
        <View style={styles.thumbnailRow}>
          {galleryImages.slice(0, 4).map((img, index) => (
            <Pressable
              key={index}
              onPress={() => handleThumbnailPress(index)}
              style={[
                styles.thumbnailWrapper,
                activeImageIndex === index && styles.thumbnailWrapperActive
              ]}
            >
              <Image source={{ uri: img }} style={styles.thumbnailImage} contentFit="cover" />
            </Pressable>
          ))}
        </View>

        <View style={styles.contentContainer}>
          {/* Card 1: Title & Price Summary */}
          <View style={styles.sectionCard}>
            <View style={styles.titlePriceRow}>
              <View style={styles.titleWrapper}>
                <Text style={styles.propertyTitle}>{property.title}</Text>
                <View style={styles.locationWrapper}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.locationText}>{property.locality}, {property.city}</Text>
                </View>
              </View>
              <View style={styles.priceWrapper}>
                <Text style={styles.priceValue}>{formatIndianCurrency(property.price)}</Text>
                <Text style={styles.pricePeriod}>
                  {property.purpose === "rent" || property.purpose === "lease" ? "/month" : "Total Price"}
                </Text>
              </View>
            </View>
          </View>

          {/* Card 2: Property Details Specifications Grid */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Property Details</Text>
            
            {/* Specs Row 1 with Icons */}
            <View style={styles.specsRow}>
              {/* Configuration BHK */}
              <View style={styles.specColumn}>
                <Text style={styles.specLabel}>Configuration</Text>
                <View style={styles.specIconValueRow}>
                  <Bed size={16} color="#E05A36" />
                  <Text style={styles.specValue}>{property.bhk ? `${property.bhk} BHK` : "3 BHK"}</Text>
                </View>
              </View>

              {/* Bathrooms */}
              <View style={styles.specColumn}>
                <Text style={styles.specLabel}>Bathrooms</Text>
                <View style={styles.specIconValueRow}>
                  <Bath size={16} color="#E05A36" />
                  <Text style={styles.specValue}>{property.bhk ? Math.max(1, property.bhk - 1) : 2} Baths</Text>
                </View>
              </View>

              {/* Area */}
              <View style={styles.specColumn}>
                <Text style={styles.specLabel}>Area</Text>
                <View style={styles.specIconValueRow}>
                  <Maximize2 size={14} color="#E05A36" />
                  <Text style={styles.specValue}>{property.size.toLocaleString()} sqft</Text>
                </View>
              </View>
            </View>

            {/* Specs Row 2 (Indian Vaastu & Facing) */}
            <View style={styles.specsRow}>
              {/* Entrance Facing */}
              <View style={styles.specColumn}>
                <Text style={styles.specLabel}>Facing</Text>
                <View style={styles.specIconValueRow}>
                  <Compass size={16} color="#E05A36" />
                  <Text style={styles.specValue}>{facingDirection}</Text>
                </View>
              </View>

              {/* Vaastu Shastra */}
              <View style={styles.specColumn}>
                <Text style={styles.specLabel}>Vaastu Shastra</Text>
                <View style={styles.specIconValueRow}>
                  <Sparkles size={16} color="#E05A36" />
                  <Text style={styles.specValue}>{vaastuScore}</Text>
                </View>
              </View>

              {/* Water Supply */}
              <View style={styles.specColumn}>
                <Text style={styles.specLabel}>Water Supply</Text>
                <View style={styles.specIconValueRow}>
                  <Droplet size={16} color="#E05A36" />
                  <Text style={styles.specValue}>{waterSupply}</Text>
                </View>
              </View>
            </View>

            {/* Specs Row 3 (Status, Parking, Build Year) */}
            <View style={styles.specsRow}>
              {/* Build Year */}
              <View style={styles.specColumn}>
                <Text style={styles.specLabel}>Build Year</Text>
                <Text style={styles.specValueSimple}>{buildYear}</Text>
              </View>

              {/* Parking */}
              <View style={styles.specColumn}>
                <Text style={styles.specLabel}>Parking</Text>
                <Text style={styles.specValueSimple}>{parkingInfo}</Text>
              </View>

              {/* Status */}
              <View style={styles.specColumn}>
                <Text style={styles.specLabel}>Status</Text>
                <Text style={styles.specValueSimple}>{statusInfo}</Text>
              </View>
            </View>
          </View>

          {/* Card 3: Description Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Description</Text>
            <Text style={styles.descriptionText} numberOfLines={isDescExpanded ? undefined : 3}>
              {property.description}
            </Text>
            <Pressable onPress={() => setIsDescExpanded(!isDescExpanded)}>
              <Text style={styles.readMoreLink}>
                {isDescExpanded ? "Read less" : "Read more"}
              </Text>
            </Pressable>
          </View>

          {/* Card 4: Pricing Breakdown Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Pricing Breakdown</Text>
            <View style={styles.pricingBreakdownContainer}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Base Price</Text>
                <Text style={styles.breakdownValue}>{formatIndianCurrency(property.price)}</Text>
              </View>
              {property.priceBreakdown?.securityDeposit && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Security Deposit (Refundable)</Text>
                  <Text style={styles.breakdownValue}>{formatIndianCurrency(property.priceBreakdown.securityDeposit)}</Text>
                </View>
              )}
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Monthly Maintenance</Text>
                <Text style={styles.breakdownValue}>
                  ₹{(property.priceBreakdown?.maintenance || 2500).toLocaleString("en-IN")}/mo
                </Text>
              </View>
              <View style={[styles.breakdownRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.breakdownLabel}>Stamp Duty & Registration (Est.)</Text>
                <Text style={styles.breakdownValue}>
                  {formatIndianCurrency(property.priceBreakdown?.registrationFees || property.price * 0.06)}
                </Text>
              </View>
            </View>
          </View>

          {/* Card 5: Home Loan EMI Calculator Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Home Loan EMI Calculator</Text>
            <View style={styles.emiResultBox}>
              <Text style={styles.emiResultVal}>{formatIndianCurrency(calculatedEMI)}/month</Text>
              <Text style={styles.emiResultLabel}>Estimated Monthly EMI</Text>
            </View>

            {/* Down Payment Control */}
            <View style={styles.calcControlGroup}>
              <View style={styles.calcControlHeader}>
                <Text style={styles.calcControlTitle}>Down Payment ({downPaymentPercent}%)</Text>
                <Text style={styles.calcControlValue}>{formatIndianCurrency(downPaymentVal)}</Text>
              </View>
              <View style={styles.incrementRow}>
                <Pressable
                  onPress={() => setDownPaymentPercent(Math.max(10, downPaymentPercent - 5))}
                  style={styles.incrementBtn}
                >
                  <Text style={styles.incrementBtnText}>- 5%</Text>
                </Pressable>
                <Pressable
                  onPress={() => setDownPaymentPercent(Math.min(80, downPaymentPercent + 5))}
                  style={styles.incrementBtn}
                >
                  <Text style={styles.incrementBtnText}>+ 5%</Text>
                </Pressable>
              </View>
            </View>

            {/* Interest Rate Control */}
            <View style={styles.calcControlGroup}>
              <View style={styles.calcControlHeader}>
                <Text style={styles.calcControlTitle}>Interest Rate (p.a.)</Text>
                <Text style={styles.calcControlValue}>{interestRate}%</Text>
              </View>
              <View style={styles.incrementRow}>
                <Pressable
                  onPress={() => setInterestRate(parseFloat(Math.max(6.5, interestRate - 0.25).toFixed(2)))}
                  style={styles.incrementBtn}
                >
                  <Text style={styles.incrementBtnText}>- 0.25%</Text>
                </Pressable>
                <Pressable
                  onPress={() => setInterestRate(parseFloat(Math.min(15, interestRate + 0.25).toFixed(2)))}
                  style={styles.incrementBtn}
                >
                  <Text style={styles.incrementBtnText}>+ 0.25%</Text>
                </Pressable>
              </View>
            </View>

            {/* Loan Tenure Control */}
            <View style={styles.calcControlGroup}>
              <View style={styles.calcControlHeader}>
                <Text style={styles.calcControlTitle}>Tenure Duration</Text>
                <Text style={styles.calcControlValue}>{loanTermYears} Years</Text>
              </View>
              <View style={styles.incrementRow}>
                <Pressable
                  onPress={() => setLoanTermYears(Math.max(5, loanTermYears - 5))}
                  style={styles.incrementBtn}
                >
                  <Text style={styles.incrementBtnText}>- 5 Yrs</Text>
                </Pressable>
                <Pressable
                  onPress={() => setLoanTermYears(Math.min(30, loanTermYears + 5))}
                  style={styles.incrementBtn}
                >
                  <Text style={styles.incrementBtnText}>+ 5 Yrs</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.calcSummaryFooter}>
              <Info size={14} color="#6B7280" />
              <Text style={styles.calcSummaryFooterText}>
                Based on a Principal Loan Amount of {formatIndianCurrency(loanAmount)}
              </Text>
            </View>
          </View>

          {/* Card 6: Location & Public Facilities Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Location & Public Fasilities</Text>
            
            {/* Scrollable Facility Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.facilityChipsContainer}>
              {publicFacilities.map((facility) => {
                const IconComponent = facility.icon;
                const isSelected = selectedFacility === facility.id;
                return (
                  <Pressable
                    key={facility.id}
                    onPress={() => setSelectedFacility(facility.id)}
                    style={[
                      styles.facilityChip,
                      isSelected && styles.facilityChipActive
                    ]}
                  >
                    <IconComponent size={16} color="#E05A36" />
                    <Text style={styles.facilityChipText}>{facility.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Stylized Map View */}
            <View style={styles.mapContainer}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=800&h=400&q=80" }}
                style={styles.mapImage}
                contentFit="cover"
              />
              {/* Interactive marker in the middle */}
              <View style={styles.mapPinOverlay}>
                <View style={styles.mapPinContainer}>
                  <MapPin size={22} color="#FFF" fill="#E05A36" />
                </View>
                <View style={styles.mapInfoTooltip}>
                  <Text style={styles.mapTooltipText}>{selectedFacilityObj.detail}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* RERA and Verification Checklist Card */}
          {property.reraId && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>RERA & Title Verification</Text>
              <View style={styles.verifBox}>
                <View style={styles.verifHeader}>
                  <ShieldCheck size={20} color="#0F1E36" />
                  <Text style={styles.verifHeading}>Title Deed & Registration Vetted</Text>
                </View>
                <View style={styles.checksList}>
                  <View style={styles.verifRow}>
                    <CheckCircle2 size={14} color="#E05A36" />
                    <Text style={styles.verifLabel}>Title Registry Documents Checked</Text>
                  </View>
                  <View style={styles.verifRow}>
                    <CheckCircle2 size={14} color="#E05A36" />
                    <Text style={styles.verifLabel}>Municipal Property Tax Clearance Verified</Text>
                  </View>
                  <View style={styles.verifRow}>
                    <CheckCircle2 size={14} color="#E05A36" />
                    <Text style={styles.verifLabel}>Physical Land Verification Completed</Text>
                  </View>
                  <View style={styles.reraIdRow}>
                    <Info size={14} color="#0F1E36" />
                    <Text style={styles.reraIdText}>RERA Reg No: {property.reraId}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Card 7: Reviews Section */}
          <View style={styles.sectionCard}>
            <View style={styles.reviewsHeaderRow}>
              <Text style={styles.sectionHeader}>Neighborhood Reviews</Text>
              <Pressable onPress={() => appAlert("Reviews", "Showing all neighborhood feedback")}>
                <Text style={styles.seeAllLink}>See all</Text>
              </Pressable>
            </View>

            {/* Horizontal Scrollable Testimonials */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={width * 0.76}
              decelerationRate="fast"
              contentContainerStyle={styles.reviewsScrollContainer}
            >
              {LOCALITY_REVIEWS.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <Image source={{ uri: rev.avatar }} style={styles.reviewAvatar} contentFit="cover" />
                    <View style={styles.reviewAuthorInfo}>
                      <Text style={styles.reviewAuthorName}>{rev.authorName}</Text>
                      <Text style={styles.reviewAuthorRole}>{rev.role}</Text>
                      <View style={styles.starsRow}>
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} size={11} color="#FFB800" fill="#FFB800" style={styles.starIcon} />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewComment} numberOfLines={3}>
                    {rev.comment}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Card 8: Agent Section (LinkedIn-style Profile Card) */}
          <View style={styles.sectionCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={styles.sectionHeader}>Listing Agent</Text>
              <Pressable
                onPress={() => {
                  router.push({
                    pathname: "/broker/[id]",
                    params: { id: matchedBroker?.id || property.ownerName },
                  });
                }}
              >
                <Text style={{ fontSize: 13, color: "#E05A36", fontWeight: "700" }}>
                  View Full Profile →
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                router.push({
                  pathname: "/broker/[id]",
                  params: { id: matchedBroker?.id || property.ownerName },
                });
              }}
              style={({ pressed }) => [
                styles.agentCard,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Image
                source={{
                  uri: matchedBroker?.avatarUrl || (matchedBroker?.id === "dir-dealer-1"
                    ? "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80"
                    : matchedBroker?.id === "dir-dealer-2"
                    ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
                    : matchedBroker?.id === "dir-dealer-3"
                    ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
                    : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80")
                }}
                style={styles.agentAvatar}
                contentFit="cover"
              />
              <View style={styles.agentInfo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={styles.agentName}>{property.ownerName}</Text>
                  <ShieldCheck size={14} color="#0E9F6E" />
                </View>
                <Text style={styles.agentTitle}>
                  {matchedBroker ? matchedBroker.firmName : "Real Estate Consultant"}
                </Text>
                <Text style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                  {matchedBroker?.experience || "8+ Years Experience"} · ★ {matchedBroker?.rating || "4.9"} ({matchedBroker?.reviewsCount || "128"})
                </Text>
              </View>
              <View style={styles.agentActions}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCall();
                  }}
                  style={styles.agentActionButton}
                >
                  <Phone size={18} color="#E05A36" />
                </Pressable>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleWhatsApp();
                  }}
                  style={styles.agentActionButton}
                >
                  <MessageSquare size={18} color="#E05A36" />
                </Pressable>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Footer */}
      <View style={styles.bottomFooter}>
        {userRole === "user" && property.status === "Active" ? (
          <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => setShowVisit(true)}
              style={[styles.rentNowButton, { flex: 1, backgroundColor: "#0F1E36" }]}
            >
              <Text style={styles.rentNowButtonText}>Book visit</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowInquiry(true)}
              style={[styles.rentNowButton, { flex: 1 }]}
            >
              <Text style={styles.rentNowButtonText}>Inquire</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={handleRentOrBuy} style={styles.rentNowButton}>
            <Text style={styles.rentNowButtonText}>
              {property.purpose === "buy" || property.purpose === "sell" ? "Buy now" : "Rent now"}
            </Text>
          </Pressable>
        )}
      </View>

      <ModalSheet
        visible={showInquiry}
        onClose={() => setShowInquiry(false)}
        avoidKeyboard
        maxHeight="85%"
      >
        <ModalSheetHeader
          title="Submit inquiry"
          onClose={() => setShowInquiry(false)}
        />
        <View style={styles.inquirySheet}>
          <Text style={styles.inquiryHint} numberOfLines={2}>
            {property.title}
          </Text>
          <Text style={styles.inquiryLabel}>Name *</Text>
          <TextInput
            value={inquiryName}
            onChangeText={setInquiryName}
            placeholder="Your name"
            placeholderTextColor="#9CA3AF"
            style={styles.inquiryPhoneInput}
          />
          <Text style={styles.inquiryLabel}>Email (stable for this account)</Text>
          <TextInput
            value={userEmail}
            editable={false}
            style={[styles.inquiryPhoneInput, { opacity: 0.7 }]}
          />
          <Text style={styles.inquiryLabel}>Message *</Text>
          <TextInput
            value={inquiryMessage}
            onChangeText={setInquiryMessage}
            placeholder="I am interested in a site visit this weekend..."
            placeholderTextColor="#9CA3AF"
            multiline
            style={styles.inquiryInput}
          />
          <Text style={styles.inquiryLabel}>Phone (optional)</Text>
          <TextInput
            value={inquiryPhone}
            onChangeText={setInquiryPhone}
            placeholder="+91 ..."
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            style={styles.inquiryPhoneInput}
          />
          <Pressable onPress={handleSubmitInquiry} style={styles.inquirySubmit}>
            <Text style={styles.rentNowButtonText}>Send to dealer</Text>
          </Pressable>
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showVisit}
        onClose={() => setShowVisit(false)}
        avoidKeyboard
        maxHeight="85%"
      >
        <ModalSheetHeader
          title="Book site visit"
          onClose={() => setShowVisit(false)}
        />
        <View style={styles.inquirySheet}>
          <Text style={styles.inquiryHint} numberOfLines={2}>
            {property.title}
          </Text>
          <Text style={styles.inquiryLabel}>Date * (YYYY-MM-DD)</Text>
          <TextInput
            value={visitDate}
            onChangeText={setVisitDate}
            placeholder="2026-08-01"
            placeholderTextColor="#9CA3AF"
            style={styles.inquiryPhoneInput}
          />
          <Text style={styles.inquiryLabel}>Time *</Text>
          <TextInput
            value={visitTime}
            onChangeText={setVisitTime}
            placeholder="11:00 AM"
            placeholderTextColor="#9CA3AF"
            style={styles.inquiryPhoneInput}
          />
          <Text style={styles.inquiryLabel}>Phone</Text>
          <TextInput
            value={visitPhone}
            onChangeText={setVisitPhone}
            placeholder="+91 ..."
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            style={styles.inquiryPhoneInput}
          />
          <Pressable onPress={handleBookVisit} style={styles.inquirySubmit}>
            <Text style={styles.rentNowButtonText}>Request visit</Text>
          </Pressable>
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9F6", // Unified off-white cream background
  },
  errorArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF9F6",
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  errorBackBtn: {
    marginTop: 15,
    backgroundColor: "#E05A36",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorBackBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FAF9F6",
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F1E36",
    textAlign: "center",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  imageCardContainer: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    height: 280,
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  carouselScrollView: {
    width: "100%",
    height: "100%",
  },
  mainPropertyImage: {
    width: "100%",
    height: "100%",
  },
  carouselIndicators: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  indicatorDotActive: {
    backgroundColor: "#E05A36",
    width: 20,
  },
  reraBadge: {
    position: "absolute",
    top: 15,
    left: 15,
    backgroundColor: "rgba(15, 30, 54, 0.85)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(224, 90, 54, 0.4)",
  },
  reraBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  thumbnailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  thumbnailWrapper: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#FFFFFF",
  },
  thumbnailWrapperActive: {
    borderColor: "#E05A36",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    padding: 16,
    marginBottom: 16,
  },
  titlePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F1E36",
    lineHeight: 26,
  },
  locationWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  priceWrapper: {
    alignItems: "flex-end",
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#E05A36",
  },
  pricePeriod: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F1E36",
    marginBottom: 16,
  },
  specsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  specColumn: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  specLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 6,
  },
  specIconValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  specValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F1E36",
  },
  specValueSimple: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F1E36",
  },
  descriptionText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    fontWeight: "400",
  },
  readMoreLink: {
    fontSize: 14,
    color: "#E05A36",
    fontWeight: "600",
    marginTop: 6,
  },
  pricingBreakdownContainer: {
    width: "100%",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  breakdownLabel: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F1E36",
  },
  emiResultBox: {
    backgroundColor: "#FAF9F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAE9E4",
    marginBottom: 16,
  },
  emiResultVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E05A36",
  },
  emiResultLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    marginTop: 2,
  },
  calcControlGroup: {
    marginBottom: 14,
  },
  calcControlHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  calcControlTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F1E36",
  },
  calcControlValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E05A36",
  },
  incrementRow: {
    flexDirection: "row",
    gap: 8,
  },
  incrementBtn: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#EAE9E4",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  incrementBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F1E36",
  },
  calcSummaryFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
    marginTop: 4,
  },
  calcSummaryFooterText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  agentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF9F6",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E7EB",
  },
  agentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  agentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F1E36",
  },
  agentTitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 2,
  },
  agentActions: {
    flexDirection: "row",
    gap: 8,
  },
  agentActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#EAE9E4",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  facilityChipsContainer: {
    gap: 8,
    paddingBottom: 4,
  },
  facilityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(224, 90, 54, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(224, 90, 54, 0.1)",
  },
  facilityChipActive: {
    borderColor: "#E05A36",
    backgroundColor: "rgba(224, 90, 54, 0.12)",
  },
  facilityChipText: {
    fontSize: 13,
    color: "#0F1E36",
    fontWeight: "600",
  },
  mapContainer: {
    marginTop: 16,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  mapPinOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -30 }],
    alignItems: "center",
  },
  mapPinContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E05A36",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapInfoTooltip: {
    position: "absolute",
    bottom: 34,
    backgroundColor: "rgba(15, 30, 54, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    width: 150,
    alignItems: "center",
  },
  mapTooltipText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  verifBox: {
    backgroundColor: "rgba(224, 90, 54, 0.04)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(224, 90, 54, 0.15)",
  },
  verifHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 90, 54, 0.1)",
    paddingBottom: 8,
  },
  verifHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F1E36",
  },
  checksList: {
    gap: 8,
  },
  verifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifLabel: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  reraIdRow: {
    backgroundColor: "rgba(15, 30, 54, 0.05)",
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reraIdText: {
    fontSize: 11,
    color: "#0F1E36",
    fontWeight: "700",
  },
  reviewsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAllLink: {
    fontSize: 14,
    color: "#E05A36",
    fontWeight: "600",
    marginBottom: 16,
  },
  reviewsScrollContainer: {
    gap: 12,
    paddingBottom: 8,
  },
  reviewCard: {
    width: width * 0.72,
    backgroundColor: "#FAF9F6",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    marginRight: 12,
  },
  reviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
  },
  reviewAuthorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  reviewAuthorName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F1E36",
  },
  reviewAuthorRole: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 1,
  },
  starsRow: {
    flexDirection: "row",
    marginTop: 2,
  },
  starIcon: {
    marginRight: 1,
  },
  reviewComment: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginTop: 10,
    fontWeight: "400",
  },
  bottomFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#EAE9E4",
  },
  rentNowButton: {
    backgroundColor: "#E05A36",
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E05A36",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  rentNowButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  inquiryOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 30, 54, 0.55)",
    justifyContent: "flex-end",
  },
  inquirySheet: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  inquiryHint: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  inquiryLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#374151",
    textTransform: "uppercase",
    marginTop: 4,
  },
  inquiryInput: {
    minHeight: 90,
    textAlignVertical: "top",
    backgroundColor: "#F5F4F0",
    borderWidth: 1,
    borderColor: "#EAE9E4",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#0F1E36",
    fontWeight: "500",
  },
  inquiryPhoneInput: {
    height: 44,
    backgroundColor: "#F5F4F0",
    borderWidth: 1,
    borderColor: "#EAE9E4",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#0F1E36",
    fontWeight: "500",
  },
  inquirySubmit: {
    backgroundColor: "#E05A36",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
});
