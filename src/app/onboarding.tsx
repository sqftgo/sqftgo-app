import React, { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import {
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  MapPin,
  Building2,
  Home,
  Check,
  Compass,
  Zap,
  PhoneCall,
  ArrowRight,
} from "@/components/ui/icons";

import { useApp } from "@/context/AppContext";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";
import { CITIES, City } from "@/constants/cities";

const UserIcon = User as any;
const BriefcaseIcon = Briefcase as any;
const CheckCircle2Icon = CheckCircle2 as any;
const ChevronRightIcon = ChevronRight as any;
const ChevronLeftIcon = ChevronLeft as any;
const ShieldCheckIcon = ShieldCheck as any;
const SparklesIcon = Sparkles as any;
const TrendingUpIcon = TrendingUp as any;
const MapPinIcon = MapPin as any;
const Building2Icon = Building2 as any;
const HomeIcon = Home as any;
const CheckIcon = Check as any;
const CompassIcon = Compass as any;
const ZapIcon = Zap as any;
const PhoneCallIcon = PhoneCall as any;
const ArrowRightIcon = ArrowRight as any;

const POPULAR_CITIES = CITIES.slice(0, 8); // Udaipur, Jaipur, Jodhpur, Kota, Bikaner, Jaisalmer, Rajsamand, Pali

const INTENT_OPTIONS = {
  user: [
    { id: "buy_home", label: "Buy a Home", icon: HomeIcon },
    { id: "rent", label: "Rent Apartment", icon: Building2Icon },
    { id: "invest", label: "Invest in Plots", icon: TrendingUpIcon },
    { id: "explore", label: "Browse Market", icon: CompassIcon },
  ],
  broker: [
    { id: "list_prop", label: "Post Properties", icon: HomeIcon },
    { id: "get_leads", label: "Capture Buyer Leads", icon: ZapIcon },
    { id: "manage_visits", label: "Schedule Site Visits", icon: PhoneCallIcon },
    { id: "analytics", label: "Market Analytics", icon: TrendingUpIcon },
  ],
};

export default function OnboardingScreen() {
  const {
    setHasCompletedOnboarding,
    setPreferredRole,
    selectedCity,
    setSelectedCity,
    onboardingStep,
    setOnboardingStep,
  } = useApp();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [currentSlide, setCurrentSlide] = useState(onboardingStep || 0);
  const [selectedRole, setSelectedRole] = useState<"user" | "broker">("user");
  const [activeIntent, setActiveIntent] = useState<string>("buy_home");
  const [chosenCity, setChosenCity] = useState<string>(selectedCity || "Udaipur");

  const scrollRef = useRef<ScrollView>(null);

  // Resume from persisted onboarding step on mount
  useEffect(() => {
    if (onboardingStep > 0 && onboardingStep <= 3) {
      setCurrentSlide(onboardingStep);
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({ x: onboardingStep * width, animated: false });
      }, 80);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore on unsupported platforms
    }
  };

  const handleScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / width);
    if (index !== currentSlide && index >= 0 && index <= 3) {
      setCurrentSlide(index);
      setOnboardingStep(index);
    }
  };

  const scrollToSlide = (index: number) => {
    triggerHaptic();
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentSlide(index);
    setOnboardingStep(index);
  };

  const handleNext = () => {
    if (currentSlide < 3) {
      scrollToSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      scrollToSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    scrollToSlide(3);
  };

  const handleSelectCity = (cityName: string) => {
    triggerHaptic();
    setChosenCity(cityName);
    setSelectedCity(cityName);
  };

  const handleSelectRole = (role: "user" | "broker") => {
    triggerHaptic();
    setSelectedRole(role);
    setActiveIntent(role === "user" ? "buy_home" : "list_prop");
  };

  const handleFinish = () => {
    triggerHaptic();
    setPreferredRole(selectedRole);
    setSelectedCity(chosenCity);
    setHasCompletedOnboarding(true);
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Segmented Top Header Bar */}
      <View style={styles.topHeader}>
        {currentSlide > 0 ? (
          <Pressable onPress={handlePrev} style={styles.headerIconBtn} hitSlop={8}>
            <ChevronLeftIcon size={18} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={styles.headerIconPlaceholder} />
        )}

        {/* Multi-segment step progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            {[0, 1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressSegment,
                  currentSlide >= step && styles.progressSegmentActive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepBadgeText}>Step {currentSlide + 1} of 4</Text>
        </View>

        {currentSlide < 3 ? (
          <Pressable onPress={handleSkip} style={styles.skipBtn} hitSlop={8}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.headerIconPlaceholder} />
        )}
      </View>

      {/* Main Slide Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollStyle}
      >
        {/* SLIDE 1: Verified Property Catalog Showcase */}
        <View style={[styles.slideContainer, { width }]}>
          <View style={[styles.heroImageBox, { height: Math.min(height * 0.36, 280) }]}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80" }}
              style={styles.slideImg}
              contentFit="cover"
            />
            <View style={styles.imageOverlayGradient} />
            <View style={styles.heroBadgePill}>
              <ShieldCheckIcon size={14} color={colors.accent} />
              <Text style={styles.heroBadgeText}>Zero Commission • Verified</Text>
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.slideTitle}>Discover Verified Properties</Text>
            <Text selectable style={styles.slideSubtitle}>
              Explore vetted luxury villas, modern apartments, commercial spaces, and prime plots in top cities with transparent pricing.
            </Text>
          </View>

          <View style={styles.featureChipsRow}>
            <View style={styles.featureChip}>
              <CheckCircle2Icon size={14} color={colors.success} />
              <Text style={styles.featureChipText}>100% Verified Listings</Text>
            </View>
            <View style={styles.featureChip}>
              <CheckCircle2Icon size={14} color={colors.success} />
              <Text style={styles.featureChipText}>Direct Owner Pricing</Text>
            </View>
            <View style={styles.featureChip}>
              <CheckCircle2Icon size={14} color={colors.success} />
              <Text style={styles.featureChipText}>Zero Hidden Charges</Text>
            </View>
          </View>
        </View>

        {/* SLIDE 2: Interactive City Selection */}
        <View style={[styles.slideContainer, { width }]}>
          <View style={styles.stepHeaderBox}>
            <View style={styles.stepIconCircle}>
              <MapPinIcon size={22} color={colors.accent} />
            </View>
            <Text style={styles.slideTitle}>Select Your Primary City</Text>
            <Text selectable style={styles.slideSubtitle}>
              Tailor your recommendations, local dealer inventory, and market rate updates.
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.citiesGrid}
          >
            {POPULAR_CITIES.map((city: City) => {
              const isSelected = chosenCity.toLowerCase() === city.name.toLowerCase();
              return (
                <Pressable
                  key={city.name}
                  onPress={() => handleSelectCity(city.name)}
                  style={[
                    styles.cityCard,
                    isSelected && styles.cityCardSelected,
                  ]}
                >
                  <Image source={{ uri: city.image }} style={styles.cityImg} contentFit="cover" />
                  <View style={styles.cityOverlay} />
                  <Text style={styles.cityNameText}>{city.name}</Text>
                  {isSelected ? (
                    <View style={styles.cityCheckBadge}>
                      <CheckIcon size={12} color={colors.onAccent} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* SLIDE 3: Role & Intent Personalization */}
        <View style={[styles.slideContainer, { width }]}>
          <View style={styles.stepHeaderBox}>
            <View style={styles.stepIconCircle}>
              <SparklesIcon size={22} color={colors.accent} />
            </View>
            <Text style={styles.slideTitle}>Customize Your Profile</Text>
            <Text selectable style={styles.slideSubtitle}>
              Choose how you plan to use SqftGo to get the right experience.
            </Text>
          </View>

          {/* Role Cards Row */}
          <View style={styles.roleCardsRow}>
            {/* Buyer Card */}
            <Pressable
              onPress={() => handleSelectRole("user")}
              style={[
                styles.roleCard,
                selectedRole === "user" && styles.roleCardActive,
              ]}
            >
              <View
                style={[
                  styles.roleIconCircle,
                  selectedRole === "user" && styles.roleIconCircleActive,
                ]}
              >
                <UserIcon size={18} color={selectedRole === "user" ? colors.onAccent : colors.ink} />
              </View>
              <Text style={[styles.roleCardTitle, selectedRole === "user" && styles.roleCardTitleActive]}>
                Property Buyer
              </Text>
              <Text style={styles.roleCardDesc}>
                Browse verified listings, save properties & schedule site visits.
              </Text>
              {selectedRole === "user" && (
                <View style={styles.checkBadge}>
                  <CheckCircle2Icon size={16} color={colors.accent} fill={colors.accentSoft} />
                </View>
              )}
            </Pressable>

            {/* Dealer Card */}
            <Pressable
              onPress={() => handleSelectRole("broker")}
              style={[
                styles.roleCard,
                selectedRole === "broker" && styles.roleCardActive,
              ]}
            >
              <View
                style={[
                  styles.roleIconCircle,
                  selectedRole === "broker" && styles.roleIconCircleActive,
                ]}
              >
                <BriefcaseIcon size={18} color={selectedRole === "broker" ? colors.onAccent : colors.ink} />
              </View>
              <Text style={[styles.roleCardTitle, selectedRole === "broker" && styles.roleCardTitleActive]}>
                Property Dealer
              </Text>
              <Text style={styles.roleCardDesc}>
                Post properties, capture buyer leads & manage client visits.
              </Text>
              {selectedRole === "broker" && (
                <View style={styles.checkBadge}>
                  <CheckCircle2Icon size={16} color={colors.accent} fill={colors.accentSoft} />
                </View>
              )}
            </Pressable>
          </View>

          {/* Intent Options Section */}
          <View style={styles.intentSection}>
            <Text style={styles.intentHeading}>What is your primary goal?</Text>
            <View style={styles.intentGrid}>
              {INTENT_OPTIONS[selectedRole].map((item) => {
                const IconComp = item.icon;
                const isSelected = activeIntent === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      triggerHaptic();
                      setActiveIntent(item.id);
                    }}
                    style={[
                      styles.intentChip,
                      isSelected && styles.intentChipSelected,
                    ]}
                  >
                    <IconComp size={14} color={isSelected ? colors.accent : colors.inkMuted} />
                    <Text style={[styles.intentChipText, isSelected && styles.intentChipTextSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* SLIDE 4: Direct Agent Connect & Launch Summary */}
        <View style={[styles.slideContainer, { width }]}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryBadge}>
                <SparklesIcon size={14} color={colors.accent} />
                <Text style={styles.summaryBadgeText}>Ready for Launch</Text>
              </View>
              <Text style={styles.summaryTitle}>Your SqftGo Portal</Text>
              <Text style={styles.summarySubtitle}>
                Connected to <Text style={styles.highlightText}>{chosenCity}</Text> real estate network
              </Text>
            </View>

            <View style={styles.summaryList}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconBox}>
                  <PhoneCallIcon size={16} color={colors.accent} />
                </View>
                <View style={styles.summaryItemText}>
                  <Text style={styles.summaryItemTitle}>Direct Broker Connect</Text>
                  <Text style={styles.summaryItemDesc}>Instant WhatsApp & Call booking with local agents</Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <View style={styles.summaryIconBox}>
                  <TrendingUpIcon size={16} color={colors.info} />
                </View>
                <View style={styles.summaryItemText}>
                  <Text style={styles.summaryItemTitle}>Smart Analytics & Tools</Text>
                  <Text style={styles.summaryItemDesc}>EMI calculators, valuation insights & services</Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <View style={styles.summaryIconBox}>
                  <ShieldCheckIcon size={16} color={colors.success} />
                </View>
                <View style={styles.summaryItemText}>
                  <Text style={styles.summaryItemTitle}>Verified Workspace</Text>
                  <Text style={styles.summaryItemDesc}>
                    Configured for {selectedRole === "broker" ? "Property Dealer & Agent Portal" : "Property Buyer & Tenant Search"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Fixed Action Bar */}
      <View
        style={[
          styles.bottomControlBar,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        {/* Dot Indicators */}
        <View style={styles.carouselIndicators}>
          {[0, 1, 2, 3].map((index) => (
            <Pressable key={index} onPress={() => scrollToSlide(index)} hitSlop={6}>
              <View
                style={[
                  styles.indicatorDot,
                  currentSlide === index && styles.indicatorDotActive,
                ]}
              />
            </Pressable>
          ))}
        </View>

        {currentSlide === 3 ? (
          <Pressable onPress={handleFinish} style={styles.finishBtn}>
            <Text style={styles.finishBtnText}>
              {selectedRole === "broker" ? "Launch Dealer Workspace" : `Explore Properties in ${chosenCity}`}
            </Text>
            <ArrowRightIcon size={18} color={colors.onAccent} />
          </Pressable>
        ) : (
          <Pressable onPress={handleNext} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>Continue</Text>
            <ChevronRightIcon size={18} color={colors.onAccent} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: shadow.card,
  },
  headerIconPlaceholder: {
    width: 36,
  },
  progressContainer: {
    alignItems: "center",
    gap: 4,
  },
  progressBarTrack: {
    flexDirection: "row",
    gap: 4,
    width: 120,
    height: 4,
  },
  progressSegment: {
    flex: 1,
    height: "100%",
    backgroundColor: colors.border,
    borderRadius: radius.full,
  },
  progressSegmentActive: {
    backgroundColor: colors.accent,
  },
  stepBadgeText: {
    ...type.micro,
    color: colors.inkMuted,
  },
  skipBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadow.card,
  },
  skipText: {
    ...type.caption,
    fontWeight: "700",
    color: colors.inkSecondary,
  },
  scrollStyle: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  heroImageBox: {
    position: "relative",
    width: "100%",
    borderRadius: radius.xl,
    overflow: "hidden",
    boxShadow: shadow.card,
    backgroundColor: colors.surfaceSubtle,
  },
  slideImg: {
    width: "100%",
    height: "100%",
  },
  imageOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 30, 54, 0.2)",
  },
  heroBadgePill: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    boxShadow: shadow.card,
  },
  heroBadgeText: {
    ...type.micro,
    color: colors.ink,
    fontWeight: "800",
  },
  textContainer: {
    marginTop: spacing.lg,
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  slideTitle: {
    ...type.title,
    color: colors.ink,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  slideSubtitle: {
    ...type.body,
    color: colors.inkMuted,
    textAlign: "center",
  },
  featureChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xs + 2,
    marginTop: spacing.lg,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadow.card,
  },
  featureChipText: {
    ...type.caption,
    fontWeight: "600",
    color: colors.inkSecondary,
  },
  stepHeaderBox: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  citiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  cityCard: {
    width: "48%",
    height: 84,
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cityCardSelected: {
    borderColor: colors.accent,
    boxShadow: shadow.accent,
  },
  cityImg: {
    width: "100%",
    height: "100%",
  },
  cityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 30, 54, 0.45)",
  },
  cityNameText: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: "700",
  },
  cityCheckBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  roleCardsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
    width: "100%",
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    position: "relative",
    boxShadow: shadow.card,
  },
  roleCardActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  roleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  roleIconCircleActive: {
    backgroundColor: colors.accent,
  },
  roleCardTitle: {
    ...type.label,
    color: colors.ink,
    marginBottom: 2,
    textAlign: "center",
  },
  roleCardTitleActive: {
    color: colors.accent,
    fontWeight: "800",
  },
  roleCardDesc: {
    ...type.micro,
    color: colors.inkMuted,
    textAlign: "center",
    lineHeight: 14,
  },
  checkBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
  },
  intentSection: {
    width: "100%",
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  intentHeading: {
    ...type.label,
    color: colors.inkSecondary,
    marginBottom: spacing.xs,
  },
  intentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs + 2,
  },
  intentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  intentChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  intentChipText: {
    ...type.caption,
    color: colors.inkSecondary,
  },
  intentChipTextSelected: {
    color: colors.accent,
    fontWeight: "700",
  },
  summaryCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadow.raised,
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  summaryHeader: {
    alignItems: "center",
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  summaryBadgeText: {
    ...type.micro,
    color: colors.accent,
    fontWeight: "800",
  },
  summaryTitle: {
    ...type.heading,
    color: colors.ink,
  },
  summarySubtitle: {
    ...type.caption,
    color: colors.inkMuted,
  },
  highlightText: {
    color: colors.accent,
    fontWeight: "700",
  },
  summaryList: {
    gap: spacing.md,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItemText: {
    flex: 1,
  },
  summaryItemTitle: {
    ...type.emphasis,
    fontSize: 14,
    color: colors.ink,
  },
  summaryItemDesc: {
    ...type.caption,
    color: colors.inkMuted,
  },
  bottomControlBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: process.env.EXPO_OS === "ios" ? 34 : spacing.lg,
    backgroundColor: colors.bg,
    alignItems: "center",
    gap: spacing.md,
  },
  carouselIndicators: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: "rgba(15, 30, 54, 0.15)",
  },
  indicatorDotActive: {
    backgroundColor: colors.accent,
    width: 24,
  },
  nextBtn: {
    width: "100%",
    backgroundColor: colors.accent,
    height: 50,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    boxShadow: shadow.accent,
  },
  nextBtnText: {
    ...type.emphasis,
    color: colors.onAccent,
  },
  finishBtn: {
    width: "100%",
    backgroundColor: colors.accent,
    height: 52,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    boxShadow: shadow.accent,
  },
  finishBtnText: {
    ...type.emphasis,
    color: colors.onAccent,
  },
});
