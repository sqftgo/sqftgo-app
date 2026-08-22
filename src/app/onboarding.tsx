import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Home,
  MapPin,
  PhoneCall,
  ShieldCheck,
  TrendingUp,
  User,
  Zap,
} from "@/components/ui/icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
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

import { CITIES, City } from "@/constants/cities";
import { useApp } from "@/context/AppContext";
import { colors, fonts, radius, shadow, spacing, type } from "@/theme/tokens";

const UserIcon = User as any;
const BriefcaseIcon = Briefcase as any;
const CheckCircle2Icon = CheckCircle2 as any;
const ChevronRightIcon = ChevronRight as any;
const ChevronLeftIcon = ChevronLeft as any;
const ShieldCheckIcon = ShieldCheck as any;
const TrendingUpIcon = TrendingUp as any;
const MapPinIcon = MapPin as any;
const Building2Icon = Building2 as any;
const HomeIcon = Home as any;
const CheckIcon = Check as any;
const CompassIcon = Compass as any;
const ZapIcon = Zap as any;
const PhoneCallIcon = PhoneCall as any;
const ArrowRightIcon = ArrowRight as any;

// Real photo city list for onboarding selection grid
const ACTIVE_CITIES: City[] = CITIES.slice(0, 6);

// Intentional disabled / coming soon cities (Rule 5)
const COMING_SOON_CITIES: (City & { comingSoon: true })[] = [
  {
    name: "Delhi NCR",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=400&q=80",
    comingSoon: true,
  },
  {
    name: "Mumbai",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=400&q=80",
    comingSoon: true,
  },
];

