import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter, type Href } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { appAlert } from "@/components/ui/app-alert";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  EditPencil,
  FileCheck,
  FileText,
  Heart,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
} from "@/components/ui/icons";

import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { MenuGroup, MenuRow } from "@/components/ui/menu-row";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import { PropertyCard } from "@/components/ui/property-card";
import { useApp } from "@/context/AppContext";
import type { DirectoryCategory } from "@/data/types";
import { formatIndianPrice, initialsFromName } from "@/lib/format";
import { ownsDirectory } from "@/lib/ownership";
import { KYC_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const PROFILE_CATEGORIES: DirectoryCategory[] = [
  "Agent & Broker",
  "Builder & Developer",
  "Interior Decorator",
  "Architect",
  "Building Contractor",
  "Property Consultant",
];

const SPECIALTY_OPTIONS = [
  "Heritage Havelis",
  "Lakefront Villas",
  "Agricultural Lands",
  "RERA Clearances",
  "Commercial Leases",
  "Title Checks",
  "Luxury Apartments",
  "Bungalows",
  "Plots & Land",
];

type DealerTab =
  | "personal"
  | "business"
  | "kyc"
  | "bank"
  | "social"
  | "subscription";

// --- Notification Preferences ---
interface NotificationPrefs {
  priceDrops: boolean;
  newMatches: boolean;
  visitReminders: boolean;
  dealerReplies: boolean;
  marketInsights: boolean;
}

const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  priceDrops: true,
  newMatches: true,
  visitReminders: true,
  dealerReplies: true,
  marketInsights: false,
};

