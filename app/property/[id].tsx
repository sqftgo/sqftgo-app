import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Linking,
  Alert,
  TextInput,
  Platform,
  ViewStyle,
  TextStyle
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useApp } from "@/context/AppContext";
import { 
  ChevronLeft, 
  Heart, 
  Home, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Briefcase,
  Layers,
  Info,
  CheckCircle2,
  Star,
  Users,
  Compass,
  Camera,
  Armchair,
  Waves,
  Car,
  Shield,
  Dumbbell,
  Trees
} from "lucide-react-native";

const { width } = Dimensions.get("window");

// Mock Local Reviews
const LOCALITY_REVIEWS = [
  {
    id: "rev-1",
    authorName: "Rajesh Vyas",
    role: "Resident Broker",
    rating: 4.8,
    timeAgo: "4 months ago",
    comment: "Excellent connectivity, close to main markets. The water supply is available 24/7. Highly recommended for families."
  },
  {
    id: "rev-2",
    authorName: "Sonia Verma",
    role: "Home Owner",
    rating: 4.5,
    timeAgo: "2 weeks ago",
    comment: "Lived here for 3 years. It is highly secure and peaceful at night. Local metro station is only 1.2 km away. Lacks nearby parks."
  }
];

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { properties, favorites, toggleFavorite, directoryProfiles } = useApp();

  const property = properties.find((p) => p.id === id);

  // Form states
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("I am interested in this property. Please contact me.");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // MagicBricks EMI Calculator states
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTermYears, setLoanTermYears] = useState(15);
  const [interestRate, setInterestRate] = useState(8.5);

  // Image scroll state
  const [activeImageIndex, setActiveImageIndex] = useState(0);



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
      Alert.alert("Error", "Unable to open phone dialer.");
    });
  };

  const handleWhatsApp = () => {
    const message = `Hello, I'm interested in your property: "${property.title}" listed in ${property.city}.`;
    Linking.openURL(`whatsapp://send?phone=${property.ownerPhone}&text=${encodeURIComponent(message)}`).catch(() => {
      Linking.openURL(`https://wa.me/${property.ownerPhone}?text=${encodeURIComponent(message)}`).catch(() => {
        Alert.alert("Error", "Unable to open WhatsApp.");
      });
    });
  };

  const handleSubmitInquiry = () => {
    if (!inquiryName || !inquiryPhone) {
      Alert.alert("Required fields", "Please enter your name and phone number.");
      return;
    }
    setIsSubmitted(true);
    Alert.alert("Inquiry Sent", "The broker will contact you shortly.");
  };

  const handleImageScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / width);
    setActiveImageIndex(index);
  };

  // Find matching broker details
  const matchedBroker = directoryProfiles.find(
    (profile) => profile.ownerName.toLowerCase() === property.ownerName.toLowerCase()
  );

  // Locality Trend Math
  const getLocalityTrend = () => {
    const pricePerSqft = Math.round(property.price / property.size);
    let avgRate = 8000;
    if (property.city.toLowerCase() === "jaipur") avgRate = 9000;
    else if (property.city.toLowerCase() === "ahmedabad") avgRate = 7000;
    else if (property.city.toLowerCase() === "mumbai") avgRate = 25000;

    const percentDiff = ((pricePerSqft - avgRate) / avgRate) * 100;
    return {
      rate: pricePerSqft,
      avg: avgRate,
      status: percentDiff > 10 ? "premium" : percentDiff < -10 ? "good" : "fair"
    };
  };

  const trend = getLocalityTrend();

  // EMI calculation formulas
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
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      
      {/* Floating Glassmorphic Header */}
      <BlurView 
        intensity={Platform.OS === 'ios' ? 80 : 95} 
        tint='dark' 
        style={styles.headerBar as ViewStyle}
      >
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={22} color="#0F1E36" />
        </Pressable>
        <Text style={styles.headerTitle as TextStyle} numberOfLines={1}>Property Details</Text>
        <Pressable onPress={() => toggleFavorite(property.id)} style={styles.iconBtn}>
          <Heart 
            size={20} 
            color={isFav ? "#FF4D4D" : "#0F1E36"} 
            fill={isFav ? "#FF4D4D" : "transparent"} 
          />
        </Pressable>
      </BlurView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Images Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false} 
            style={styles.imageScroll}
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
          >
            {property.images.map((img, index) => (
              <Image key={index} source={{ uri: img }} style={styles.carouselImg} />
            ))}
          </ScrollView>
          
          {/* Tag Badges overlay */}
          <View style={styles.imageOverlayBadges}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{property.type}</Text>
            </View>
            <View style={[styles.purposeBadge, property.purpose === "buy" ? styles.buyBadge : styles.rentBadge]}>
              <Text style={styles.purposeText}>
                {property.purpose === "buy" ? "For Sale" : property.purpose === "rent" ? "For Rent" : "For Lease"}
              </Text>
            </View>
          </View>

          {/* Photo Counter Badge overlay (Bottom Right) */}
          <View style={styles.photoCounterBadge}>
            <Camera size={11} color="#FFFFFF" />
            <Text style={styles.photoCounterText}>
              {activeImageIndex + 1}/{property.images.length}
            </Text>
          </View>
        </View>

        <View style={styles.contentPadding}>
          
          {/* Price & Title Card */}
          <View style={styles.mainDetailsBox}>
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>
                {formatIndianCurrency(property.price)}
                {property.purpose === "rent" || property.purpose === "lease" ? " / mo" : ""}
              </Text>
              
              {property.reraApproved && (
                <View style={styles.reraCertificateBadge}>
                  <ShieldCheck size={11} color="#FFFFFF" fill="#10B981" />
                  <Text style={styles.reraCertificateText}>RERA APPROVED</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.titleText}>{property.title}</Text>
            
            <View style={styles.locationRow}>
              <MapPin size={13} color="#E05A36" />
              <Text style={styles.locationText}>{property.locality}, {property.city}</Text>
            </View>

            {/* Price Locality Trend Capsule */}
            <View style={styles.trendCapsule}>
              <Text style={styles.trendCapsuleLabel}>Locality Rate: </Text>
              <Text style={styles.trendCapsuleValue}>₹{trend.rate.toLocaleString("en-IN")}/sqft</Text>
              {trend.status === "premium" ? (
                <View style={styles.trendBadgePremium}>
                  <Text style={styles.trendBadgeTextPremium}>Premium Locality</Text>
                </View>
              ) : trend.status === "good" ? (
                <View style={styles.trendBadgeGood}>
                  <Text style={styles.trendBadgeTextGood}>Good Deal</Text>
                </View>
              ) : (
                <View style={styles.trendBadgeFair}>
                  <Text style={styles.trendBadgeTextFair}>Fair Market</Text>
                </View>
              )}
            </View>
          </View>

          {/* Specifications Panel */}
          <View style={styles.specBox}>
            {property.bhk && (
              <View style={styles.specItem}>
                <View style={styles.specIconRoundBg}>
                  <Home size={18} color="#2563EB" />
                </View>
                <Text style={styles.specVal}>{property.bhk} BHK</Text>
                <Text style={styles.specLbl}>Configuration</Text>
              </View>
            )}
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <View style={styles.specIconRoundBg}>
                <Layers size={18} color="#2563EB" />
              </View>
              <Text style={styles.specVal}>{property.size} sqft</Text>
              <Text style={styles.specLbl}>Built Area</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <View style={styles.specIconRoundBg}>
                <Armchair size={18} color="#2563EB" />
              </View>
              <Text style={styles.specVal}>{property.furnished}</Text>
              <Text style={styles.specLbl}>Furnishing</Text>
            </View>
          </View>

          {/* Overview & Key Amenities Combined Card */}
          <View style={styles.overviewCard}>
            <Text style={styles.overviewSectionTitle}>OVERVIEW</Text>
            <Text style={styles.overviewDescText}>{property.description}</Text>
            
            {/* Horizontal Icons Row for Key Amenities */}
            <View style={styles.horizontalAmenitiesRow}>
              {/* Lake View */}
              <View style={styles.amenityIconColumn}>
                <View style={styles.amenityIconRoundBg}>
                  <Waves size={16} color="#2563EB" />
                </View>
                <Text style={styles.amenityIconLabel}>Lake View</Text>
              </View>

              {/* Covered Parking */}
              <View style={styles.amenityIconColumn}>
                <View style={styles.amenityIconRoundBg}>
                  <Car size={16} color="#2563EB" />
                </View>
                <Text style={styles.amenityIconLabel}>2 Parking</Text>
              </View>

              {/* 24x7 Security */}
              <View style={styles.amenityIconColumn}>
                <View style={styles.amenityIconRoundBg}>
                  <Shield size={16} color="#2563EB" />
                </View>
                <Text style={styles.amenityIconLabel}>24x7 Security</Text>
              </View>

              {/* Private Gym */}
              <View style={styles.amenityIconColumn}>
                <View style={styles.amenityIconRoundBg}>
                  <Dumbbell size={16} color="#2563EB" />
                </View>
                <Text style={styles.amenityIconLabel}>Private Gym</Text>
              </View>

              {/* Landscape Garden */}
              <View style={styles.amenityIconColumn}>
                <View style={[styles.amenityIconRoundBg, styles.greenRoundBg]}>
                  <Trees size={16} color="#10B981" />
                </View>
                <Text style={styles.amenityIconLabel}>Garden</Text>
              </View>
            </View>
          </View>

          {/* Locality Performance Dashboard */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locality Performance</Text>
            <View style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <Compass size={18} color="#0F1E36" />
                <Text style={styles.scoreHeading}>Neighborhood Scores & Logistics</Text>
              </View>

              <View style={styles.scoreList}>
                {/* 1. Connectivity */}
                <View style={styles.scoreItemCol}>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Connectivity & Public Transport</Text>
                    <Text style={styles.scoreValue}>4.7 / 5.0</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarActive, { width: "94%" }]} />
                  </View>
                </View>

                {/* 2. Safety */}
                <View style={styles.scoreItemCol}>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Safety & Security Rating</Text>
                    <Text style={styles.scoreValue}>4.5 / 5.0</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarActive, { width: "90%", backgroundColor: "#10B981" }]} />
                  </View>
                </View>

                {/* 3. Markets & Groceries */}
                <View style={styles.scoreItemCol}>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Markets, Malls & Groceries</Text>
                    <Text style={styles.scoreValue}>4.4 / 5.0</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarActive, { width: "88%", backgroundColor: "#10B981" }]} />
                  </View>
                </View>

                {/* 4. Schools & Healthcare */}
                <View style={styles.scoreItemCol}>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Schools & Healthcare Centers</Text>
                    <Text style={styles.scoreValue}>4.2 / 5.0</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarActive, { width: "84%", backgroundColor: "#34C759" }]} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* RERA & Legal Checks Checklist */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RERA & Title Verification</Text>
            <View style={styles.verifBox}>
              <View style={styles.verifHeader}>
                <ShieldCheck size={20} color="#065F46" />
                <Text style={styles.verifHeading}>Title Cleared & Vetted</Text>
              </View>
              
              <View style={styles.checksList}>
                <View style={styles.verifRow}>
                  <CheckCircle2 size={13} color="#10B981" />
                  <Text style={styles.verifLabel}>Title Deed Registry Verified</Text>
                </View>
                <View style={styles.verifRow}>
                  <CheckCircle2 size={13} color="#10B981" />
                  <Text style={styles.verifLabel}>Tax Clearance Clearance Checked</Text>
                </View>
                <View style={styles.verifRow}>
                  <CheckCircle2 size={13} color="#10B981" />
                  <Text style={styles.verifLabel}>Physical Site Verification survey completed</Text>
                </View>
                {property.reraId && (
                  <View style={[styles.verifRow, styles.reraIdRow]}>
                    <Info size={12} color="#065F46" />
                    <Text style={styles.reraIdText}>RERA Registration ID: {property.reraId}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Price Breakdown */}
          {property.priceBreakdown && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
              <View style={styles.breakdownBox}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Base Price</Text>
                  <Text style={styles.breakdownVal}>{formatIndianCurrency(property.priceBreakdown.basePrice)}</Text>
                </View>
                {property.priceBreakdown.securityDeposit && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Security Deposit</Text>
                    <Text style={styles.breakdownVal}>{formatIndianCurrency(property.priceBreakdown.securityDeposit)}</Text>
                  </View>
                )}
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Maintenance Charges / mo</Text>
                  <Text style={styles.breakdownVal}>₹{property.priceBreakdown.maintenance.toLocaleString("en-IN")}</Text>
                </View>
                {property.priceBreakdown.registrationFees && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Registration & Stamp Duty</Text>
                    <Text style={styles.breakdownVal}>{formatIndianCurrency(property.priceBreakdown.registrationFees)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* MagicBricks Interactive EMI Calculator */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EMI & Home Loan Estimator</Text>
            <View style={styles.emiCard}>
              <View style={styles.emiResultBox}>
                <Text style={styles.emiResultVal}>₹{calculatedEMI.toLocaleString("en-IN")} / month</Text>
                <Text style={styles.emiResultLabel}>Estimated Monthly EMI</Text>
              </View>

              {/* Loan Breakdown Details */}
              <View style={styles.emiDetailsRow}>
                <View style={styles.emiDetailCol}>
                  <Text style={styles.emiDetailVal}>{formatIndianCurrency(loanAmount)}</Text>
                  <Text style={styles.emiDetailLabel}>Loan Principal</Text>
                </View>
                <View style={styles.emiDetailCol}>
                  <Text style={styles.emiDetailVal}>{formatIndianCurrency(downPaymentVal)}</Text>
                  <Text style={styles.emiDetailLabel}>Down Payment ({downPaymentPercent}%)</Text>
                </View>
              </View>

              {/* Controller 1: Down Payment Percent */}
              <View style={styles.emiControlGroup}>
                <View style={styles.emiControlHeader}>
                  <Text style={styles.emiControlTitle}>Down Payment Ratio</Text>
                  <Text style={styles.emiControlValue}>{downPaymentPercent}%</Text>
                </View>
                <View style={styles.pillRow}>
                  {[10, 20, 30, 40].map((pct) => (
                    <Pressable
                      key={pct}
                      onPress={() => setDownPaymentPercent(pct)}
                      style={[styles.pillBtn, downPaymentPercent === pct && styles.pillBtnActive]}
                    >
                      <Text style={[styles.pillText, downPaymentPercent === pct && styles.pillTextActive]}>
                        {pct}% Down
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Controller 2: Tenure Years */}
              <View style={styles.emiControlGroup}>
                <View style={styles.emiControlHeader}>
                  <Text style={styles.emiControlTitle}>Tenure Duration</Text>
                  <Text style={styles.emiControlValue}>{loanTermYears} Years</Text>
                </View>
                <View style={styles.pillRow}>
                  {[5, 10, 15, 20, 25].map((yrs) => (
                    <Pressable
                      key={yrs}
                      onPress={() => setLoanTermYears(yrs)}
                      style={[styles.pillBtn, loanTermYears === yrs && styles.pillBtnActive]}
                    >
                      <Text style={[styles.pillText, loanTermYears === yrs && styles.pillTextActive]}>
                        {yrs} Yrs
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Controller 3: Interest Rate */}
              <View style={styles.emiControlGroup}>
                <View style={styles.emiControlHeader}>
                  <Text style={styles.emiControlTitle}>Annual Interest Rate</Text>
                  <Text style={styles.emiControlValue}>{interestRate}%</Text>
                </View>
                <View style={styles.pillRow}>
                  {[7.5, 8.0, 8.5, 9.0, 9.5].map((rate) => (
                    <Pressable
                      key={rate}
                      onPress={() => setInterestRate(rate)}
                      style={[styles.pillBtn, interestRate === rate && styles.pillBtnActive]}
                    >
                      <Text style={[styles.pillText, interestRate === rate && styles.pillTextActive]}>
                        {rate}%
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Airbnb-style Local Resident Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Neighborhood Reviews</Text>
            <View style={styles.reviewsList}>
              {LOCALITY_REVIEWS.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatarCircle}>
                      <Users size={14} color="#FFFFFF" />
                    </View>
                    <View style={styles.reviewDetails}>
                      <Text style={styles.reviewAuthor}>{rev.authorName}</Text>
                      <Text style={styles.reviewRole}>{rev.role} • {rev.timeAgo}</Text>
                    </View>
                    <View style={styles.reviewRatingRow}>
                      <Star size={10} color="#FFB800" fill="#FFB800" />
                      <Text style={styles.reviewRatingVal}>{rev.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Assigned Listing Broker Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Listing Agent</Text>
            <View style={styles.agentCard}>
              
              {/* Agent Primary Row */}
              <View style={styles.agentHeader}>
                {/* Left Side: Avatar with Verified Checkmark overlay */}
                <View style={styles.agentAvatarContainer}>
                  <Image 
                    source={{ 
                      uri: matchedBroker?.id === "dir-dealer-1" 
                        ? "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80" 
                        : matchedBroker?.id === "dir-dealer-2"
                        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" 
                        : matchedBroker?.id === "dir-dealer-3"
                        ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" 
                        : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80" 
                    }} 
                    style={styles.agentAvatarImg} 
                  />
                  <View style={styles.agentVerifiedBadge}>
                    <ShieldCheck size={10} color="#FFFFFF" fill="#10B981" />
                  </View>
                </View>

                {/* Right Side: Identity Details */}
                <View style={styles.agentDetails}>
                  <View style={styles.agentNameRow}>
                    <Text style={styles.agentName}>{property.ownerName}</Text>
                    <View style={styles.verifiedTextBadge}>
                      <Text style={styles.verifiedTextBadgeText}>VERIFIED</Text>
                    </View>
                  </View>
                  <Text style={styles.agentCompany}>
                    {matchedBroker ? matchedBroker.firmName : "SVR Premium Partner Broker"}
                  </Text>
                  
                  {/* Micro stats info row */}
                  <View style={styles.agentStatsRow}>
                    <View style={styles.agentStatItem}>
                      <Star size={11} color="#FFB800" fill="#FFB800" />
                      <Text style={styles.agentStatText}>4.9 (18 reviews)</Text>
                    </View>
                    <View style={styles.agentStatDot} />
                    <View style={styles.agentStatItem}>
                      <Briefcase size={11} color="#6B7280" />
                      <Text style={styles.agentStatText}>
                        {matchedBroker ? matchedBroker.experience : "5+ Years Exp"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* RERA Registry & Broker Bio */}
              <View style={styles.agentDivider} />
              
              <View style={styles.agentMetaRow}>
                <View style={styles.agentMetaBlock}>
                  <Text style={styles.agentMetaLabel}>RERA REGISTRY</Text>
                  <Text style={styles.agentMetaValue}>
                    {matchedBroker?.reraId ? matchedBroker.reraId.split('/').pop() : "RAJ/A/UDZ/2022/0854"}
                  </Text>
                </View>
                <View style={styles.agentMetaBlock}>
                  <Text style={styles.agentMetaLabel}>PORTFOLIO</Text>
                  <Text style={styles.agentMetaValue}>
                    {matchedBroker ? `${matchedBroker.listingsCount} active deals` : "8 listings"}
                  </Text>
                </View>
              </View>

              {matchedBroker?.description ? (
                <Text style={styles.agentDesc}>{matchedBroker.description}</Text>
              ) : (
                <Text style={styles.agentDesc}>Experienced luxury property representative specializing in gated villas, heritage havelis, and plot title diligence verification services across Udaipur.</Text>
              )}

              {/* Specialties horizontal tags */}
              <View style={styles.tagsContainer}>
                {(matchedBroker?.specialties || ["Luxury Estates", "Agricultural Lands", "Legal Checkouts"]).map((tag, idx) => (
                  <View key={idx} style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Contact Agent Form */}
          <View style={styles.inquiryBox}>
            <Text style={styles.inquiryTitle}>Contact Listing Agent</Text>
            <Text style={styles.inquiryAgent}>Connect directly with {property.ownerName} for booking a visit</Text>
            
            {isSubmitted ? (
              <View style={styles.successMessage}>
                <CheckCircle2 size={16} color="#065F46" />
                <Text style={styles.successText}>Thank you! Your inquiry was submitted. The partner will call you back shortly.</Text>
              </View>
            ) : (
              <View style={styles.inquiryForm}>
                <View style={styles.inputBox}>
                  <TextInput
                    placeholder="Your Full Name"
                    placeholderTextColor="#9CA3AF"
                    value={inquiryName}
                    onChangeText={setInquiryName}
                    style={styles.inquiryInput}
                  />
                </View>
                <View style={styles.inputBox}>
                  <TextInput
                    placeholder="Phone Number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={inquiryPhone}
                    onChangeText={setInquiryPhone}
                    style={styles.inquiryInput}
                  />
                </View>
                <View style={styles.inputBox}>
                  <TextInput
                    placeholder="Inquiry message"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={inquiryMessage}
                    onChangeText={setInquiryMessage}
                    style={[styles.inquiryInput, styles.inquiryMsgInput]}
                  />
                </View>
                <Pressable onPress={handleSubmitInquiry} style={styles.submitInquiryBtn}>
                  <Text style={styles.submitText}>Submit Inquiry Request</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Drawer */}
      <View style={styles.callDrawer}>
        <Pressable onPress={handleCall} style={[styles.drawerBtn as ViewStyle, styles.callBtn as ViewStyle]}>
          <Phone size={16} color="#FFFFFF" />
          <Text style={styles.drawerBtnText as TextStyle}>Call Agent</Text>
        </Pressable>
        <Pressable onPress={handleWhatsApp} style={[styles.drawerBtn as ViewStyle, styles.waBtn as ViewStyle]}>
          <MessageSquare size={16} color="#FFFFFF" />
          <Text style={styles.drawerBtnText as TextStyle}>WhatsApp</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9F6", // Off-white cream background
  },
  section: {
    marginVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#EAE9E4",
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F1E36",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  errorArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 15,
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
    fontWeight: "800",
  },
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    height: Platform.OS === 'ios' ? 94 : 64,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      }
    })
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  scrollContainer: {
    paddingTop: Platform.OS === 'ios' ? 94 : 64,
    paddingBottom: 110, // Margin for sticky call drawer
  },
  carouselContainer: {
    width: width,
    height: 260,
    position: "relative",
  },
  imageScroll: {
    width: width,
    height: "100%",
  },
  carouselImg: {
    width: width,
    height: 260,
  },
  carouselIndicators: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  indicatorDotActive: {
    backgroundColor: "#FFFFFF",
    width: 16, // Stretched active dot
  },
  imageOverlayBadges: {
    position: "absolute",
    bottom: 12,
    left: 20,
    flexDirection: "row",
    gap: 8,
  },
  photoCounterBadge: {
    position: "absolute",
    bottom: 12,
    right: 15,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  photoCounterText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
  },
  typeBadge: {
    backgroundColor: "#0F1E36",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "800",
  },
  purposeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  buyBadge: {
    backgroundColor: "#E05A36",
  },
  rentBadge: {
    backgroundColor: "#005B96",
  },
  purposeText: {
    fontSize: 8.5,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  contentPadding: {
    padding: 20,
  },
  mainDetailsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F1E36",
  },
  reraCertificateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#34C759",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  reraCertificateText: {
    fontSize: 8,
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F1E36",
    marginBottom: 8,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  locationText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  trendCapsule: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#F9FAFB",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    gap: 6,
  },
  trendCapsuleLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
  },
  trendCapsuleValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F1E36",
    marginRight: 6,
  },
  trendBadgePremium: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendBadgeTextPremium: {
    color: "#EF4444",
    fontSize: 9,
    fontWeight: "800",
  },
  trendBadgeGood: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendBadgeTextGood: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "800",
  },
  trendBadgeFair: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendBadgeTextFair: {
    color: "#3B82F6",
    fontSize: 9,
    fontWeight: "800",
  },
  specBox: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    paddingVertical: 14,
    marginBottom: 20,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  specItem: {
    alignItems: "center",
    flex: 1,
  },
  specIconRoundBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF7FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  specDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#F3F4F6",
    alignSelf: "center",
  },
  specVal: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F1E36",
  },
  specLbl: {
    fontSize: 9.5,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 2,
  },
  overviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    marginBottom: 16,
  },
  overviewSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F1E36",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  overviewDescText: {
    fontSize: 12.5,
    color: "#4B5563",
    lineHeight: 18,
    fontWeight: "500",
  },
  horizontalAmenitiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  amenityIconColumn: {
    alignItems: "center",
    flex: 1,
  },
  amenityIconRoundBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF7FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  greenRoundBg: {
    backgroundColor: "#ECFDF5",
  },
  amenityIconLabel: {
    fontSize: 8.5,
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center",
  },

  scoreCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 8,
  },
  scoreHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F1E36",
  },
  scoreList: {
    gap: 10,
  },
  scoreItemCol: {
    flexDirection: "column",
    gap: 4,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "600",
  },
  scoreValue: {
    fontSize: 11,
    color: "#0F1E36",
    fontWeight: "800",
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    width: "100%",
    overflow: "hidden",
  },
  progressBarActive: {
    height: "100%",
    backgroundColor: "#E05A36",
    borderRadius: 3,
  },
  verifBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  verifHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#D1FAE5",
    paddingBottom: 8,
  },
  verifHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#065F46",
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
    fontSize: 11,
    color: "#065F46",
    fontWeight: "700",
  },
  reraIdRow: {
    backgroundColor: "rgba(6, 95, 70, 0.05)",
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  reraIdText: {
    fontSize: 10,
    color: "#065F46",
    fontWeight: "800",
  },
  breakdownBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  breakdownLabel: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F1E36",
  },
  emiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  emiResultBox: {
    backgroundColor: "#FAF9F6",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAE9E4",
    marginBottom: 16,
  },
  emiResultVal: {
    fontSize: 20,
    fontWeight: "900",
    color: "#E05A36",
  },
  emiResultLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  emiDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 10,
  },
  emiDetailCol: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  emiDetailVal: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F1E36",
  },
  emiDetailLabel: {
    fontSize: 9,
    color: "#6B7280",
    fontWeight: "700",
    marginTop: 2,
  },
  emiControlGroup: {
    marginBottom: 14,
  },
  emiControlHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  emiControlTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },
  emiControlValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E05A36",
  },
  pillRow: {
    flexDirection: "row",
    gap: 6,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pillBtnActive: {
    backgroundColor: "#0F1E36",
    borderColor: "#0F1E36",
  },
  pillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#4B5563",
  },
  pillTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E05A36", // Orange avatar
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  reviewDetails: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F1E36",
  },
  reviewRole: {
    fontSize: 9,
    color: "#9CA3AF",
    fontWeight: "600",
    marginTop: 1,
  },
  reviewRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FAF9F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  reviewRatingVal: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0F1E36",
  },
  reviewComment: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
    fontWeight: "500",
  },
  agentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  agentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  agentAvatarContainer: {
    position: "relative",
  },
  agentAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#EAE9E4",
  },
  agentVerifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  agentDetails: {
    flex: 1,
  },
  agentNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  agentName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F1E36",
  },
  verifiedTextBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTextBadgeText: {
    fontSize: 7.5,
    fontWeight: "900",
    color: "#10B981",
  },
  agentCompany: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 1,
  },
  agentStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  agentStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  agentStatText: {
    fontSize: 9.5,
    color: "#6B7280",
    fontWeight: "600",
  },
  agentStatDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D1D5DB",
  },
  agentDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  agentMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FAF9F6",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  agentMetaBlock: {
    flex: 1,
    alignItems: "center",
  },
  agentMetaLabel: {
    fontSize: 7.5,
    color: "#9CA3AF",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  agentMetaValue: {
    fontSize: 10,
    color: "#0F1E36",
    fontWeight: "800",
    marginTop: 2,
  },
  agentDesc: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "500",
    marginTop: 12,
    lineHeight: 16,
    backgroundColor: "rgba(243, 244, 246, 0.4)",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tagBadge: {
    backgroundColor: "#EEF7FC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D2E6F1",
  },
  tagBadgeText: {
    fontSize: 8.5,
    color: "#005B96",
    fontWeight: "700",
  },
  inquiryBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  inquiryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F1E36",
  },
  inquiryForm: {
    marginTop: 12,
  },
  inquiryAgent: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 2,
  },
  inputBox: {
    marginBottom: 10,
  },
  inquiryInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 42,
    fontSize: 12,
    color: "#1F2937",
    fontWeight: "600",
  },
  inquiryMsgInput: {
    height: 64,
    textAlignVertical: "top",
    paddingVertical: 8,
  },
  submitInquiryBtn: {
    backgroundColor: "#E05A36",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#E05A36",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  successMessage: {
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  successText: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },
  callDrawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#EAE9E4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 10,
  },
  drawerBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  callBtn: {
    backgroundColor: "#0F1E36",
    shadowColor: "#0F1E36",
  },
  waBtn: {
    backgroundColor: "#10B981", // Emerald green matches screenshot perfectly
    shadowColor: "#10B981",
  },
  drawerBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
});
