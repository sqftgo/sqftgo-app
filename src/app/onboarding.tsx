import { useApp } from "@/context/AppContext";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  User
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

const UserIcon = User as any;
const BriefcaseIcon = Briefcase as any;
const CheckCircle2Icon = CheckCircle2 as any;
const ChevronRightIcon = ChevronRight as any;

export default function OnboardingScreen() {
  const { setHasCompletedOnboarding, setPreferredRole } = useApp();
  const { width, height } = useWindowDimensions();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedRole, setSelectedRole] = useState<"user" | "broker">("user");

  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / width);
    setCurrentSlide(index);
  };

  const handleNext = () => {
    if (currentSlide < 2) {
      scrollRef.current?.scrollTo({ x: (currentSlide + 1) * width, animated: true });
    }
  };

  const handleSkip = () => {
    scrollRef.current?.scrollTo({ x: 2 * width, animated: true });
  };

  const handleFinish = () => {
    // Completing onboarding flips the root layout's route guard, which
    // replaces the stack with the auth screen — no back navigation here.
    setPreferredRole(selectedRole);
    setHasCompletedOnboarding(true);
  };

  const slides = [
    {
      title: "Find Premium Properties",
      subtitle: "Browse vetted luxury villas, verified apartments, and prime plots in Udaipur, Jaipur, Surat, and other major cities without any broker fees.",
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80",
      bgTint: "#EEF7FC"
    },
    {
      title: "Direct Agent Booking",
      subtitle: "Skip delays! Connect with partner brokers directly via phone call or WhatsApp to schedule on-site visits.",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
      bgTint: "#FDF2EE"
    },
    {
      title: "Advanced Valuation Tools",
      subtitle: "Audit neighborhood connectivity performance, compare rate averages, and estimate monthly EMIs easily.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
      bgTint: "#FAF5FF"
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* Top action skip button */}
      {currentSlide < 2 && (
        <Pressable onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      {/* Slide Carousels */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollStyle}
      >
        {slides.map((slide, idx) => {
          return (
            <View
              key={idx}
              style={[styles.slideContainer, { width, paddingTop: height * 0.05 }]}
            >
              {/* Feature Showcase image */}
              <View style={[styles.imageBox, { height: height * 0.32 }]}>
                <Image source={{ uri: slide.image }} style={styles.slideImg} contentFit="cover" />
                <View style={[styles.iconFloatCircle, { backgroundColor: slide.bgTint }]}>
                </View>
              </View>

              {/* Title & Description */}
              <View style={styles.textContainer}>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Interactive Bottom Control Section */}
      <View style={styles.bottomControlBar}>

        {/* Onboarding dots indicator */}
        <View style={styles.carouselIndicators}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicatorDot,
                currentSlide === index && styles.indicatorDotActive
              ]}
            />
          ))}
        </View>

        {currentSlide === 2 ? (
          /* Slide 3: Select Role Flow */
          <View style={styles.roleSelectionBox}>
            <View style={styles.roleHeader}>
              <Text style={styles.roleHeading}>Choose login type</Text>
            </View>

            <View style={styles.roleCardsRow}>
              {/* Role 1: Buyer/Tenant */}
              <Pressable
                onPress={() => setSelectedRole("user")}
                style={[
                  styles.roleCard,
                  selectedRole === "user" && styles.roleCardActive
                ]}
              >
                <View style={[
                  styles.roleIconCircle,
                  selectedRole === "user" && styles.roleIconCircleActive
                ]}>
                  <UserIcon size={20} color={selectedRole === "user" ? "#FFFFFF" : "#0F1E36"} />
                </View>
                <Text style={[styles.roleCardTitle, selectedRole === "user" && styles.roleCardTitleActive]}>
                  User
                </Text>
                <Text style={styles.roleCardDesc}>Search homes, save favorites, and inquire with dealers.</Text>
                {selectedRole === "user" && (
                  <View style={styles.checkBadge}>
                    <CheckCircle2Icon size={12} color="#FFFFFF" fill="#E05A36" />
                  </View>
                )}
              </Pressable>

              {/* Role 2: Broker/Owner */}
              <Pressable
                onPress={() => setSelectedRole("broker")}
                style={[
                  styles.roleCard,
                  selectedRole === "broker" && styles.roleCardActive
                ]}
              >
                <View style={[
                  styles.roleIconCircle,
                  selectedRole === "broker" && styles.roleIconCircleActive
                ]}>
                  <BriefcaseIcon size={20} color={selectedRole === "broker" ? "#FFFFFF" : "#0F1E36"} />
                </View>
                <Text style={[styles.roleCardTitle, selectedRole === "broker" && styles.roleCardTitleActive]}>
                  Dealer
                </Text>
                <Text style={styles.roleCardDesc}>
                  List properties, manage leads, and grow your pipeline.
                </Text>
                {selectedRole === "broker" && (
                  <View style={styles.checkBadge}>
                    <CheckCircle2Icon size={12} color="#FFFFFF" fill="#E05A36" />
                  </View>
                )}
              </Pressable>
            </View>

            {/* CTA Action button to enter app */}
            <Pressable onPress={handleFinish} style={styles.finishBtn}>
              <Text style={styles.finishBtnText}>
                {selectedRole === "broker" ? "Continue as Dealer" : "Continue as User"}
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Slide 1 & 2: Simple Next layout buttons */
          <Pressable onPress={handleNext} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>Next</Text>
            <ChevronRightIcon size={16} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9F6", // Cream background
  },
  skipBtn: {
    position: "absolute",
    top: process.env.EXPO_OS === 'ios' ? 56 : 20,
    right: 20,
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  },
  skipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7A7A85",
  },
  scrollStyle: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  imageBox: {
    position: "relative",
    width: "100%",
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 4,
  },
  slideImg: {
    width: "100%",
    height: "100%",
  },
  iconFloatCircle: {
    position: "absolute",
    bottom: -15,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FAF9F6",
    boxShadow: "0 4px 12px rgba(224, 90, 54, 0.18)",
  },
  textContainer: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F1E36", // Slate Blue
    textAlign: "center",
    marginBottom: 12,
  },
  slideSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
  bottomControlBar: {
    paddingHorizontal: 20,
    paddingBottom: process.env.EXPO_OS === 'ios' ? 44 : 24,
    backgroundColor: "#FAF9F6",
    alignItems: "center",
    gap: 20,
  },
  carouselIndicators: {
    flexDirection: "row",
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(122, 122, 133, 0.3)",
  },
  indicatorDotActive: {
    backgroundColor: "#E05A36",
    width: 16,
  },
  nextBtn: {
    width: "100%",
    backgroundColor: "#E05A36", // Theme Accent Orange
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    boxShadow: "0 4px 12px rgba(224, 90, 54, 0.3)",
  },
  nextBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14.5,
  },
  roleSelectionBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
    gap: 12,
  },
  roleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 8,
  },
  roleHeading: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F1E36",
  },
  roleCardsRow: {
    flexDirection: "row",
    gap: 10,
  },
  roleCard: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#EAE9E4",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    position: "relative",
  },
  roleCardActive: {
    backgroundColor: "#FAF5FF",
    borderColor: "#E05A36",
    borderWidth: 1.5,
  },
  roleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EAE9E4",
    marginBottom: 8,
  },
  roleIconCircleActive: {
    backgroundColor: "#E05A36",
    borderColor: "#E05A36",
  },
  roleCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F1E36",
    marginBottom: 4,
  },
  roleCardTitleActive: {
    color: "#E05A36",
  },
  roleCardDesc: {
    fontSize: 8.5,
    color: "#7A7A85",
    textAlign: "center",
    lineHeight: 12,
    fontWeight: "600",
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  finishBtn: {
    backgroundColor: "#E05A36",
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(224, 90, 54, 0.3)",
  },
  finishBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13.5,
  },
});