export default function ProfileScreen() {
  const router = useRouter();
  const {
    signOut,
    userEmail,
    userName,
    favorites,
    userRole,
    inquiries,
    visits,
    properties,
    dealerAccess,
    canAccessDealerDashboard,
    profile,
    directoryProfiles,
    selectedCity,
    updateDirectoryProfile,
    updateProfile,
  } = useApp();

  // --- Dealer Screen State ---
  const [dealerTab, setDealerTab] = useState<DealerTab>("personal");
  const [saving, setSaving] = useState(false);

  const myDirectory = useMemo(() => {
    if (profile?.directoryProfileId) {
      const byId = directoryProfiles.find((d) => d.id === profile.directoryProfileId);
      if (byId) return byId;
    }
    return directoryProfiles.find((d) =>
      ownsDirectory(d, { userId: profile?.id, email: userEmail }),
    );
  }, [directoryProfiles, profile, userEmail]);

  const [firmName, setFirmName] = useState(myDirectory?.firmName ?? "");
  const [ownerName, setOwnerName] = useState(myDirectory?.ownerName ?? userName);
  const [category, setCategory] = useState<DirectoryCategory>(
    myDirectory?.category ?? "Agent & Broker",
  );
  const [address, setAddress] = useState(myDirectory?.address ?? "");
  const [mobile, setMobile] = useState(myDirectory?.mobile ?? profile?.phone ?? "");
  const [website, setWebsite] = useState(myDirectory?.website ?? "");
  const [reraId, setReraId] = useState(myDirectory?.reraId ?? "");
  const [description, setDescription] = useState(myDirectory?.description ?? "");
  const [experience, setExperience] = useState(myDirectory?.experience ?? "");
  const [specialties, setSpecialties] = useState<string[]>(myDirectory?.specialties ?? []);
  const [displayName, setDisplayName] = useState(userName);
  const [phone, setPhone] = useState(profile?.phone ?? "");

  // --- Buyer Profile Modal States ---
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState(userName || "");
  const [editPhone, setEditPhone] = useState(profile?.phone || "");
  const [editBio, setEditBio] = useState(profile?.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [faqModalVisible, setFaqModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Notification Preferences State ---
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIF_PREFS);

  // --- Loan Calculator State ---
  const [loanAmount, setLoanAmount] = useState(5000000); // 50 Lakhs
  const [interestRate, setInterestRate] = useState(8.5); // 8.5%
  const [tenureYears, setTenureYears] = useState(20); // 20 years
  const [loanRequested, setLoanRequested] = useState(false);

  // Load persisted Notification Settings
  useEffect(() => {
    async function loadData() {
      try {
        const storedNotifs = await AsyncStorage.getItem("@sqftgo/notif_prefs");
        if (storedNotifs) {
          setNotifPrefs(JSON.parse(storedNotifs));
        }
      } catch (e) {
        console.error("Error loading persisted notification settings:", e);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    setEditName(userName || "");
    setEditPhone(profile?.phone || "");
    setEditBio(profile?.bio || "");
  }, [userName, profile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Shortlisted Properties
  const savedProperties = useMemo(
    () => properties.filter((p) => favorites.includes(p.id)),
    [properties, favorites],
  );

  const myInquiriesList = useMemo(
    () => inquiries.filter((i) => i.buyerEmail.toLowerCase() === userEmail.toLowerCase()),
    [inquiries, userEmail],
  );

  const myVisitsList = useMemo(
    () => visits.filter((v) => v.buyerEmail.toLowerCase() === userEmail.toLowerCase()),
    [visits, userEmail],
  );

  const openLeads = inquiries.filter(
    (i) => i.brokerEmail === userEmail && (i.status === "new" || i.status === "read"),
  ).length;

  const handleLogout = () => {
    appAlert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  };

  // --- Buyer Profile Handlers ---
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        bio: editBio.trim(),
      });
      setEditProfileModalVisible(false);
      showToast("Profile details updated successfully!");
      if (process.env.EXPO_OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      appAlert("Error", "Could not update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveNotifPrefs = async (newNotifs: NotificationPrefs) => {
    setNotifPrefs(newNotifs);
    try {
      await AsyncStorage.setItem("@sqftgo/notif_prefs", JSON.stringify(newNotifs));
    } catch (e) {
      console.error("Error saving notification settings:", e);
    }
  };

  // --- Loan Calculations ---
  const loanMetrics = useMemo(() => {
    const P = loanAmount;
    const annualRate = interestRate / 100;
    const r = annualRate / 12;
    const n = tenureYears * 12;
    const emi =
      r === 0 ? P / n : Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    const totalPayable = emi * n;
    const totalInterest = Math.max(0, totalPayable - P);
    return { emi, totalPayable, totalInterest };
  }, [loanAmount, interestRate, tenureYears]);

  // Dealer save functions
  const savePersonal = () => {
    updateProfile({ name: displayName.trim(), phone: phone.trim() });
    appAlert("Saved", "Personal details updated.");
  };

  const saveBusiness = async () => {
    if (!myDirectory) {
      appAlert("No directory card", "Complete dealer registration first.");
      return;
    }
    setSaving(true);
    const result = await updateDirectoryProfile(myDirectory.id, {
      firmName: firmName.trim(),
      ownerName: ownerName.trim(),
      category,
      address: address.trim(),
      mobile: mobile.trim(),
      website: website.trim(),
      reraId: reraId.trim() || undefined,
      description: description.trim(),
      experience: experience.trim() || undefined,
      specialties,
    });
    setSaving(false);
    if (!result.ok) {
      appAlert("Save failed", result.message ?? "Try again.");
      return;
    }
    appAlert("Saved", "Business details updated on your directory card.");
  };

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const initials = initialsFromName(userName || userEmail);

  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...type.body,
    color: colors.ink,
    marginBottom: spacing.md,
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Dynamic Toast Feedback */}
      {toastMessage ? (
        <View
          style={{
            position: "absolute",
            top: 50,
            left: spacing.xl,
            right: spacing.xl,
            zIndex: 999,
            backgroundColor: colors.primary,
            borderRadius: radius.sm,
            paddingVertical: spacing.sm + 2,
            paddingHorizontal: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            boxShadow: shadow.raised,
          }}
        >
          <CheckCircle size={18} color={colors.success} />
          <Text style={{ ...type.label, color: colors.onPrimary, flex: 1 }}>{toastMessage}</Text>
        </View>
      ) : null}

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl * 2,
          gap: spacing.xl,
        }}
      >
        {/* ========================================================================= */}
        {/* DEALER DASHBOARD VIEW (If Broker Persona)                                 */}
        {/* ========================================================================= */}
        {canAccessDealerDashboard ? (
          <>
            <Text style={{ ...type.title, color: colors.ink }}>Dealer Profile</Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.sm,
                padding: spacing.lg,
                boxShadow: shadow.card,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: radius.sm,
                  backgroundColor: colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ ...type.heading, color: colors.accent }}>{initials}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ ...type.heading, color: colors.ink }}>
                  {myDirectory?.firmName || userName || "Account"}
                </Text>
                <Text selectable style={{ ...type.caption, color: colors.inkMuted }}>
                  {userEmail}
                </Text>
                <Text style={{ ...type.micro, color: colors.accent }}>Dealer Portal</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {(
                [
                  { id: "personal", label: "Personal" },
                  { id: "business", label: "Business" },
                  { id: "kyc", label: "KYC" },
                  { id: "bank", label: "Bank" },
                  { id: "social", label: "Social" },
                  { id: "subscription", label: "Plan" },
                ] as const
              ).map((tab) => {
                const active = dealerTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setDealerTab(tab.id)}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.sm,
                      backgroundColor: active ? colors.ink : colors.surface,
                      borderWidth: 1,
                      borderColor: active ? colors.ink : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        ...type.caption,
                        fontWeight: "700",
                        color: active ? colors.onAccent : colors.inkSecondary,
                      }}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {dealerTab === "personal" ? (
              <View>
                <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
                  Display name
                </Text>
                <TextInput value={displayName} onChangeText={setDisplayName} style={inputStyle} />
                <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
                  Phone
                </Text>
                <TextInput value={phone} onChangeText={setPhone} style={inputStyle} />
                <Pressable
                  onPress={savePersonal}
                  style={{
                    height: 48,
                    borderRadius: radius.sm,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ ...type.emphasis, color: colors.onAccent }}>Save personal</Text>
                </Pressable>
              </View>
            ) : null}

            {dealerTab === "business" ? (
              <View>
                {!myDirectory ? (
                  <Text style={{ ...type.body, color: colors.inkMuted }}>
                    No directory card linked. Complete dealer registration first.
                  </Text>
                ) : (
                  <>
                    <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
                      Firm name
                    </Text>
                    <TextInput value={firmName} onChangeText={setFirmName} style={inputStyle} />
                    <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
                      Owner name
                    </Text>
                    <TextInput value={ownerName} onChangeText={setOwnerName} style={inputStyle} />
                    <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
                      Category
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: spacing.md }}
                      contentContainerStyle={{ gap: spacing.sm }}
                    >
                      {PROFILE_CATEGORIES.map((c) => (
                        <Pressable
                          key={c}
                          onPress={() => setCategory(c)}
                          style={{
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.sm,
                            borderRadius: radius.sm,
                            backgroundColor:
                              category === c ? colors.accentSoft : colors.surfaceSubtle,
                            borderWidth: 1,
                            borderColor: category === c ? colors.accentBorder : colors.border,
                          }}
                        >
                          <Text
                            style={{
                              ...type.caption,
                              color: category === c ? colors.accent : colors.inkMuted,
                              fontWeight: "700",
                            }}
                          >
                            {c}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
                      Address
                    </Text>
                    <TextInput value={address} onChangeText={setAddress} style={inputStyle} />
                    <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
                      Mobile
                    </Text>
                    <TextInput value={mobile} onChangeText={setMobile} style={inputStyle} />
                    <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
                      Website
                    </Text>
                    <TextInput value={website} onChangeText={setWebsite} style={inputStyle} />
                    <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
                      RERA ID
                    </Text>
                    <TextInput value={reraId} onChangeText={setReraId} style={inputStyle} />
                    <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
                      Experience
                    </Text>
                    <TextInput
                      value={experience}
                      onChangeText={setExperience}
                      style={inputStyle}
                    />
                    <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
                      Description
                    </Text>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      style={{ ...inputStyle, minHeight: 80, textAlignVertical: "top" }}
                    />
                    <Text
                      style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}
                    >
                      Specialties
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: spacing.sm,
                        marginBottom: spacing.md,
                      }}
                    >
                      {SPECIALTY_OPTIONS.map((s) => {
                        const on = specialties.includes(s);
                        return (
                          <Pressable
                            key={s}
                            onPress={() => toggleSpecialty(s)}
                            style={{
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm,
                              borderRadius: radius.sm,
                              backgroundColor: on ? colors.accentSoft : colors.surfaceSubtle,
                              borderWidth: 1,
                              borderColor: on ? colors.accentBorder : colors.border,
                            }}
                          >
                            <Text
                              style={{
                                ...type.caption,
                                color: on ? colors.accent : colors.inkMuted,
                                fontWeight: "600",
                              }}
                            >
                              {s}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Pressable
                      disabled={saving}
                      onPress={() => void saveBusiness()}
                      style={{
                        height: 48,
                        borderRadius: radius.sm,
                        backgroundColor: colors.accent,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      <Text style={{ ...type.emphasis, color: colors.onAccent }}>
                        Save business details
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            ) : null}

            {dealerTab === "kyc" ? (
              <MenuGroup>
                <MenuRow
                  icon={Shield}
                  label="KYC & RERA"
                  sub={
                    profile?.kyc
                      ? KYC_STATUS_LABEL[profile.kyc.status]
                      : "Submit PAN / Aadhaar last 4"
                  }
                  onPress={() => router.push("/dealer-kyc" as Href)}
                  showDivider={false}
                />
              </MenuGroup>
            ) : null}

            {dealerTab === "bank" ? (
              <View
                style={{
                  backgroundColor: colors.surfaceSubtle,
                  borderRadius: radius.sm,
                  padding: spacing.lg,
                  gap: spacing.sm,
                }}
              >
                <CreditCard size={20} color={colors.inkMuted} />
                <Text style={{ ...type.emphasis, color: colors.ink }}>Bank Settlement</Text>
                <Text style={{ ...type.body, color: colors.inkMuted }}>
                  Coming soon — bank details are not saved in this app.
                </Text>
              </View>
            ) : null}

            {dealerTab === "social" ? (
              <View
                style={{
                  backgroundColor: colors.surfaceSubtle,
                  borderRadius: radius.sm,
                  padding: spacing.lg,
                  gap: spacing.sm,
                }}
              >
                <Share2 size={20} color={colors.inkMuted} />
                <Text style={{ ...type.emphasis, color: colors.ink }}>Social Networks</Text>
                <Text style={{ ...type.body, color: colors.inkMuted }}>
                  Coming soon — social links are not persisted yet.
                </Text>
              </View>
            ) : null}

            {dealerTab === "subscription" ? (
              <MenuGroup>
                <MenuRow
                  icon={Sparkles}
                  label="Subscription plans"
                  sub="Marketing stub — billing not live"
                  onPress={() => router.push("/subscription" as Href)}
                  showDivider={false}
                />
              </MenuGroup>
            ) : null}

            <View style={{ gap: spacing.sm }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>DEALER TOOLS</Text>
              <MenuGroup>
                <MenuRow
                  icon={LayoutDashboard}
                  label="Dashboard"
                  onPress={() => router.push("/(tabs)/dashboard" as Href)}
                />
                <MenuRow
                  icon={Building2}
                  label="My properties"
                  onPress={() => router.push("/(tabs)/properties" as Href)}
                />
                <MenuRow
                  icon={Inbox}
                  label="Communications"
                  value={String(openLeads)}
                  onPress={() => router.push("/(tabs)/inquiries" as Href)}
                />
                <MenuRow
                  icon={BarChart3}
                  label="Analytics"
                  onPress={() => router.push("/analytics" as Href)}
                />
                <MenuRow
                  icon={Calendar}
                  label="Manage visits"
                  onPress={() => router.push("/manage-visits" as Href)}
                />
                <MenuRow
                  icon={Plus}
                  label="Add property"
                  onPress={() => router.push("/post-property")}
                />
                <MenuRow
                  icon={Settings}
                  label="Settings"
                  onPress={() => router.push("/dealer-settings" as Href)}
                  showDivider={false}
                />
              </MenuGroup>
            </View>
          </>
        ) : (
          /* ========================================================================= */
          /* ELEVATED BUYER PROFILE SECTION (For Home Seekers & Buyers)                */
          /* ========================================================================= */
          <>
            {/* Header Title & Status */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text style={{ ...type.title, color: colors.ink }}>Buyer Profile</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted }}>
                  Your personal real estate hub & shortlisted properties
                </Text>
              </View>
              <Pressable
                onPress={() => setEditProfileModalVisible(true)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs + 2,
                  borderRadius: radius.sm,
                  backgroundColor: pressed ? colors.accentSoft : colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  boxShadow: shadow.button,
                })}
              >
                <EditPencil size={14} color={colors.accent} />
                <Text style={{ ...type.caption, color: colors.accent, fontWeight: "700" }}>
                  Edit
                </Text>
              </Pressable>
            </View>

            {/* 1. Buyer Persona Hero Card */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.sm,
                padding: spacing.lg,
                boxShadow: shadow.card,
                gap: spacing.md,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
                {/* Avatar */}
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: radius.sm,
                    backgroundColor: colors.primarySoft,
                    borderWidth: 1.5,
                    borderColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ ...type.title, color: colors.primary }}>{initials}</Text>
                </View>

                {/* Identity Info */}
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                    <Text style={{ ...type.heading, color: colors.ink }} numberOfLines={1}>
                      {userName || "Home Seeker"}
                    </Text>
                    <ShieldCheck size={16} color={colors.success} />
                  </View>
                  <Text selectable style={{ ...type.caption, color: colors.inkMuted }}>
                    {userEmail}
                  </Text>
                  {profile?.phone ? (
                    <Text style={{ ...type.caption, color: colors.inkSecondary }}>
                      {profile.phone}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Status Badges & City Pill */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: spacing.sm,
                  paddingTop: spacing.xs,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: colors.successSoft,
                    paddingHorizontal: spacing.sm + 2,
                    paddingVertical: 3,
                    borderRadius: radius.sm,
                  }}
                >
                  <Sparkles size={12} color={colors.success} />
                  <Text style={{ ...type.micro, color: colors.success, fontWeight: "700" }}>
                    Verified Seeker
                  </Text>
                </View>

                <Pressable
                  onPress={() => setCityModalVisible(true)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: pressed ? colors.accentSoft : colors.surfaceSubtle,
                    paddingHorizontal: spacing.sm + 2,
                    paddingVertical: 3,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: colors.border,
                  })}
                >
                  <MapPin size={12} color={colors.accent} />
                  <Text style={{ ...type.micro, color: colors.ink, fontWeight: "700" }}>
                    {selectedCity}
                  </Text>
                  <ChevronRight size={10} color={colors.inkMuted} />
                </Pressable>
              </View>

              {profile?.bio ? (
                <Text
                  style={{
                    ...type.caption,
                    color: colors.inkSecondary,
                    fontStyle: "italic",
                    backgroundColor: colors.surfaceSubtle,
                    padding: spacing.sm,
                    borderRadius: radius.sm,
                  }}
                >
                  "{profile.bio}"
                </Text>
              ) : null}
            </View>

            {/* Pending Dealer Notice if applicable */}
            {dealerAccess === "pending" && userRole !== "broker" ? (
              <Pressable
                onPress={() => router.push("/dealer-pending" as Href)}
                style={{
                  backgroundColor: "rgba(255, 184, 0, 0.12)",
                  borderRadius: radius.sm,
                  padding: spacing.md,
                  gap: spacing.xs,
                  borderWidth: 1,
                  borderColor: "rgba(255, 184, 0, 0.3)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Clock size={16} color="#B45309" />
                  <Text style={{ ...type.emphasis, color: "#B45309" }}>Pending dealer access</Text>
                </View>
                <Text style={{ ...type.caption, color: colors.inkMuted }}>
                  Your directory profile is under review. You can still use all buyer features.
                </Text>
              </Pressable>
            ) : null}

            {/* 2. Shortlisted Properties Carousel / Rail */}
            {savedProperties.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ ...type.heading, color: colors.ink }}>
                    Shortlisted Properties ({savedProperties.length})
                  </Text>
                  <Pressable onPress={() => router.push("/(tabs)/favorites")}>
                    <Text style={{ ...type.caption, color: colors.accent, fontWeight: "700" }}>
                      View all →
                    </Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.xs }}
                >
                  {savedProperties.slice(0, 4).map((p) => (
                    <PropertyCard key={p.id} property={p} variant="compact" />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* 3. Buyer Concierge & Advisory Suite */}
            <View style={{ gap: spacing.sm }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>
                BUYER CONCIERGE & ADVISORY
              </Text>
              <MenuGroup>
                <MenuRow
                  icon={CreditCard}
                  label="Home Loan & EMI Calculator"
                  sub="Calculate monthly EMI & check bank pre-approval"
                  onPress={() => setLoanModalVisible(true)}
                />
                <MenuRow
                  icon={FileCheck}
                  label="RERA & Legal Verification"
                  sub="Verify title deeds, clearances & RERA filings"
                  onPress={() =>
                    appAlert(
                      "Legal Title Checks",
                      "All featured properties on SqftGo are verified with RERA documentation and clear titles. Contact our verified legal consultants in Directory for personalized assistance.",
                      [
                        { text: "Explore Directory", onPress: () => router.push("/services") },
                        { text: "Close", style: "cancel" },
                      ],
                    )
                  }
                />
                <MenuRow
                  icon={Building2}
                  label="Interior Design & Shifting"
                  sub="Connect with top local decorators & moving pros"
                  onPress={() => router.push("/services")}
                  showDivider={false}
                />
              </MenuGroup>
            </View>

            {/* 4. My Real Estate Activity Links */}
            <View style={{ gap: spacing.sm }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>MY ACTIVITY</Text>
              <MenuGroup>
                <MenuRow
                  icon={Heart}
                  label="Saved properties"
                  value={String(savedProperties.length)}
                  onPress={() => router.push("/(tabs)/favorites")}
                />
                <MenuRow
                  icon={MessageSquare}
                  label="My inquiries"
                  value={String(myInquiriesList.length)}
                  onPress={() => router.push("/(tabs)/my-inquiries" as Href)}
                />
                <MenuRow
                  icon={Calendar}
                  label="My site visits"
                  value={String(myVisitsList.length)}
                  onPress={() => router.push("/my-visits" as Href)}
                />
                {dealerAccess === "none" ? (
                  <MenuRow
                    icon={Briefcase}
                    label="Become a verified dealer / broker"
                    sub="List properties & expand your reach"
                    onPress={() => router.push("/dealer-register" as Href)}
                  />
                ) : dealerAccess === "pending" ? (
                  <MenuRow
                    icon={Shield}
                    label="Dealer KYC status"
                    sub="Verification in progress"
                    onPress={() => router.push("/dealer-kyc" as Href)}
                  />
                ) : null}
                <MenuRow
                  icon={Bell}
                  label="Notification alerts"
                  sub="Price drops & matching listings"
                  onPress={() => setNotifModalVisible(true)}
                  showDivider={false}
                />
              </MenuGroup>
            </View>

            {/* 5. Help, FAQs & Support */}
            <View style={{ gap: spacing.sm }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>HELP & LEGAL</Text>
              <MenuGroup>
                <MenuRow
                  icon={HelpCircle}
                  label="Buyer FAQs & Support"
                  sub="Common questions about visits, RERA & booking"
                  onPress={() => setFaqModalVisible(true)}
                />
                <MenuRow
                  icon={FileText}
                  label="Terms of service & privacy"
                  onPress={() =>
                    appAlert(
                      "SqftGo Terms & Privacy",
                      "SqftGo protects buyer confidentiality. Your contact details are only shared with dealers when you submit an explicit inquiry or site visit request.",
                    )
                  }
                  showDivider={false}
                />
              </MenuGroup>
            </View>

            {/* Sign out */}
            <MenuGroup>
              <MenuRow
                icon={LogOut}
                label="Sign out"
                onPress={handleLogout}
                destructive
                showChevron={false}
                showDivider={false}
              />
            </MenuGroup>
          </>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT PROFILE SHEET                                               */}
      {/* ========================================================================= */}
      <ModalSheet
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        avoidKeyboard
      >
        <ModalSheetHeader
          title="Edit Buyer Profile"
          subtitle="Keep your contact info up to date"
          onClose={() => setEditProfileModalVisible(false)}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
        >
          <View>
            <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>Full Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Riya Sharma"
              placeholderTextColor={colors.inkMuted}
              style={inputStyle}
            />
          </View>

          <View>
            <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
              Phone Number
            </Text>
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={colors.inkMuted}
              keyboardType="phone-pad"
              style={inputStyle}
            />
          </View>

          <View>
            <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
              About / Search Bio
            </Text>
            <TextInput
              value={editBio}
              onChangeText={setEditBio}
              placeholder="e.g. Looking for a 3 BHK family apartment near lakes or central city."
              placeholderTextColor={colors.inkMuted}
              multiline
              style={{ ...inputStyle, minHeight: 70, textAlignVertical: "top" }}
            />
          </View>

          <Pressable
            disabled={savingProfile}
            onPress={handleSaveProfile}
            style={({ pressed }) => ({
              height: 48,
              borderRadius: radius.sm,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              marginTop: spacing.sm,
              opacity: pressed || savingProfile ? 0.8 : 1,
            })}
          >
            <Text style={{ ...type.emphasis, color: colors.onAccent }}>
              {savingProfile ? "Saving changes..." : "Save Profile"}
            </Text>
          </Pressable>
        </ScrollView>
      </ModalSheet>

      {/* ========================================================================= */}
      {/* MODAL 2: HOME LOAN & EMI CALCULATOR SHEET                                 */}
      {/* ========================================================================= */}
      <ModalSheet
        visible={loanModalVisible}
        onClose={() => {
          setLoanModalVisible(false);
          setLoanRequested(false);
        }}
      >
        <ModalSheetHeader
          title="Home Loan EMI Calculator"
          subtitle="Plan your real estate financing"
          onClose={() => {
            setLoanModalVisible(false);
            setLoanRequested(false);
          }}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
        >
          {/* Result Card */}
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius.sm,
              padding: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <Text style={{ ...type.caption, color: "rgba(255,255,255,0.7)" }}>
              Estimated Monthly EMI
            </Text>
            <Text style={{ ...type.title, fontSize: 32, color: colors.onPrimary }}>
              ₹{loanMetrics.emi.toLocaleString("en-IN")}/mo
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingTop: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.15)",
              }}
            >
              <View>
                <Text style={{ ...type.micro, color: "rgba(255,255,255,0.7)" }}>Principal</Text>
                <Text style={{ ...type.caption, color: colors.onPrimary, fontWeight: "700" }}>
                  {formatIndianPrice(loanAmount)}
                </Text>
              </View>
              <View>
                <Text style={{ ...type.micro, color: "rgba(255,255,255,0.7)" }}>Total Interest</Text>
                <Text style={{ ...type.caption, color: colors.onPrimary, fontWeight: "700" }}>
                  {formatIndianPrice(loanMetrics.totalInterest)}
                </Text>
              </View>
              <View>
                <Text style={{ ...type.micro, color: "rgba(255,255,255,0.7)" }}>Total Amount</Text>
                <Text style={{ ...type.caption, color: colors.onPrimary, fontWeight: "700" }}>
                  {formatIndianPrice(loanMetrics.totalPayable)}
                </Text>
              </View>
            </View>
          </View>

          {/* Loan Amount Selector */}
          <View style={{ gap: spacing.xs }}>
            <Text style={{ ...type.label, color: colors.ink }}>
              Loan Amount: {formatIndianPrice(loanAmount)}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {[2500000, 5000000, 7500000, 10000000, 20000000].map((amt) => {
                const sel = loanAmount === amt;
                return (
                  <Pressable
                    key={amt}
                    onPress={() => setLoanAmount(amt)}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs + 2,
                      borderRadius: radius.sm,
                      backgroundColor: sel ? colors.ink : colors.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: sel ? colors.ink : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        ...type.caption,
                        fontWeight: "700",
                        color: sel ? colors.onAccent : colors.inkSecondary,
                      }}
                    >
                      {formatIndianPrice(amt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Interest Rate Selector */}
          <View style={{ gap: spacing.xs }}>
            <Text style={{ ...type.label, color: colors.ink }}>
              Interest Rate: {interestRate}% p.a.
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {[7.5, 8.0, 8.5, 9.0, 9.5].map((rate) => {
                const sel = interestRate === rate;
                return (
                  <Pressable
                    key={rate}
                    onPress={() => setInterestRate(rate)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: spacing.sm,
                      borderRadius: radius.sm,
                      backgroundColor: sel ? colors.accentSoft : colors.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: sel ? colors.accentBorder : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        ...type.caption,
                        fontWeight: "700",
                        color: sel ? colors.accent : colors.inkSecondary,
                      }}
                    >
                      {rate}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Tenure Selector */}
          <View style={{ gap: spacing.xs }}>
            <Text style={{ ...type.label, color: colors.ink }}>
              Loan Tenure: {tenureYears} Years
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {[10, 15, 20, 25, 30].map((yr) => {
                const sel = tenureYears === yr;
                return (
                  <Pressable
                    key={yr}
                    onPress={() => setTenureYears(yr)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: spacing.sm,
                      borderRadius: radius.sm,
                      backgroundColor: sel ? colors.ink : colors.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: sel ? colors.ink : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        ...type.caption,
                        fontWeight: "700",
                        color: sel ? colors.onAccent : colors.inkSecondary,
                      }}
                    >
                      {yr}Y
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Bank Pre-Approval CTA */}
          {loanRequested ? (
            <View
              style={{
                backgroundColor: colors.successSoft,
                padding: spacing.md,
                borderRadius: radius.sm,
                gap: spacing.xs,
              }}
            >
              <Text style={{ ...type.emphasis, color: colors.success }}>
                ✓ Pre-Approval Request Received
              </Text>
              <Text style={{ ...type.caption, color: colors.inkSecondary }}>
                Our partner banking specialists will contact you at {profile?.phone || userEmail}{" "}
                with competitive interest rates.
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setLoanRequested(true);
                if (process.env.EXPO_OS === "ios") {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }}
              style={({ pressed }) => ({
                height: 48,
                borderRadius: radius.sm,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ ...type.emphasis, color: colors.onAccent }}>
                Request Partner Bank Pre-Approval
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </ModalSheet>

      {/* ========================================================================= */}
      {/* MODAL 3: NOTIFICATION SETTINGS SHEET                                      */}
      {/* ========================================================================= */}
      <ModalSheet visible={notifModalVisible} onClose={() => setNotifModalVisible(false)}>
        <ModalSheetHeader
          title="Notification Preferences"
          subtitle="Manage alerts and device updates"
          onClose={() => setNotifModalVisible(false)}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: spacing.xs,
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md, gap: 2 }}>
              <Text style={{ ...type.emphasis, color: colors.ink }}>Price Drop Alerts</Text>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                Notify when a saved property lowers its asking price
              </Text>
            </View>
            <Switch
              value={notifPrefs.priceDrops}
              onValueChange={(val) => handleSaveNotifPrefs({ ...notifPrefs, priceDrops: val })}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: spacing.xs,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md, gap: 2 }}>
              <Text style={{ ...type.emphasis, color: colors.ink }}>Matching New Listings</Text>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                Instant alert when a home matching your preferences is listed
              </Text>
            </View>
            <Switch
              value={notifPrefs.newMatches}
              onValueChange={(val) => handleSaveNotifPrefs({ ...notifPrefs, newMatches: val })}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: spacing.xs,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md, gap: 2 }}>
              <Text style={{ ...type.emphasis, color: colors.ink }}>Site Visit Reminders</Text>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                SMS and push reminders 2 hours prior to scheduled visits
              </Text>
            </View>
            <Switch
              value={notifPrefs.visitReminders}
              onValueChange={(val) => handleSaveNotifPrefs({ ...notifPrefs, visitReminders: val })}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: spacing.xs,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md, gap: 2 }}>
              <Text style={{ ...type.emphasis, color: colors.ink }}>Dealer Message Replies</Text>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                Instant notifications when a broker or builder replies to an inquiry
              </Text>
            </View>
            <Switch
              value={notifPrefs.dealerReplies}
              onValueChange={(val) => handleSaveNotifPrefs({ ...notifPrefs, dealerReplies: val })}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: spacing.xs,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md, gap: 2 }}>
              <Text style={{ ...type.emphasis, color: colors.ink }}>Market Trends & Insights</Text>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                Weekly digests on property appreciation rates in {selectedCity}
              </Text>
            </View>
            <Switch
              value={notifPrefs.marketInsights}
              onValueChange={(val) => handleSaveNotifPrefs({ ...notifPrefs, marketInsights: val })}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>
        </ScrollView>
      </ModalSheet>

      {/* ========================================================================= */}
      {/* MODAL 4: BUYER FAQS & SUPPORT SHEET                                       */}
      {/* ========================================================================= */}
      <ModalSheet visible={faqModalVisible} onClose={() => setFaqModalVisible(false)}>
        <ModalSheetHeader
          title="Buyer Help & FAQs"
          subtitle="Answers to common real estate questions"
          onClose={() => setFaqModalVisible(false)}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
        >
          <View
            style={{
              backgroundColor: colors.surfaceSubtle,
              padding: spacing.md,
              borderRadius: radius.sm,
              gap: spacing.xs,
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.ink }}>
              How do I book a free site visit?
            </Text>
            <Text style={{ ...type.body, color: colors.inkSecondary }}>
              Open any Active listing on Explore, tap "Schedule Site Visit", choose your preferred
              date and time slot. The listing dealer will confirm the appointment.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surfaceSubtle,
              padding: spacing.md,
              borderRadius: radius.sm,
              gap: spacing.xs,
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.ink }}>
              Are all properties RERA compliant?
            </Text>
            <Text style={{ ...type.body, color: colors.inkSecondary }}>
              Listings marked with the "RERA Approved" badge have verified registration numbers. You
              can also verify title deeds with our certified property consultants in Directory.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surfaceSubtle,
              padding: spacing.md,
              borderRadius: radius.sm,
              gap: spacing.xs,
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.ink }}>
              Are there any charges for buyers on SqftGo?
            </Text>
            <Text style={{ ...type.body, color: colors.inkSecondary }}>
              Browsing, saving homes, sending inquiries, and scheduling visits on SqftGo are 100%
              free for buyers. Brokerage terms are settled directly with verified dealers.
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setFaqModalVisible(false);
              appAlert(
                "Contact Buyer Support",
                "Email: support@sqftgo.com\nHelpline: +91 80000 12345 (Mon-Sat, 9am-7pm IST)",
              );
            }}
            style={({ pressed }) => ({
              height: 48,
              borderRadius: radius.sm,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ ...type.emphasis, color: colors.onPrimary }}>Contact Support Team</Text>
          </Pressable>
        </ScrollView>
      </ModalSheet>

      {/* City Switcher Modal */}
      <CitySelectionModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
      />
    </SafeAreaView>
  );
}