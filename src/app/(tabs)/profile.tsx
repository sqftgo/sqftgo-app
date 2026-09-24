import { appAlert } from "@/components/ui/app-alert";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useRouter, type Href } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
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
  Eye,
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
  Star
} from "@/components/ui/icons";

import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { MenuGroup, MenuRow } from "@/components/ui/menu-row";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { useApp } from "@/context/AppContext";
import type { DirectoryCategory } from "@/data/types";
import { formatIndianPrice, initialsFromName } from "@/lib/format";
import { ownsDirectory } from "@/lib/ownership";
import { KYC_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const PROFILE_CATEGORIES: DirectoryCategory[] = [
  "Agent & Broker",
  "Builder & Developer",
  "Property Consultant",
  "Interior Decorator",
  "Architect",
  "Building Contractor",
  "Vastu Consultant",
  "Home Valuation/Inspection",
  "Home Shifting/Deep Cleaning",
  "Architect & Interior Designer",
  "House Services",
  "Movers & Packers",
  "Contractors",
  "Event Managers",
  "Wedding Planners",
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
    } catch {
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
            left: spacing.lg,
            right: spacing.lg,
            zIndex: 999,
            backgroundColor: colors.primary,
            borderRadius: radius.md,
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
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xs,
          paddingBottom: spacing["3xl"] * 2,
          gap: spacing.lg,
        }}
      >
        {/* ========================================================================= */}
        {/* DEALER DASHBOARD VIEW (If Broker Persona)                                 */}
        {/* ========================================================================= */}
        {canAccessDealerDashboard ? (
          <>
            <ScreenNavbar
              title="Profile"
              subtitle="Your public broker card"
              actions={[
                {
                  icon: Settings,
                  label: "Settings",
                  onPress: () => router.push("/dealer-settings" as Href),
                },
              ]}
            />

            {/* LinkedIn-Style Broker Hero Card */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
                boxShadow: shadow.card,
              }}
            >
              {/* Cover Banner with RERA status */}
              <View style={{ width: "100%", height: 110, backgroundColor: colors.primary, position: "relative" }}>
                {myDirectory?.coverUrl ? (
                  <Image
                    source={{ uri: myDirectory.coverUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: "100%", height: "100%", backgroundColor: colors.primary }} />
                )}
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(15, 30, 54, 0.35)",
                  }}
                />

                <View
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "rgba(15, 30, 54, 0.8)",
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 3,
                    borderRadius: radius.sm,
                  }}
                >
                  <ShieldCheck size={12} color={colors.success} />
                  <Text style={{ ...type.micro, color: "#FFFFFF" }}>
                    Verified Broker
                  </Text>
                </View>
              </View>

              {/* Avatar & Public Preview Link */}
              <View style={{ padding: spacing.lg, paddingTop: 0 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: -32 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: radius.lg,
                      borderCurve: "continuous",
                      backgroundColor: colors.primary,
                      borderWidth: 3,
                      borderColor: colors.surface,
                      overflow: "hidden",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: shadow.raised,
                    }}
                  >
                    {myDirectory?.avatarUrl ? (
                      <Image
                        source={{ uri: myDirectory.avatarUrl }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={{ ...type.heading, color: colors.onPrimary, fontSize: 20 }}>
                        {initials}
                      </Text>
                    )}
                  </View>

                  {myDirectory?.id ? (
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/broker/[id]",
                          params: { id: myDirectory.id },
                        })
                      }
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.xs,
                        paddingHorizontal: spacing.md,
                        paddingVertical: 6,
                        borderRadius: radius.sm,
                        backgroundColor: pressed ? colors.accentSoft : colors.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: colors.accentBorder,
                      })}
                    >
                      <Eye size={14} color={colors.accent} />
                      <Text style={{ ...type.caption, color: colors.accent, fontWeight: "600" }}>
                        View Public Profile
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {/* Identity & Headline */}
                <View style={{ marginTop: spacing.md, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                    <Text style={{ ...type.heading, color: colors.ink }}>
                      {ownerName || userName || "Broker Partner"}
                    </Text>
                    <ShieldCheck size={16} color={colors.success} />
                  </View>
                  <Text style={{ ...type.caption, color: colors.inkSecondary }}>
                    {myDirectory?.headline || `${category} Specialist`}
                  </Text>
                  <Text style={{ ...type.caption, color: colors.accent, fontWeight: "600" }}>
                    {firmName || myDirectory?.firmName || "Real Estate Agency"}
                  </Text>
                </View>

                {/* Performance Highlights Bar */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surfaceSubtle,
                    borderRadius: radius.md,
                    paddingVertical: spacing.sm + 2,
                    paddingHorizontal: spacing.sm,
                    marginTop: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1, alignItems: "center", gap: 1 }}>
                    <Text style={{ ...type.emphasis, color: colors.ink }}>
                      {myDirectory?.experience || "8+ Yrs"}
                    </Text>
                    <Text style={{ ...type.micro, color: colors.inkMuted, textTransform: "uppercase" }}>
                      Experience
                    </Text>
                  </View>
                  <View style={{ width: 1, height: 22, backgroundColor: colors.border }} />
                  <View style={{ flex: 1, alignItems: "center", gap: 1 }}>
                    <Text style={{ ...type.emphasis, color: colors.ink }}>
                      {myDirectory?.listingsCount || properties.length}
                    </Text>
                    <Text style={{ ...type.micro, color: colors.inkMuted, textTransform: "uppercase" }}>
                      Properties
                    </Text>
                  </View>
                  <View style={{ width: 1, height: 22, backgroundColor: colors.border }} />
                  <View style={{ flex: 1, alignItems: "center", gap: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={{ ...type.emphasis, color: colors.ink }}>
                        {myDirectory?.rating || "4.9"}
                      </Text>
                    </View>
                    <Text style={{ ...type.micro, color: colors.inkMuted, textTransform: "uppercase" }}>
                      ({myDirectory?.reviewsCount || "128"} reviews)
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.xs }}
            >
              {(
                [
                  { id: "personal", label: "Personal" },
                  { id: "business", label: "Firm & Branding" },
                  { id: "kyc", label: "KYC & Licenses" },
                  { id: "bank", label: "Bank Settlement" },
                  { id: "social", label: "Social Networks" },
                  { id: "subscription", label: "Plans & billing" },
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
                      borderRadius: radius.md,
                      backgroundColor: active ? colors.ink : colors.surface,
                      borderWidth: 1,
                      borderColor: active ? colors.ink : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        ...type.caption,
                        fontWeight: "600",
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
              <View style={{ gap: spacing.xs }}>
                <Text style={{ ...type.label, color: colors.inkMuted }}>Display name</Text>
                <TextInput value={displayName} onChangeText={setDisplayName} style={inputStyle} />
                <Text style={{ ...type.label, color: colors.inkMuted }}>Phone</Text>
                <TextInput value={phone} onChangeText={setPhone} style={inputStyle} />
                <Pressable
                  onPress={savePersonal}
                  style={({ pressed }) => ({
                    height: 46,
                    borderRadius: radius.md,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ ...type.emphasis, color: colors.onAccent }}>Save personal</Text>
                </Pressable>
              </View>
            ) : null}

            {dealerTab === "business" ? (
              <View style={{ gap: spacing.xs }}>
                {!myDirectory ? (
                  <Text style={{ ...type.body, color: colors.inkMuted }}>
                    No directory card linked. Complete dealer registration first.
                  </Text>
                ) : (
                  <>
                    <Text style={{ ...type.label, color: colors.inkMuted }}>Firm name</Text>
                    <TextInput value={firmName} onChangeText={setFirmName} style={inputStyle} />
                    <Text style={{ ...type.label, color: colors.inkMuted }}>Owner name</Text>
                    <TextInput value={ownerName} onChangeText={setOwnerName} style={inputStyle} />
                    <Text style={{ ...type.label, color: colors.inkMuted }}>Category</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: spacing.sm }}
                      contentContainerStyle={{ gap: spacing.xs }}
                    >
                      {PROFILE_CATEGORIES.map((c) => (
                        <Pressable
                          key={c}
                          onPress={() => setCategory(c)}
                          style={{
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.xs + 3,
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
                              fontWeight: "600",
                            }}
                          >
                            {c}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <Text style={{ ...type.label, color: colors.inkMuted }}>Address</Text>
                    <TextInput value={address} onChangeText={setAddress} style={inputStyle} />
                    <Text style={{ ...type.label, color: colors.inkMuted }}>Mobile</Text>
                    <TextInput value={mobile} onChangeText={setMobile} style={inputStyle} />
                    <Text style={{ ...type.label, color: colors.inkMuted }}>Website</Text>
                    <TextInput value={website} onChangeText={setWebsite} style={inputStyle} />
                    <Text style={{ ...type.label, color: colors.inkMuted }}>RERA ID</Text>
                    <TextInput value={reraId} onChangeText={setReraId} style={inputStyle} />
                    <Text style={{ ...type.label, color: colors.inkMuted }}>Experience</Text>
                    <TextInput
                      value={experience}
                      onChangeText={setExperience}
                      style={inputStyle}
                    />
                    <Text style={{ ...type.label, color: colors.inkMuted }}>Description</Text>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      style={{ ...inputStyle, minHeight: 80, textAlignVertical: "top" }}
                    />
                    <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>
                      Specialties
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: spacing.xs,
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
                              paddingVertical: spacing.xs + 2,
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
                      style={({ pressed }) => ({
                        height: 46,
                        borderRadius: radius.md,
                        backgroundColor: colors.accent,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: pressed || saving ? 0.7 : 1,
                      })}
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
                  borderRadius: radius.md,
                  padding: spacing.lg,
                  gap: spacing.xs,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <CreditCard size={20} color={colors.inkMuted} />
                <Text style={{ ...type.emphasis, color: colors.ink }}>Bank Settlement</Text>
                <Text style={{ ...type.body, color: colors.inkMuted }}>
                  Coming soon — bank details are securely managed.
                </Text>
              </View>
            ) : null}

            {dealerTab === "social" ? (
              <View
                style={{
                  backgroundColor: colors.surfaceSubtle,
                  borderRadius: radius.md,
                  padding: spacing.lg,
                  gap: spacing.xs,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Share2 size={20} color={colors.inkMuted} />
                <Text style={{ ...type.emphasis, color: colors.ink }}>Social Networks</Text>
                <Text style={{ ...type.body, color: colors.inkMuted }}>
                  Coming soon — social integrations will appear here.
                </Text>
              </View>
            ) : null}

            {dealerTab === "subscription" ? (
              <MenuGroup>
                <MenuRow
                  icon={Building2}
                  label="My projects"
                  sub="Builder launches you manage"
                  onPress={() => router.push("/dealer-projects" as Href)}
                />
                <MenuRow
                  icon={Sparkles}
                  label="Plans & billing"
                  sub="Listing packs and partner plans"
                  onPress={() => router.push("/subscription" as Href)}
                  showDivider={false}
                />
              </MenuGroup>
            ) : null}

            <View style={{ gap: spacing.xs }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>DEALER TOOLS</Text>
              <MenuGroup>
                <MenuRow
                  icon={LayoutDashboard}
                  label="Dashboard"
                  onPress={() => router.push("/(dealer)" as Href)}
                />
                <MenuRow
                  icon={Building2}
                  label="My properties"
                  onPress={() => router.push("/(dealer)/properties" as Href)}
                />
                <MenuRow
                  icon={Building2}
                  label="My projects"
                  onPress={() => router.push("/dealer-projects" as Href)}
                />
                <MenuRow
                  icon={Inbox}
                  label="Communications"
                  value={String(openLeads)}
                  onPress={() => router.push("/(dealer)/inquiries" as Href)}
                />
                <MenuRow
                  icon={BarChart3}
                  label="Analytics"
                  onPress={() => router.push("/(dealer)/analytics" as Href)}
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
            <ScreenNavbar
              title="Profile"
              actions={[
                {
                  icon: Bell,
                  label: "Notification alerts",
                  onPress: () => setNotifModalVisible(true),
                },
                {
                  icon: EditPencil,
                  label: "Edit profile",
                  onPress: () => setEditProfileModalVisible(true),
                },
              ]}
            />

            {/* Identity hero */}
            <View style={{ alignItems: "center", gap: spacing.xs, paddingTop: spacing.xs }}>
              <Pressable
                onPress={() => setEditProfileModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginBottom: spacing.sm })}
              >
                <View
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: radius.full,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: shadow.raised,
                  }}
                >
                  <Text style={{ ...type.hero, fontSize: 30, lineHeight: 36, color: colors.onPrimary }}>
                    {initials}
                  </Text>
                </View>
                <View
                  style={{
                    position: "absolute",
                    right: -2,
                    bottom: -2,
                    width: 30,
                    height: 30,
                    borderRadius: radius.full,
                    backgroundColor: colors.accent,
                    borderWidth: 3,
                    borderColor: colors.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <EditPencil size={13} color={colors.onAccent} strokeWidth={2.2} />
                </View>
              </Pressable>

              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Text style={{ ...type.title, fontSize: 22, color: colors.ink }} numberOfLines={1}>
                  {userName || "Home Seeker"}
                </Text>
                <ShieldCheck size={18} color={colors.success} strokeWidth={2} />
              </View>
              <Text selectable style={{ ...type.body, color: colors.inkMuted }}>
                {userEmail}
              </Text>
              {profile?.phone ? (
                <Text selectable style={{ ...type.caption, color: colors.inkSecondary }}>
                  {profile.phone}
                </Text>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: spacing.sm,
                  marginTop: spacing.sm,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: colors.successSoft,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                    borderRadius: radius.full,
                  }}
                >
                  <ShieldCheck size={13} color={colors.success} />
                  <Text style={{ ...type.micro, color: colors.success }}>Identity confirmed</Text>
                </View>

                <Pressable
                  onPress={() => setCityModalVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Change city, currently ${selectedCity}`}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: pressed ? colors.accentSoft : colors.surface,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: colors.border,
                  })}
                >
                  <MapPin size={13} color={colors.accent} />
                  <Text style={{ ...type.micro, color: colors.ink }}>{selectedCity}</Text>
                  <ChevronRight size={11} color={colors.inkMuted} />
                </Pressable>
              </View>

              {profile?.bio ? (
                <Text
                  style={{
                    ...type.body,
                    color: colors.inkSecondary,
                    fontStyle: "italic",
                    textAlign: "center",
                    maxWidth: 320,
                    marginTop: spacing.sm,
                  }}
                >
                  &ldquo;{profile.bio}&rdquo;
                </Text>
              ) : null}
            </View>

            {/* Activity stats strip */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                boxShadow: shadow.card,
                overflow: "hidden",
              }}
            >
              {[
                { label: "Saved", value: savedProperties.length, icon: Heart, href: "/saved" },
                { label: "Inquiries", value: myInquiriesList.length, icon: MessageSquare, href: "/my-inquiries" },
                { label: "Site visits", value: myVisitsList.length, icon: Calendar, href: "/my-visits" },
              ].map((stat, i) => (
                <Pressable
                  key={stat.label}
                  onPress={() => router.push(stat.href as Href)}
                  accessibilityRole="button"
                  accessibilityLabel={`${stat.label}, ${stat.value}`}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: "center",
                    gap: 2,
                    paddingVertical: spacing.md + 2,
                    borderLeftWidth: i === 0 ? 0 : 1,
                    borderLeftColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceSubtle : colors.surface,
                  })}
                >
                  <stat.icon size={18} color={colors.accent} />
                  <Text
                    style={{ ...type.title, color: colors.ink, fontVariant: ["tabular-nums"] }}
                  >
                    {stat.value}
                  </Text>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>{stat.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Pending Dealer Notice if applicable */}
            {dealerAccess === "pending" && userRole !== "broker" ? (
              <Pressable
                onPress={() => router.push("/dealer-pending" as Href)}
                style={{
                  backgroundColor: colors.warningSoft,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  gap: spacing.xs,
                  borderWidth: 1,
                  borderColor: colors.warningBorder,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Clock size={16} color={colors.warning} />
                  <Text style={{ ...type.emphasis, color: colors.warning }}>Pending dealer access</Text>
                </View>
                <Text style={{ ...type.caption, color: colors.inkMuted }}>
                  Your directory profile is under review. You can still use all customer features.
                </Text>
              </Pressable>
            ) : null}

            <View style={{ gap: spacing.xs }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>ACTIVITY</Text>
              <MenuGroup>
                <MenuRow
                  icon={Briefcase}
                  label="My service bookings"
                  sub="Requests sent to partners"
                  onPress={() => router.push("/my-service-bookings" as Href)}
                />
                <MenuRow
                  icon={Building2}
                  label="Projects & destinations"
                  sub="Browse launches and city hubs"
                  onPress={() => router.push("/projects" as Href)}
                  showDivider={dealerAccess === "none" || dealerAccess === "pending"}
                />
                {dealerAccess === "none" ? (
                  <MenuRow
                    icon={Briefcase}
                    label="Become a verified dealer / broker"
                    sub="List properties & expand your reach"
                    onPress={() => router.push("/dealer-register" as Href)}
                    showDivider={false}
                  />
                ) : dealerAccess === "pending" ? (
                  <MenuRow
                    icon={Shield}
                    label="Dealer KYC status"
                    sub="Verification in progress"
                    onPress={() => router.push("/dealer-kyc" as Href)}
                    showDivider={false}
                  />
                ) : null}
              </MenuGroup>
            </View>

            <View style={{ gap: spacing.xs }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>TOOLS & ADVICE</Text>
              <MenuGroup>
                <MenuRow
                  icon={CreditCard}
                  label="Home loan & EMI calculator"
                  sub="Monthly EMI & bank pre-approval"
                  onPress={() => setLoanModalVisible(true)}
                />
                <MenuRow
                  icon={FileCheck}
                  label="RERA & legal verification"
                  sub="Title deeds, clearances & RERA filings"
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
                  label="Interior design & shifting"
                  sub="Local decorators & moving pros"
                  onPress={() => router.push("/services")}
                  showDivider={false}
                />
              </MenuGroup>
            </View>

            <View style={{ gap: spacing.xs }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>ACCOUNT & HELP</Text>
              <MenuGroup>
                <MenuRow
                  icon={Bell}
                  label="Notification alerts"
                  sub="Price drops & matching listings"
                  onPress={() => setNotifModalVisible(true)}
                />
                <MenuRow
                  icon={HelpCircle}
                  label="FAQs & support"
                  sub="Visits, RERA & booking questions"
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

            <View style={{ alignItems: "center", gap: spacing.xs, paddingTop: spacing.sm }}>
              <Pressable
                onPress={handleLogout}
                accessibilityRole="button"
                hitSlop={8}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs + 2,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  backgroundColor: pressed ? colors.dangerSoft : "transparent",
                })}
              >
                <LogOut size={16} color={colors.danger} />
                <Text style={{ ...type.label, fontWeight: "600", color: colors.danger }}>
                  Sign out
                </Text>
              </Pressable>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                SqftGo v{Constants.expoConfig?.version ?? "1.0.0"}
              </Text>
            </View>
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
          title="Edit Customer Profile"
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
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        >
          <View
            style={{
              backgroundColor: colors.surfaceSubtle,
              padding: spacing.md,
              borderRadius: radius.md,
              gap: spacing.xs,
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.ink }}>
              How do I book a free site visit?
            </Text>
            <Text style={{ ...type.body, color: colors.inkSecondary }}>
              Open any Active listing on Explore, tap &ldquo;Schedule Site Visit&rdquo;, choose your preferred
              date and time slot. The listing dealer will confirm the appointment.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surfaceSubtle,
              padding: spacing.md,
              borderRadius: radius.md,
              gap: spacing.xs,
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.ink }}>
              Are all properties RERA compliant?
            </Text>
            <Text style={{ ...type.body, color: colors.inkSecondary }}>
              Listings marked with the &ldquo;RERA Approved&rdquo; badge have verified registration numbers. You
              can also verify title deeds with our certified property consultants in Directory.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surfaceSubtle,
              padding: spacing.md,
              borderRadius: radius.md,
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
                "Contact Customer Support",
                "Email: support@sqftgo.com\nHelpline: +91 80000 12345 (Mon-Sat, 9am-7pm IST)",
              );
            }}
            style={({ pressed }) => ({
              height: 48,
              borderRadius: radius.md,
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