const INTENT_OPTIONS = {
  user: [
    { id: "buy_home", label: "Buy a Home", desc: "Villas & houses", icon: HomeIcon },
    { id: "rent", label: "Rent Apartment", desc: "Flats & studio units", icon: Building2Icon },
  ],
  broker: [
    { id: "list_prop", label: "Post Properties", desc: "Sell or lease units", icon: HomeIcon },
    { id: "get_leads", label: "Capture Leads", desc: "Direct buyer inquiries", icon: ZapIcon },
    { id: "manage_visits", label: "Schedule Visits", desc: "Calendar & client tours", icon: PhoneCallIcon },
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
      {/* Top Header Bar: Wordmark logo + Segmented progress bar & step text (Rule 1, Rule 2 & Rule 4) */}
      <View style={styles.topHeader}>
        {currentSlide > 0 ? (
          <Pressable onPress={handlePrev} style={styles.headerIconBtn} hitSlop={8}>
            <ChevronLeftIcon size={18} color={colors.ink} />
          </Pressable>
        ) : (
          <Text style={styles.brandWordmark}>SqftGo</Text>
        )}

        {/* Multi-segment step progress bar (Rule 4: ONLY segmented bar & step text at top) */}
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
          <View style={styles.slideContentCentered}>
            <View style={[styles.heroImageBox, { height: Math.min(height * 0.35, 260) }]}>
              <Image
                source={require("../../assets/images/OnBoarding1.png")}
                style={styles.slideImg}
                contentFit="cover"
              />
              <View style={styles.imageOverlayGradient} />
              <View style={styles.heroBadgePill}>
                <ShieldCheckIcon size={14} color={colors.primary} />
                <Text style={styles.heroBadgeText}>Verified listings</Text>
              </View>
            </View>

            <View style={styles.stepHeaderBox}>
              <Text style={styles.slideTitle}>Discover verified properties</Text>
              <Text selectable style={styles.slideSubtitle}>
                Browse curated residential homes, apartments, plots, and investments with transparent pricing.
              </Text>
            </View>

            <View style={styles.featureChipsRow}>
              <View style={styles.featureChip}>
                <CheckCircle2Icon size={14} color={colors.success} />
                <Text style={styles.featureChipText}>100% Verified Listings</Text>
              </View>
              <View style={styles.featureChip}>
                <CheckCircle2Icon size={14} color={colors.success} />
                <Text style={styles.featureChipText}>Direct Dealer Connect</Text>
              </View>
              <View style={styles.featureChip}>
                <CheckCircle2Icon size={14} color={colors.success} />
                <Text style={styles.featureChipText}>Transparent Pricing</Text>
              </View>
            </View>
          </View>
        </View>

        {/* SLIDE 2: Interactive City Selection (Rule 5 & Rule 7) */}
        <View style={[styles.slideContainer, { width }]}>
          <View style={styles.slideContentCentered}>
            <View style={styles.stepHeaderBox}>
              <Text style={styles.slideTitle}>Select your primary city</Text>
              <Text selectable style={styles.slideSubtitle}>
                Choose your location to see local property listings, market rates, and verified dealers.
              </Text>
            </View>

            <View style={styles.citiesGridContainer}>
              {/* Active Cities with real photos */}
              {ACTIVE_CITIES.map((city: City) => {
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
                    {isSelected && (
                      <View style={styles.cityCheckBadge}>
                        <CheckIcon size={12} color={colors.onAccent} />
                      </View>
                    )}
                  </Pressable>
                );
              })}

              {/* Disabled / Coming Soon Cities with visible label & reduced opacity (Rule 5) */}
              {COMING_SOON_CITIES.map((city) => (
                <View key={city.name} style={[styles.cityCard, styles.cityCardDisabled]}>
                  <Image source={{ uri: city.image }} style={styles.cityImg} contentFit="cover" />
                  <View style={styles.cityDisabledOverlay} />
                  <Text style={styles.cityNameTextDisabled}>{city.name}</Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* SLIDE 3: Role & Intent Personalization */}
        <View style={[styles.slideContainer, { width }]}>
          <View style={styles.slideContentCentered}>
            <View style={styles.stepHeaderBox}>
              <Text style={styles.slideTitle}>Customize your profile</Text>
              <Text selectable style={styles.slideSubtitle}>
                Select your role to get tailored listings, market insights, and tools.
              </Text>
            </View>

            {/* Role Cards Row */}
            <View style={styles.roleCardsRow}>
              {/* Property Buyer */}
              <Pressable
                onPress={() => handleSelectRole("user")}
                style={[
                  styles.roleCard,
                  selectedRole === "user" && styles.roleCardActive,
                ]}
              >
                <View style={styles.roleCardTopRow}>
                  <View
                    style={[
                      styles.roleIconBox,
                      selectedRole === "user" ? styles.roleIconBoxActive : styles.roleIconBoxInactive,
                    ]}
                  >
                    <UserIcon
                      size={18}
                      color={selectedRole === "user" ? colors.onAccent : colors.inkSecondary}
                    />
                  </View>
                  <View
                    style={[
                      styles.roleRadioIndicator,
                      selectedRole === "user" && styles.roleRadioIndicatorActive,
                    ]}
                  >
                    {selectedRole === "user" && <CheckIcon size={10} color={colors.onAccent} />}
                  </View>
                </View>

                <Text style={[styles.roleCardTitle, selectedRole === "user" && styles.roleCardTitleActive]}>
                  Property Buyer
                </Text>
                <Text style={styles.roleCardDesc}>
                  Browse verified listings, schedule tours, & save homes.
                </Text>

                <View
                  style={[
                    styles.roleBadgePill,
                    selectedRole === "user" && styles.roleBadgePillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      selectedRole === "user" && styles.roleBadgeTextActive,
                    ]}
                  >
                    Zero Brokerage
                  </Text>
                </View>
              </Pressable>

              {/* Property Dealer */}
              <Pressable
                onPress={() => handleSelectRole("broker")}
                style={[
                  styles.roleCard,
                  selectedRole === "broker" && styles.roleCardActive,
                ]}
              >
                <View style={styles.roleCardTopRow}>
                  <View
                    style={[
                      styles.roleIconBox,
                      selectedRole === "broker" ? styles.roleIconBoxActive : styles.roleIconBoxInactive,
                    ]}
                  >
                    <BriefcaseIcon
                      size={18}
                      color={selectedRole === "broker" ? colors.onAccent : colors.inkSecondary}
                    />
                  </View>
                  <View
                    style={[
                      styles.roleRadioIndicator,
                      selectedRole === "broker" && styles.roleRadioIndicatorActive,
                    ]}
                  >
                    {selectedRole === "broker" && <CheckIcon size={10} color={colors.onAccent} />}
                  </View>
                </View>

                <Text style={[styles.roleCardTitle, selectedRole === "broker" && styles.roleCardTitleActive]}>
                  Property Dealer
                </Text>
                <Text style={styles.roleCardDesc}>
                  Publish listings, capture buyer leads, & close deals.
                </Text>

                <View
                  style={[
                    styles.roleBadgePill,
                    selectedRole === "broker" && styles.roleBadgePillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      selectedRole === "broker" && styles.roleBadgeTextActive,
                    ]}
                  >
                    Direct Leads
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Intent Options Section */}
            <View style={styles.intentSection}>
              <View style={styles.intentHeaderRow}>
                <Text style={styles.intentHeading}>What is your primary goal?</Text>
              </View>

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
                        styles.intentCard,
                        isSelected && styles.intentCardSelected,
                      ]}
                    >
                      <View
                        style={[
                          styles.intentIconCircle,
                          isSelected && styles.intentIconCircleSelected,
                        ]}
                      >
                        <IconComp
                          size={15}
                          color={isSelected ? colors.accent : colors.inkSecondary}
                        />
                      </View>
                      <View style={styles.intentCardTextWrapper}>
                        <Text
                          style={[
                            styles.intentCardTitle,
                            isSelected && styles.intentCardTitleSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        <Text style={styles.intentCardDesc} numberOfLines={1}>
                          {item.desc}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.intentCheckBadge}>
                          <CheckIcon size={9} color={colors.onAccent} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* SLIDE 4: Direct Agent Connect & Portal Confirmation */}
        <View style={[styles.slideContainer, { width }]}>
          <View style={styles.slideContentCentered}>
            <View style={styles.stepHeaderBox}>
              <View style={styles.summaryBadgePill}>
                <Text style={styles.summaryBadgeText}>Portal Configured</Text>
              </View>
              <Text style={styles.slideTitle}>Your SqftGo portal is ready</Text>
              <Text selectable style={styles.slideSubtitle}>
                Tailored for <Text style={styles.highlightText}>{chosenCity}</Text> real estate market
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryList}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconBox}>
                    <PhoneCallIcon size={18} color={colors.primary} />
                  </View>
                  <View style={styles.summaryItemText}>
                    <Text style={styles.summaryItemTitle}>Direct Broker Connect</Text>
                    <Text style={styles.summaryItemDesc}>Instant WhatsApp & call booking with verified local agents</Text>
                  </View>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconBox}>
                    <TrendingUpIcon size={18} color={colors.primary} />
                  </View>
                  <View style={styles.summaryItemText}>
                    <Text style={styles.summaryItemTitle}>Smart Analytics & Insights</Text>
                    <Text style={styles.summaryItemDesc}>Valuation insights, EMI calculators, and legal checks</Text>
                  </View>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconBox}>
                    <ShieldCheckIcon size={18} color={colors.success} />
                  </View>
                  <View style={styles.summaryItemText}>
                    <Text style={styles.summaryItemTitle}>Verified Workspace</Text>
                    <Text style={styles.summaryItemDesc}>
                      Configured for {selectedRole === "broker" ? "Dealer & Broker Directory" : "Property Buyer & Tenant Search"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Fixed Action Bar (Rule 3 & Rule 4: No dot indicators, flat button with minimal 0 2px 4px shadow) */}
      <View
        style={[
          styles.bottomControlBar,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        {currentSlide === 3 ? (
          <Pressable onPress={handleFinish} style={styles.primaryActionBtn}>
            <Text style={styles.primaryActionBtnText}>
              {selectedRole === "broker" ? "Open Dealer Directory" : `Explore Properties in ${chosenCity}`}
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={handleNext} style={styles.primaryActionBtn}>
            <Text style={styles.primaryActionBtnText}>Continue</Text>
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
    paddingVertical: spacing.lg,
  },
  brandWordmark: {
    fontFamily: fonts.logo,
    fontSize: 22,
    color: colors.primary,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: colors.primary,
  },
  stepBadgeText: {
    ...type.micro,
    color: colors.inkMuted,
  },
  skipBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipText: {
    ...type.caption,
    fontWeight: "500",
    color: colors.inkSecondary,
  },
  scrollStyle: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  slideContentCentered: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  heroImageBox: {
    position: "relative",
    width: "100%",
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slideImg: {
    width: "100%",
    height: "100%",
  },
  imageOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.18)",
  },
  heroBadgePill: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBadgeText: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.ink,
  },
  textContainer: {
    marginTop: spacing.lg,
    alignItems: "center",
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
    maxWidth: 320,
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
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureChipText: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.inkSecondary,
  },
  stepHeaderBox: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  citiesGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cityCard: {
    width: "48%",
    height: 86,
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cityCardSelected: {
    borderColor: colors.accent,
  },
  cityCardDisabled: {
    opacity: 0.55,
  },
  cityImg: {
    width: "100%",
    height: "100%",
  },
  cityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.35)",
  },
  cityDisabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
  },
  cityNameText: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    color: colors.onAccent,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  cityNameTextDisabled: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  cityCheckBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  comingSoonText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: colors.inkSecondary,
  },
  roleCardsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    position: "relative",
    gap: spacing.xs,
  },
  roleCardActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  roleCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  roleIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconBoxActive: {
    backgroundColor: colors.accent,
  },
  roleIconBoxInactive: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleRadioIndicator: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  roleRadioIndicatorActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  roleCardTitle: {
    ...type.emphasis,
    fontSize: 14,
    color: colors.ink,
  },
  roleCardTitleActive: {
    color: colors.accent,
  },
  roleCardDesc: {
    ...type.caption,
    fontSize: 11,
    color: colors.inkMuted,
    lineHeight: 15,
  },
  roleBadgePill: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleBadgePillActive: {
    backgroundColor: "rgba(224, 90, 54, 0.12)",
    borderColor: colors.accentBorder,
  },
  roleBadgeText: {
    ...type.micro,
    fontSize: 10,
    color: colors.inkSecondary,
  },
  roleBadgeTextActive: {
    color: colors.accent,
    fontFamily: fonts.sansMedium,
  },
  intentSection: {
    width: "100%",
    marginTop: spacing.md + 4,
    gap: spacing.xs + 2,
  },
  intentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  intentHeading: {
    ...type.label,
    fontSize: 13,
    color: colors.inkSecondary,
  },
  intentSubheading: {
    ...type.micro,
    fontSize: 11,
    color: colors.inkMuted,
  },
  intentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.xs + 2,
  },
  intentCard: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    position: "relative",
  },
  intentCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  intentIconCircle: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  intentIconCircleSelected: {
    backgroundColor: "rgba(224, 90, 54, 0.15)",
  },
  intentCardTextWrapper: {
    flex: 1,
  },
  intentCardTitle: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.ink,
  },
  intentCardTitleSelected: {
    color: colors.accent,
    fontFamily: fonts.sansSemiBold,
  },
  intentCardDesc: {
    ...type.micro,
    fontSize: 10,
    color: colors.inkMuted,
  },
  intentCheckBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadow.card,
    gap: spacing.md,
  },
  summaryBadgePill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginBottom: spacing.xs,
  },
  summaryBadgeText: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.primary,
  },
  highlightText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.ink,
  },
  summaryList: {
    gap: spacing.md,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItemText: {
    flex: 1,
    gap: 2,
  },
  summaryItemTitle: {
    ...type.emphasis,
    fontSize: 14,
    color: colors.ink,
  },
  summaryItemDesc: {
    ...type.caption,
    color: colors.inkMuted,
    lineHeight: 16,
  },
  bottomControlBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
  },
  primaryActionBtn: {
    flexDirection: "row",
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    boxShadow: shadow.button,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  primaryActionBtnText: {
    ...type.emphasis,
    color: colors.onAccent,
  },
});
