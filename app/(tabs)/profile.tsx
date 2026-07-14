import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Switch,
  TextInput,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import {
  Award,
  Shield,
  UserCheck,
  ChevronRight,
  Settings,
  Briefcase,
  Activity,
  Mail,
  User,
  Lock,
  Globe,
  Database,
  Bell,
  Headphones,
  LogOut,
  Eye,
  EyeOff,
  X,
  Check,
  Smartphone,
  CreditCard,
  Trash2,
  LockKeyhole,
} from "lucide-react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { 
    isLoggedIn, 
    setIsLoggedIn, 
    userEmail, 
    setUserEmail, 
    userRole, 
    setUserRole,
    favorites,
    properties
  } = useApp();

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [roleSelection, setRoleSelection] = useState<"user" | "broker" | "admin">("broker");
  const [showPassword, setShowPassword] = useState(false);
  
  // Custom switch toggles for notification mockups
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  // Settings Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English (US)");
  const [selectedCurrency, setSelectedCurrency] = useState("INR (₹)");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const handleLogin = () => {
    if (!emailInput) {
      Alert.alert("Error", "Please enter an email address.");
      return;
    }
    setIsLoggedIn(true);
    setUserEmail(emailInput);
    setUserRole(roleSelection);
    Alert.alert("Welcome Back", `Successfully signed in as ${roleSelection.toUpperCase()}`);
  };

  const handleDemoSignIn = (role: "user" | "broker" | "admin") => {
    const demoEmails = {
      broker: "broker@svrepl.com",
      user: "dipesh@gmail.com",
      admin: "admin@svrepl.com"
    };
    setIsLoggedIn(true);
    setUserEmail(demoEmails[role]);
    setUserRole(role);
    Alert.alert("Demo Signed In", `Logged in as ${role.toUpperCase()}`);
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: () => {
            setIsLoggedIn(false);
            setUserEmail("");
            setUserRole(null);
            setEmailInput("");
            setPasswordInput("");
            setShowSettingsModal(false);
          } 
        }
      ]
    );
  };

  const getRoleDisplayName = () => {
    if (userRole === "broker") return "Verified Broker";
    if (userRole === "admin") return "Administrator";
    return "Home Seeker";
  };

  const getRoleSubName = () => {
    if (userRole === "broker") return "Lake City Brokerage";
    if (userRole === "admin") return "SVR Realty HQ";
    return "Premium Home Seeker";
  };

  const getRoleBadgeStyle = () => {
    if (userRole === "broker") return styles.badgeBroker;
    if (userRole === "admin") return styles.badgeAdmin;
    return styles.badgeUser;
  };

  const getRoleBadgeTextStyle = () => {
    if (userRole === "broker") return styles.badgeTextBroker;
    if (userRole === "admin") return styles.badgeTextAdmin;
    return styles.badgeTextUser;
  };

  const getRoleIcon = () => {
    if (userRole === "broker") return <Award size={12} color="#045F46" />;
    if (userRole === "admin") return <Shield size={12} color="#991B1B" />;
    return <UserCheck size={12} color="#1E40AF" />;
  };

  // Count active broker listings dynamically
  const brokerListingsCount = properties.filter(p => p.ownerName === "App User" || p.id === "prop-1").length;

  const handleClearCachePress = () => {
    Alert.alert(
      "Optimize Storage",
      "Are you sure you want to clean local caches of high-resolution images?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Optimize Now", 
          onPress: () => Alert.alert("Success", "Cache cleared! Freed 24.8 MB of image storage.") 
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account Permanently ⚠️",
      "This action is irreversible. All listed properties, favorite history, and active inquiries will be permanently deleted from SVR Realty servers. Do you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () => {
            setIsLoggedIn(false);
            setUserEmail("");
            setUserRole(null);
            setEmailInput("");
            setPasswordInput("");
            setShowSettingsModal(false);
            Alert.alert("Account Deleted", "Your account metadata has been wiped successfully.");
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Account Profile</Text>
          <Pressable 
            onPress={() => setShowSettingsModal(true)} 
            style={styles.settingsBtn}
          >
            <Settings size={18} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Manage your credentials and property inventory</Text>
      </View>

      <View style={styles.curvedContentWrapper}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContainer}
        >
        {isLoggedIn ? (
          /* ────────────────────────────────────────────────────────
             ── LOGGED IN PROFESSIONAL PROFILE LAYOUT             ──
             ──────────────────────────────────────────────────────── */
          <View style={styles.profileContainer}>
            {/* Identity Card */}
            <View style={styles.identityCard}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" }}
                  style={styles.avatarImage}
                />
                <View style={styles.activeIndicator} />
              </View>
              <Text style={styles.userName}>Dipesh Vyas</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
              <Text style={styles.userCompany}>{getRoleSubName()}</Text>

              <View style={[styles.roleBadgeContainer, getRoleBadgeStyle()]}>
                {getRoleIcon()}
                <Text style={[styles.roleBadgeText, getRoleBadgeTextStyle()]}>
                  {getRoleDisplayName()}
                </Text>
              </View>
            </View>

            {/* Dynamic Stats Row */}
            <View style={styles.statsContainer}>
              {userRole === "broker" && (
                <>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{brokerListingsCount}</Text>
                    <Text style={styles.statLabel}>Listings</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>18</Text>
                    <Text style={styles.statLabel}>Inquiries</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>4.8 ★</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                </>
              )}
              {userRole === "user" && (
                <>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{favorites.length}</Text>
                    <Text style={styles.statLabel}>Saved</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>2</Text>
                    <Text style={styles.statLabel}>Inquiries</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>3</Text>
                    <Text style={styles.statLabel}>Connected</Text>
                  </View>
                </>
              )}
              {userRole === "admin" && (
                <>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>5</Text>
                    <Text style={styles.statLabel}>Brokers</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{properties.length}</Text>
                    <Text style={styles.statLabel}>Listings</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>37</Text>
                    <Text style={styles.statLabel}>Inquiries</Text>
                  </View>
                </>
              )}
            </View>

            {/* Menu Sections */}
            
            {/* Section 1: Broker Actions (Broker / Admin only) */}
            {(userRole === "broker" || userRole === "admin") && (
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Brokerage Operations</Text>
                
                <Pressable
                  onPress={() => router.push("/post-property")}
                  style={styles.menuItem}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIconContainer, { backgroundColor: "rgba(224, 90, 54, 0.08)" }]}>
                      <Briefcase size={16} color="#E05A36" />
                    </View>
                    <Text style={styles.menuItemLabel}>Post a New Property</Text>
                  </View>
                  <ChevronRight size={16} color="#9CA3AF" />
                </Pressable>

                <Pressable
                  onPress={() => Alert.alert("Listing Inventory", `You have ${brokerListingsCount} active properties listed on SVR Realty.`)}
                  style={styles.menuItem}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIconContainer, { backgroundColor: "rgba(0, 91, 150, 0.08)" }]}>
                      <Activity size={16} color="#005B96" />
                    </View>
                    <Text style={styles.menuItemLabel}>My Properties Inventory</Text>
                  </View>
                  <ChevronRight size={16} color="#9CA3AF" />
                </Pressable>

                <Pressable
                  onPress={() => Alert.alert("Client Inquiries", "Showcase: Rajesh Mehta requested callback Conversion papers for Aravali Ridge.")}
                  style={styles.menuItem}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIconContainer, { backgroundColor: "rgba(16, 185, 129, 0.08)" }]}>
                      <Mail size={16} color="#10B981" />
                    </View>
                    <Text style={styles.menuItemLabel}>Active Client Inquiries</Text>
                  </View>
                  <ChevronRight size={16} color="#9CA3AF" />
                </Pressable>
              </View>
            )}

            {/* Section 2: Account Preferences */}
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Personal Prefs & Storage</Text>
              
              <Pressable
                onPress={() => Alert.alert("Personal Details", "Name: Dipesh Vyas\nPhone: +91 98765 00000\nAddress: Shobhagpura Circle, Udaipur")}
                style={styles.menuItem}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: "rgba(124, 58, 237, 0.08)" }]}>
                    <User size={16} color="#7C3AED" />
                  </View>
                  <Text style={styles.menuItemLabel}>Personal Details</Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </Pressable>

              <Pressable
                onPress={() => setShowSettingsModal(true)}
                style={styles.menuItem}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: "rgba(217, 119, 6, 0.08)" }]}>
                    <Settings size={16} color="#D97706" />
                  </View>
                  <Text style={styles.menuItemLabel}>App Customization Settings</Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </Pressable>

              <Pressable
                onPress={handleClearCachePress}
                style={styles.menuItem}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: "rgba(71, 85, 105, 0.08)" }]}>
                    <Database size={16} color="#475569" />
                  </View>
                  <Text style={styles.menuItemLabel}>Clear Cache Storage</Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </Pressable>

              {/* Toggle Row: Push notifications */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleRowLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: "rgba(15, 30, 54, 0.05)" }]}>
                    <Bell size={16} color="#0F1E36" />
                  </View>
                  <View>
                    <Text style={styles.toggleRowLabel}>Push Alerts</Text>
                    <Text style={styles.toggleRowSub}>Instant listings alerts</Text>
                  </View>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: "#EAE9E4", true: "#E05A36" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Toggle Row: Email updates */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleRowLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: "rgba(15, 30, 54, 0.05)" }]}>
                    <Mail size={16} color="#0F1E36" />
                  </View>
                  <View>
                    <Text style={styles.toggleRowLabel}>Weekly Digest</Text>
                    <Text style={styles.toggleRowSub}>Weekly market valuation</Text>
                  </View>
                </View>
                <Switch
                  value={emailEnabled}
                  onValueChange={setEmailEnabled}
                  trackColor={{ false: "#EAE9E4", true: "#E05A36" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Section 3: Help and Support */}
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Support & Logout</Text>
              
              <Pressable
                onPress={() => Alert.alert("Support Help Desk", "Connecting to SVR Helpline at support@svrepl.com")}
                style={styles.menuItem}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: "rgba(75, 85, 99, 0.08)" }]}>
                    <Headphones size={16} color="#4B5563" />
                  </View>
                  <Text style={styles.menuItemLabel}>Help Center & Support</Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </Pressable>

              <Pressable
                onPress={handleLogout}
                style={styles.menuItem}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: "#FEE2E2" }]}>
                    <LogOut size={16} color="#DC2626" />
                  </View>
                  <Text style={[styles.menuItemLabel, styles.logoutLabel]}>Log Out Account</Text>
                </View>
                <ChevronRight size={16} color="#FEE2E2" />
              </Pressable>
            </View>
          </View>
        ) : (
          /* ────────────────────────────────────────────────────────
             ── LOGGED OUT FORM (SLEEK SIGN IN PORTAL)            ──
             ──────────────────────────────────────────────────────── */
          <View style={styles.loginFormContainer}>
            <View style={styles.loginCard}>
              <View style={styles.loginHeader}>
                <View style={styles.loginIconBg}>
                  <Shield size={28} color="#E05A36" />
                </View>
                <Text style={styles.loginTitle}>Welcome Back</Text>
                <Text style={styles.loginSubtitle}>Access your SVR property brokerage suite</Text>
              </View>

              {/* Inputs */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputFieldBox}>
                  <Mail size={16} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    value={emailInput}
                    onChangeText={setEmailInput}
                    placeholder="broker@svrepl.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.inputField}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputFieldBox}>
                  <Lock size={16} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    value={passwordInput}
                    onChangeText={setPasswordInput}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    style={styles.inputField}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword ? (
                      <EyeOff size={16} color="#6B7280" />
                    ) : (
                      <Eye size={16} color="#6B7280" />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Role Select */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Type</Text>
                <View style={styles.roleContainer}>
                  {(["user", "broker", "admin"] as const).map((role) => {
                    const active = roleSelection === role;
                    return (
                      <Pressable
                        key={role}
                        onPress={() => setRoleSelection(role)}
                        style={[
                          styles.roleButton,
                          active && styles.roleButtonActive
                        ]}
                      >
                        <Text style={[
                          styles.roleButtonText,
                          active && styles.roleButtonTextActive
                        ]}>
                          {role.toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Submit */}
              <Pressable onPress={handleLogin} style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>Sign In</Text>
              </Pressable>
            </View>

            {/* Quick Demo Sign In Section */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Quick Access Testing</Text>
              <View style={styles.demoButtonsContainer}>
                <Pressable
                  onPress={() => handleDemoSignIn("broker")}
                  style={[styles.demoBtn, { borderColor: "#E05A36" }]}
                >
                  <Text style={[styles.demoBtnText, { color: "#E05A36" }]}>Broker Demo</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDemoSignIn("user")}
                  style={[styles.demoBtn, { borderColor: "#005B96" }]}
                >
                  <Text style={[styles.demoBtnText, { color: "#005B96" }]}>User Demo</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDemoSignIn("admin")}
                  style={[styles.demoBtn, { borderColor: "#475569" }]}
                >
                  <Text style={[styles.demoBtnText, { color: "#475569" }]}>Admin Demo</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        </ScrollView>
      </View>

      {/* ────────────────────────────────────────────────────────
         ── INTERACTIVE SETTINGS MODAL SHEET                   ──
         ──────────────────────────────────────────────────────── */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Settings size={20} color="#0F1E36" />
                <Text style={styles.modalTitle}>System Settings</Text>
              </View>
              <Pressable onPress={() => setShowSettingsModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#0F1E36" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScroll}>
              
              {/* Profile Overview (Mini) */}
              {isLoggedIn && (
                <View style={styles.settingsMiniProfile}>
                  <Image
                    source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=150&q=80" }}
                    style={styles.miniProfileAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniProfileName}>Dipesh Vyas</Text>
                    <Text style={styles.miniProfileRole}>{getRoleDisplayName()}</Text>
                  </View>
                </View>
              )}

              {/* 1. Account Security Category */}
              <Text style={styles.settingCategoryTitle}>Security & Credentials</Text>
              
              <View style={styles.settingToggleRow}>
                <View style={styles.settingToggleLeft}>
                  <View style={styles.settingIconBox}>
                    <LockKeyhole size={16} color="#0F1E36" />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Biometric Access</Text>
                    <Text style={styles.settingDesc}>Use FaceID / Fingerprint to log in</Text>
                  </View>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabled}
                  trackColor={{ false: "#EAE9E4", true: "#E05A36" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <Pressable 
                onPress={() => Alert.alert("Password Recovery", "Security key email sent to recovery address.")}
                style={styles.settingClickRow}
              >
                <View style={styles.settingToggleLeft}>
                  <View style={styles.settingIconBox}>
                    <Lock size={16} color="#0F1E36" />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Change Password</Text>
                    <Text style={styles.settingDesc}>Modify secret login password</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </Pressable>

              {/* 2. Personalization Category */}
              <Text style={styles.settingCategoryTitle}>Regional & Preferences</Text>

              {/* Language Selector Dropdown */}
              <View style={styles.dropdownSettingWrapper}>
                <Pressable 
                  onPress={() => {
                    setShowLanguageDropdown(!showLanguageDropdown);
                    setShowCurrencyDropdown(false);
                  }}
                  style={styles.settingClickRow}
                >
                  <View style={styles.settingToggleLeft}>
                    <View style={styles.settingIconBox}>
                      <Globe size={16} color="#0F1E36" />
                    </View>
                    <View>
                      <Text style={styles.settingLabel}>App Language</Text>
                      <Text style={styles.settingDesc}>Active: {selectedLanguage}</Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#9CA3AF" style={{ transform: [{ rotate: showLanguageDropdown ? "90deg" : "0deg" }] }} />
                </Pressable>
                {showLanguageDropdown && (
                  <View style={styles.settingsSelectDropdown}>
                    {["English (US)", "Hindi (हिन्दी)", "Gujarati (ગુજરાતી)"].map((lang) => (
                      <Pressable 
                        key={lang}
                        onPress={() => {
                          setSelectedLanguage(lang);
                          setShowLanguageDropdown(false);
                          Alert.alert("Success", `Language switched to ${lang}`);
                        }}
                        style={[styles.selectDropdownOption, selectedLanguage === lang && styles.selectDropdownOptionActive]}
                      >
                        <Text style={[styles.selectDropdownOptionText, selectedLanguage === lang && styles.selectDropdownOptionTextActive]}>
                          {lang}
                        </Text>
                        {selectedLanguage === lang && <Check size={14} color="#E05A36" />}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Currency Selector Dropdown */}
              <View style={styles.dropdownSettingWrapper}>
                <Pressable 
                  onPress={() => {
                    setShowCurrencyDropdown(!showCurrencyDropdown);
                    setShowLanguageDropdown(false);
                  }}
                  style={styles.settingClickRow}
                >
                  <View style={styles.settingToggleLeft}>
                    <View style={styles.settingIconBox}>
                      <CreditCard size={16} color="#0F1E36" />
                    </View>
                    <View>
                      <Text style={styles.settingLabel}>Valuation Currency</Text>
                      <Text style={styles.settingDesc}>Active: {selectedCurrency}</Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#9CA3AF" style={{ transform: [{ rotate: showCurrencyDropdown ? "90deg" : "0deg" }] }} />
                </Pressable>
                {showCurrencyDropdown && (
                  <View style={styles.settingsSelectDropdown}>
                    {["INR (₹)", "USD ($)", "EUR (€)"].map((cur) => (
                      <Pressable 
                        key={cur}
                        onPress={() => {
                          setSelectedCurrency(cur);
                          setShowCurrencyDropdown(false);
                          Alert.alert("Success", `Pricing evaluations currency set to ${cur}`);
                        }}
                        style={[styles.selectDropdownOption, selectedCurrency === cur && styles.selectDropdownOptionActive]}
                      >
                        <Text style={[styles.selectDropdownOptionText, selectedCurrency === cur && styles.selectDropdownOptionTextActive]}>
                          {cur}
                        </Text>
                        {selectedCurrency === cur && <Check size={14} color="#E05A36" />}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.settingToggleRow}>
                <View style={styles.settingToggleLeft}>
                  <View style={styles.settingIconBox}>
                    <Smartphone size={16} color="#0F1E36" />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Dark Mode Theme</Text>
                    <Text style={styles.settingDesc}>Use low-light visual contrast scheme</Text>
                  </View>
                </View>
                <Switch
                  value={darkModeEnabled}
                  onValueChange={setDarkModeEnabled}
                  trackColor={{ false: "#EAE9E4", true: "#0F1E36" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* 3. System Actions Category */}
              <Text style={styles.settingCategoryTitle}>System Optimization & Privacy</Text>

              <Pressable 
                onPress={handleClearCachePress}
                style={styles.settingClickRow}
              >
                <View style={styles.settingToggleLeft}>
                  <View style={styles.settingIconBox}>
                    <Database size={16} color="#0F1E36" />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Optimize Image Storage</Text>
                    <Text style={styles.settingDesc}>Clear local thumbnails (Free 24.8 MB)</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </Pressable>

              <Pressable 
                onPress={() => Alert.alert("Privacy Policy", "SVR Real Estate is RERA certified. We do not sell your personal call metadata or brokerage conversion histories to 3rd party advertising grids.")}
                style={styles.settingClickRow}
              >
                <View style={styles.settingToggleLeft}>
                  <View style={styles.settingIconBox}>
                    <Shield size={16} color="#0F1E36" />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Privacy Policy</Text>
                    <Text style={styles.settingDesc}>Review user data portability rules</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </Pressable>

              {isLoggedIn && (
                <Pressable 
                  onPress={handleDeleteAccount}
                  style={styles.settingClickRow}
                >
                  <View style={styles.settingToggleLeft}>
                    <View style={[styles.settingIconBox, { backgroundColor: "#FEE2E2" }]}>
                      <Trash2 size={16} color="#DC2626" />
                    </View>
                    <View>
                      <Text style={[styles.settingLabel, { color: "#DC2626" }]}>Delete SVR Account</Text>
                      <Text style={styles.settingDesc}>Permanently erase listings and history</Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#FEE2E2" />
                </Pressable>
              )}

              {/* Build Info */}
              <View style={styles.settingsFooterBuildInfo}>
                <Text style={styles.buildInfoText}>SVR Realty • Version 1.0.4 (Build 8234)</Text>
                <Text style={styles.buildInfoSub}>RERA Rajasthan Compliance Approved</Text>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 25,
    backgroundColor: "#0F1E36",
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.72)",
    marginTop: 4,
    fontWeight: "500",
  },
  curvedContentWrapper: {
    flex: 1,
    backgroundColor: "#FAF9F6", 
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -12,
    paddingTop: 10,
  },
  scrollContainer: {
    paddingBottom: 90, 
  },
  profileContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  
  // Identity Card
  identityCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "#E05A36",
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F1E36",
  },
  userEmail: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 2,
  },
  userCompany: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    marginTop: 1,
  },
  roleBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 12,
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  badgeBroker: {
    backgroundColor: "#D1FAE5",
  },
  badgeTextBroker: {
    color: "#045F46",
  },
  badgeAdmin: {
    backgroundColor: "#FEE2E2",
  },
  badgeTextAdmin: {
    color: "#991B1B",
  },
  badgeUser: {
    backgroundColor: "#DBEAFE",
  },
  badgeTextUser: {
    color: "#1E40AF",
  },

  // Dynamic Stats Row
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 14,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    justifyContent: "space-between",
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#EAE9E4",
  },
  statVal: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#0F1E36",
  },
  statLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "700",
    marginTop: 2,
  },

  // Menu Sections
  menuSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0F1E36",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#FAF9F6",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
  },
  logoutLabel: {
    color: "#DC2626",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FAF9F6",
  },
  toggleRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleRowLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
  },
  toggleRowSub: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    marginTop: 2,
  },

  // Logged out styles
  loginFormContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  loginHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  loginIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(224, 90, 54, 0.08)",
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F1E36",
  },
  loginSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#0F1E36",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputFieldBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF9F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 12.5,
    color: "#0F1E36",
    fontWeight: "600",
  },
  eyeBtn: {
    padding: 4,
  },
  roleContainer: {
    flexDirection: "row",
    backgroundColor: "#FAF9F6",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  roleButtonActive: {
    backgroundColor: "#0F1E36",
    shadowColor: "#0F1E36",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  roleButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
  },
  roleButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  submitBtn: {
    backgroundColor: "#E05A36",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#E05A36",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13.5,
  },
  demoSection: {
    marginTop: 20,
    alignItems: "center",
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  demoButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  demoBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: "800",
  },

  // ────────────────────────────────────────────────────────
  // ── SETTINGS INTERACTIVE MODAL                         ──
  // ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 30, 54, 0.6)", 
    justifyContent: "flex-end", 
  },
  settingsModalContent: {
    backgroundColor: "#FAF9F6", 
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "85%",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EAE9E4",
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F1E36",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15, 30, 54, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsScroll: {
    paddingBottom: 40,
  },
  settingsMiniProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    marginBottom: 15,
  },
  miniProfileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#E05A36",
  },
  miniProfileName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F1E36",
  },
  miniProfileRole: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 1,
  },
  settingCategoryTitle: {
    fontSize: 10.5,
    fontWeight: "900",
    color: "#0F1E36",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
    paddingLeft: 4,
  },
  settingToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    marginBottom: 8,
  },
  settingToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  settingIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(15, 30, 54, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#4B5563",
  },
  settingDesc: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    marginTop: 1,
  },
  settingClickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    marginBottom: 8,
  },
  
  // Select Dropdowns in Settings
  dropdownSettingWrapper: {
    marginBottom: 8,
  },
  settingsSelectDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    padding: 6,
    marginTop: -4,
    marginBottom: 8,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  selectDropdownOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  selectDropdownOptionActive: {
    backgroundColor: "rgba(224, 90, 54, 0.08)",
  },
  selectDropdownOptionText: {
    fontSize: 11.5,
    color: "#4B5563",
    fontWeight: "600",
  },
  selectDropdownOptionTextActive: {
    color: "#E05A36",
    fontWeight: "800",
  },
  settingsFooterBuildInfo: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    paddingVertical: 10,
  },
  buildInfoText: {
    fontSize: 10.5,
    color: "#9CA3AF",
    fontWeight: "700",
  },
  buildInfoSub: {
    fontSize: 8.5,
    color: "#9CA3AF",
    fontWeight: "600",
    marginTop: 2,
  },
});
