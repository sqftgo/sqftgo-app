import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Heart,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Share2,
  Shield,
  Sparkles,
  User,
} from "@/components/ui/icons";

import { MenuGroup, MenuRow } from "@/components/ui/menu-row";
import { useApp } from "@/context/AppContext";
import type { DirectoryCategory } from "@/data/types";
import { initialsFromName } from "@/lib/format";
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

export default function ProfileScreen() {
  const router = useRouter();
  const {
    signOut,
    userEmail,
    userName,
    favorites,
    userRole,
    inquiries,
    dealerAccess,
    canAccessDealerDashboard,
    profile,
    directoryProfiles,
    updateDirectoryProfile,
    updateProfile,
  } = useApp();

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

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  };

  const initials = initialsFromName(userName || userEmail);
  const roleLabel =
    userRole === "broker"
      ? "Dealer"
      : dealerAccess === "pending"
        ? "User · pending dealer"
        : "User";

  const myInquiries = inquiries.filter(
    (i) => i.buyerEmail.toLowerCase() === userEmail.toLowerCase(),
  ).length;
  const openLeads = inquiries.filter(
    (i) => i.brokerEmail === userEmail && (i.status === "new" || i.status === "read"),
  ).length;

  const savePersonal = () => {
    updateProfile({ name: displayName.trim(), phone: phone.trim() });
    Alert.alert("Saved", "Personal details updated.");
  };

  const saveBusiness = async () => {
    if (!myDirectory) {
      Alert.alert("No directory card", "Complete dealer registration first.");
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
      Alert.alert("Save failed", result.message ?? "Try again.");
      return;
    }
    Alert.alert("Saved", "Business details updated on your directory card.");
  };

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...type.body,
    color: colors.ink,
    marginBottom: spacing.md,
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
          gap: spacing.xl,
        }}
      >
        <Text style={{ ...type.title, color: colors.ink }}>
          {canAccessDealerDashboard ? "Dealer Profile" : "Profile"}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.xl,
            padding: spacing.lg,
            boxShadow: shadow.card,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radius.full,
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
            <Text style={{ ...type.micro, color: colors.accent }}>
              {canAccessDealerDashboard ? "Dealer Portal" : roleLabel}
            </Text>
          </View>
        </View>

        {dealerAccess === "pending" && userRole !== "broker" ? (
          <Pressable
            onPress={() => router.push("/dealer-pending" as Href)}
            style={{
              backgroundColor: "rgba(255, 184, 0, 0.12)",
              borderRadius: radius.lg,
              padding: spacing.md,
              gap: spacing.xs,
            }}
          >
            <Text style={{ ...type.emphasis, color: "#B45309" }}>Pending dealer access</Text>
            <Text style={{ ...type.caption, color: colors.inkMuted }}>
              Directory submitted. Dashboard unlocks after web admin sets role to broker.
            </Text>
          </Pressable>
        ) : null}

        {canAccessDealerDashboard ? (
          <>
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
                      borderRadius: radius.full,
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
                    borderRadius: radius.md,
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
                            borderRadius: radius.full,
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
                    <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}>
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
                              borderRadius: radius.full,
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
                        borderRadius: radius.md,
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
                  borderRadius: radius.lg,
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
                  borderRadius: radius.lg,
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
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...type.label, color: colors.inkMuted }}>ACCOUNT</Text>
            <MenuGroup>
              {userRole === "user" ? (
                <>
                  <MenuRow
                    icon={Heart}
                    label="Saved properties"
                    value={String(favorites.length)}
                    onPress={() => router.push("/(tabs)/favorites")}
                  />
                  <MenuRow
                    icon={MessageSquare}
                    label="My inquiries"
                    value={String(myInquiries)}
                    onPress={() => router.push("/(tabs)/my-inquiries" as Href)}
                  />
                  <MenuRow
                    icon={Calendar}
                    label="My visits"
                    onPress={() => router.push("/my-visits" as Href)}
                  />
                  {dealerAccess === "none" ? (
                    <MenuRow
                      icon={Briefcase}
                      label="Become a dealer"
                      sub="Register directory → wait for broker role"
                      onPress={() => router.push("/dealer-register" as Href)}
                      showDivider={false}
                    />
                  ) : dealerAccess === "pending" ? (
                    <MenuRow
                      icon={Shield}
                      label="Dealer KYC"
                      sub={
                        profile?.kyc
                          ? KYC_STATUS_LABEL[profile.kyc.status]
                          : "Optional while waiting"
                      }
                      onPress={() => router.push("/dealer-kyc" as Href)}
                      showDivider={false}
                    />
                  ) : null}
                </>
              ) : null}
              <MenuRow
                icon={Bell}
                label="Notifications"
                sub="Device preferences"
                onPress={() => router.push("/dealer-settings" as Href)}
                showDivider={false}
              />
            </MenuGroup>
          </View>
        )}

        <View style={{ gap: spacing.sm }}>
          <Text style={{ ...type.label, color: colors.inkMuted }}>HELP & SUPPORT</Text>
          <MenuGroup>
            <MenuRow
              icon={HelpCircle}
              label="Help center"
              onPress={() => Alert.alert("Help", "Visit support@sqftgo.com for assistance.")}
            />
            <MenuRow
              icon={FileText}
              label="Terms & privacy policy"
              onPress={() => Alert.alert("Legal", "Terms of service will open here.")}
              showDivider={false}
            />
          </MenuGroup>
        </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}
