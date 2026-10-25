import {
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  Heart,
  Home,
  MapPin,
  PhoneCall,
  Search,
  ShieldCheck,
  TrendingUp,
  User,
  X,
  Zap,
} from "@/components/ui/icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ds/Button";
import { useApp } from "@/context/AppContext";
import { useCities } from "@/hooks/use-cities";
import { colors, fonts, radius, shadow, spacing, touchTarget, type } from "@/theme/tokens";

const UserIcon = User as any;
const BriefcaseIcon = Briefcase as any;
const CheckCircle2Icon = CheckCircle2 as any;
const ChevronLeftIcon = ChevronLeft as any;
const ShieldCheckIcon = ShieldCheck as any;
const TrendingUpIcon = TrendingUp as any;
const Building2Icon = Building2 as any;
const HomeIcon = Home as any;
const CheckIcon = Check as any;
const ZapIcon = Zap as any;
const PhoneCallIcon = PhoneCall as any;
const SearchIcon = Search as any;
const MapPinIcon = MapPin as any;
const XIcon = X as any;
const HeartIcon = Heart as any;
const CalendarIcon = Calendar as any;

type IntentOption = {
  id: string;
  label: string;
  desc: string;
  icon: typeof HomeIcon;
};

const INTENT_OPTIONS: Record<"user" | "broker", IntentOption[]> = {
  user: [
    { id: "buy_home", label: "Buy a home", desc: "Find verified homes, plots, and investments", icon: HomeIcon },
    { id: "rent", label: "Rent a place", desc: "Browse flats, houses, and PG options", icon: Building2Icon },
    { id: "save_explore", label: "Save & explore", desc: "Shortlist homes and book site visits", icon: HeartIcon },
  ],
  broker: [
    { id: "list_prop", label: "Post listings", desc: "Publish properties for sale or rent", icon: HomeIcon },
    { id: "get_leads", label: "Capture leads", desc: "Get inquiries from serious buyers", icon: ZapIcon },
    { id: "manage_visits", label: "Manage visits", desc: "Schedule and track client tours", icon: CalendarIcon },
  ],
};

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    setHasCompletedOnboarding,
    setPreferredRole,
    setPreferredPurpose,
    selectedCity,
    setSelectedCity,
    preferredRole,
    setOnboardingStep,
  } = useApp();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { cities } = useCities();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedRole, setSelectedRole] = useState<"user" | "broker">(
    preferredRole === "broker" ? "broker" : "user",
  );
  const [activeIntent, setActiveIntent] = useState<string>(
    preferredRole === "broker" ? "list_prop" : "buy_home",
  );
  const [chosenCity, setChosenCity] = useState<string>(selectedCity || "Udaipur");
  const [cityQuery, setCityQuery] = useState("");

  const scrollRef = useRef<ScrollView>(null);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((city) => city.name.toLowerCase().includes(q));
  }, [cities, cityQuery]);

  const citySearchMiss = cityQuery.trim().length > 0 && filteredCities.length === 0;

  const chosenCityImage = useMemo(() => {
    const match = cities.find((c) => c.name.toLowerCase() === chosenCity.toLowerCase());
    return match?.image ?? cities[0]?.image ?? "";
  }, [cities, chosenCity]);

  const activeIntentLabel =
    INTENT_OPTIONS[selectedRole].find((item) => item.id === activeIntent)?.label ?? "";

  useEffect(() => {
    // Guests always start on slide 1 for a consistent first-run experience.
    setOnboardingStep(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
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

  const goToAuth = (mode: "sign-in" | "sign-up") => {
    triggerHaptic();
    setPreferredRole(selectedRole);
    if (selectedRole === "user") {
      setPreferredPurpose(activeIntent === "rent" ? "rent" : activeIntent === "buy_home" ? "buy" : "all");
    } else {
      setPreferredPurpose("all");
    }
    setSelectedCity(chosenCity);
    setHasCompletedOnboarding(true);
    router.push({ pathname: "/auth", params: { mode } } as unknown as Href);
  };

  const handleFinish = () => {
    goToAuth("sign-up");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar: Wordmark logo + Segmented progress bar & step text (Rule 1, Rule 2 & Rule 4) */}
      <View style={styles.topHeader}>
        {currentSlide > 0 ? (
          <Pressable
            onPress={handlePrev}
            style={styles.headerIconBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
          >
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
          <Pressable onPress={handleSkip} style={styles.skipBtn} hitSlop={8} accessibilityRole="button">
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => goToAuth("sign-in")}
            style={styles.skipBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.skipText}>Sign in</Text>
          </Pressable>
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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

        {/* SLIDE 2: City selection with full-catalog search */}
        <View style={[styles.slideContainer, { width }]}>
          <View style={styles.citySlideContent}>
            <View style={styles.stepHeaderBox}>
              <Text style={styles.slideTitle}>Select your primary city</Text>
              <Text selectable style={styles.slideSubtitle}>
                Search or pick a city to see local listings, market rates, and verified dealers.
              </Text>
            </View>

            <View style={styles.citySearchBar}>
              <SearchIcon size={16} color={colors.inkMuted} />
              <TextInput
                style={styles.citySearchInput}
                placeholder="Search your city..."
                placeholderTextColor={colors.placeholder}
                value={cityQuery}
                onChangeText={setCityQuery}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="search"
                accessibilityLabel="Search cities"
              />
              {cityQuery.length > 0 ? (
                <Pressable
                  onPress={() => setCityQuery("")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear city search"
                  style={styles.citySearchClear}
                >
                  <XIcon size={14} color={colors.inkMuted} />
                </Pressable>
              ) : null}
            </View>

            {citySearchMiss ? (
              <View style={styles.cityEmptyState}>
                <View style={styles.cityEmptyIconWrap}>
                  <MapPinIcon size={22} color={colors.accent} />
                </View>
                <Text style={styles.cityEmptyTitle}>
                  We&apos;ll reach {cityQuery.trim()} very soon
                </Text>
                <Text style={styles.cityEmptyBody}>
                  That city isn&apos;t live on SqftGo yet. Clear the search and pick a nearby city for now
                  — we&apos;ll notify you when we expand there.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.cityResultsScroll}
                contentContainerStyle={styles.citiesGridContainer}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                {filteredCities.map((city) => {
                  const isSelected = chosenCity.toLowerCase() === city.name.toLowerCase();
                  return (
                    <Pressable
                      key={city.name}
                      onPress={() => handleSelectCity(city.name)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={city.name}
                      style={[styles.cityCard, isSelected && styles.cityCardSelected]}
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
            )}
          </View>
        </View>

        {/* SLIDE 3: Role & primary goal — same selection language as auth */}
        <View style={[styles.slideContainer, { width }]}>
          <ScrollView
            style={styles.roleSlideScroll}
            contentContainerStyle={styles.roleSlideContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.stepHeaderBox}>
              <Text style={styles.slideTitle}>How will you use SqftGo?</Text>
              <Text selectable style={styles.slideSubtitle}>
                Choose a role for {chosenCity}. You can fine-tune your goal next — same options as
                when you create your account.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>I am a</Text>
            <View style={styles.roleCardsRow}>
              {(
                [
                  {
                    role: "user" as const,
                    title: "Customer",
                    desc: "Buy, rent, save homes, and book visits",
                    Icon: UserIcon,
                  },
                  {
                    role: "broker" as const,
                    title: "Dealer",
                    desc: "List properties, manage leads, and close deals",
                    Icon: BriefcaseIcon,
                  },
                ] as const
              ).map(({ role, title, desc, Icon }) => {
                const active = selectedRole === role;
                return (
                  <Pressable
                    key={role}
                    onPress={() => handleSelectRole(role)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.roleCard, active && styles.roleCardActive]}
                  >
                    <View style={styles.roleCardTopRow}>
                      <View
                        style={[
                          styles.roleIconBox,
                          active ? styles.roleIconBoxActive : styles.roleIconBoxInactive,
                        ]}
                      >
                        <Icon size={18} color={active ? colors.onAccent : colors.inkSecondary} />
                      </View>
                      <View
                        style={[styles.roleRadioIndicator, active && styles.roleRadioIndicatorActive]}
                      >
                        {active ? <CheckIcon size={10} color={colors.onAccent} /> : null}
                      </View>
                    </View>
                    <Text style={[styles.roleCardTitle, active && styles.roleCardTitleActive]}>
                      {title}
                    </Text>
                    <Text style={styles.roleCardDesc}>{desc}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Primary goal</Text>
            <View style={styles.intentList}>
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.intentRow, isSelected && styles.intentRowSelected]}
                  >
                    <View
                      style={[
                        styles.intentIconCircle,
                        isSelected && styles.intentIconCircleSelected,
                      ]}
                    >
                      <IconComp
                        size={16}
                        color={isSelected ? colors.accent : colors.inkSecondary}
                      />
                    </View>
                    <View style={styles.intentCardTextWrapper}>
                      <Text
                        style={[styles.intentCardTitle, isSelected && styles.intentCardTitleSelected]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.intentCardDesc}>{item.desc}</Text>
                    </View>
                    <View
                      style={[
                        styles.roleRadioIndicator,
                        isSelected && styles.roleRadioIndicatorActive,
                      ]}
                    >
                      {isSelected ? <CheckIcon size={10} color={colors.onAccent} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* SLIDE 4: City-backed ready state */}
        <View style={[styles.slideContainer, { width }]}>
          <ScrollView
            style={styles.roleSlideScroll}
            contentContainerStyle={styles.summarySlideContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View
              style={[
                styles.heroImageBox,
                styles.summaryHeroBox,
                { height: Math.min(height * 0.28, 210) },
              ]}
            >
              {chosenCityImage ? (
                <Image
                  source={{ uri: chosenCityImage }}
                  style={styles.slideImg}
                  contentFit="cover"
                  transition={200}
                />
              ) : null}
              <View style={styles.imageOverlayGradient} />
              <View style={styles.summaryCityPill}>
                <MapPinIcon size={14} color={colors.primary} />
                <Text style={styles.heroBadgeText}>{chosenCity}</Text>
              </View>
              <View style={styles.summaryTrustPill}>
                <ShieldCheckIcon size={14} color={colors.success} />
                <Text style={styles.summaryTrustPillText}>Verified local market</Text>
              </View>
            </View>

            <View style={styles.stepHeaderBox}>
              <Text style={styles.slideTitle}>You&apos;re set for {chosenCity}</Text>
              <Text selectable style={styles.slideSubtitle}>
                {selectedRole === "broker" ? "Dealer" : "Customer"} workspace · {activeIntentLabel}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryList}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconBox}>
                    <MapPinIcon size={18} color={colors.primary} />
                  </View>
                  <View style={styles.summaryItemText}>
                    <Text style={styles.summaryItemTitle}>Local to {chosenCity}</Text>
                    <Text style={styles.summaryItemDesc}>
                      Listings, dealers, and pricing tuned to your selected city
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconBox}>
                    {selectedRole === "broker" ? (
                      <TrendingUpIcon size={18} color={colors.primary} />
                    ) : (
                      <PhoneCallIcon size={18} color={colors.primary} />
                    )}
                  </View>
                  <View style={styles.summaryItemText}>
                    <Text style={styles.summaryItemTitle}>
                      {selectedRole === "broker" ? "Lead-ready tools" : "Direct dealer connect"}
                    </Text>
                    <Text style={styles.summaryItemDesc}>
                      {selectedRole === "broker"
                        ? "Publish listings, track inquiries, and manage site visits"
                        : "WhatsApp, call, and book visits with verified local agents"}
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconBox}>
                    <ShieldCheckIcon size={18} color={colors.success} />
                  </View>
                  <View style={styles.summaryItemText}>
                    <Text style={styles.summaryItemTitle}>Trusted workspace</Text>
                    <Text style={styles.summaryItemDesc}>
                      Create your account next to save preferences and unlock {chosenCity}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
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
          <View style={styles.bottomActions}>
            <Button
              label={
                selectedRole === "broker"
                  ? "Create dealer account"
                  : `Continue with ${chosenCity}`
              }
              onPress={handleFinish}
              fullWidth
            />
            <Pressable
              onPress={() => goToAuth("sign-in")}
              hitSlop={8}
              accessibilityRole="button"
              style={styles.signInRow}
            >
              <Text style={styles.signInPrompt}>Already have an account?</Text>
              <Text style={styles.signInLink}>Sign in</Text>
            </Pressable>
          </View>
        ) : (
          <Button
            label={currentSlide === 1 ? `Continue with ${chosenCity}` : "Continue"}
            onPress={handleNext}
            fullWidth
            disabled={currentSlide === 1 && citySearchMiss}
          />
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
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconPlaceholder: {
    width: touchTarget,
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
  citySlideContent: {
    flex: 1,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  citySearchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  citySearchInput: {
    flex: 1,
    ...type.body,
    color: colors.ink,
    paddingVertical: spacing.sm,
  },
  citySearchClear: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSubtle,
  },
  cityResultsScroll: {
    flex: 1,
    minHeight: 0,
  },
  citiesGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
    // Keep last row fully clear of the fixed Continue bar
    paddingBottom: touchTarget + spacing.xxl,
  },
  roleSlideScroll: {
    flex: 1,
  },
  roleSlideContent: {
    flexGrow: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing["3xl"],
    gap: spacing.sm,
  },
  summarySlideContent: {
    flexGrow: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing["3xl"],
    gap: spacing.md,
  },
  sectionLabel: {
    ...type.label,
    color: colors.inkSecondary,
    alignSelf: "flex-start",
  },
  sectionLabelSpaced: {
    marginTop: spacing.md,
  },
  intentList: {
    width: "100%",
    gap: spacing.sm,
  },
  intentRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  intentRowSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  summaryHeroBox: {
    marginBottom: spacing.xs,
  },
  summaryCityPill: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
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
  summaryTrustPill: {
    position: "absolute",
    bottom: spacing.sm,
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
  summaryTrustPillText: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.ink,
  },
  cityEmptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  cityEmptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    marginBottom: spacing.xs,
  },
  cityEmptyTitle: {
    ...type.emphasis,
    color: colors.ink,
    textAlign: "center",
  },
  cityEmptyBody: {
    ...type.caption,
    color: colors.inkMuted,
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 18,
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
    borderRadius: radius.xs,
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
    borderRadius: radius.xs,
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
  intentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  intentIconCircleSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  intentCardTextWrapper: {
    flex: 1,
    gap: 2,
  },
  intentCardTitle: {
    ...type.emphasis,
    fontSize: 14,
    color: colors.ink,
  },
  intentCardTitleSelected: {
    color: colors.accent,
  },
  intentCardDesc: {
    ...type.caption,
    color: colors.inkMuted,
    lineHeight: 16,
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
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bottomActions: {
    gap: spacing.md,
  },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  signInPrompt: {
    ...type.body,
    color: colors.inkMuted,
  },
  signInLink: {
    ...type.label,
    color: colors.accent,
    fontFamily: fonts.sansSemiBold,
  },
});
