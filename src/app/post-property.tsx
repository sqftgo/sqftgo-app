import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Switch
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { Property } from "@/data/types";
import { CITIES as CITIES_LIST } from "@/constants/cities";
import { pickAndUploadPropertyImage } from "@/lib/media-upload";
import { ChevronLeft, ChevronDown, ChevronUp, Check } from "lucide-react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const CITIES = CITIES_LIST.map((c) => c.name);
const PROPERTY_TYPES: Property["type"][] = [
  "Villa", 
  "Apartment", 
  "Home", 
  "Industrial Plot", 
  "Commercial Space", 
  "Office Space", 
  "Shop", 
  "Hotel", 
  "Agricultural Land"
];
const FURNISHING_OPTIONS: Property["furnished"][] = ["Furnished", "Semi-Furnished", "Unfurnished"];

const AMENITIES_LIST = [
  "Swimming Pool",
  "Gymnasium",
  "Power Backup",
  "Club House",
  "Elevator Lift",
  "Security Guard",
  "Reserved Parking",
  "Kids Playground"
];

// Reusable Custom Dropdown Component
interface DropdownSelectProps {
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (opt: string) => void;
}

const DropdownSelect: React.FC<DropdownSelectProps> = ({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect
}) => {
  return (
    <View style={styles.dropdownGroup}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onToggle} style={[styles.dropdownHeader, isOpen && styles.dropdownHeaderActive]}>
        <Text style={styles.dropdownValue}>{value}</Text>
        {isOpen ? (
          <ChevronUp size={16} color="#6B7280" />
        ) : (
          <ChevronDown size={16} color="#6B7280" />
        )}
      </Pressable>
      
      {isOpen && (
        <Animated.View 
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.dropdownList}
        >
          <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
            {options.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => onSelect(opt)}
                style={[styles.dropdownItem, value === opt && styles.dropdownItemActive]}
              >
                <Text style={[styles.dropdownItemText, value === opt && styles.dropdownItemTextActive]}>
                  {opt}
                </Text>
                {value === opt && <Check size={14} color="#E05A36" />}
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

export default function PostPropertyScreen() {
  const router = useRouter();
  const { addProperty, selectedCity, canAccessDealerDashboard } = useApp();
  const isBroker = canAccessDealerDashboard;

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<"city" | "type" | "furnished" | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<Property["type"]>("Apartment");
  const [purpose, setPurpose] = useState<Property["purpose"]>("buy");
  const [bhk, setBhk] = useState("");
  const [city, setCity] = useState(selectedCity);
  const [locality, setLocality] = useState("");
  const [size, setSize] = useState("");
  const [furnished, setFurnished] = useState<Property["furnished"]>("Semi-Furnished");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Advanced Price Breakdown states
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [registrationFees, setRegistrationFees] = useState("");

  // RERA states
  const [isReraApproved, setIsReraApproved] = useState(true);
  const [reraId, setReraId] = useState("");

  // Amenities states
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const handleToggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(item => item !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleToggleDropdown = (dropdown: "city" | "type" | "furnished") => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const buildPayload = () => {
    const priceNum = parseFloat(price);
    const sizeNum = parseFloat(size);
    const finalImage = imageUrl.trim() || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";

    const breakdown = {
      basePrice: priceNum,
      securityDeposit: securityDeposit ? parseFloat(securityDeposit) : undefined,
      maintenance: maintenance ? parseFloat(maintenance) : 0,
      registrationFees: registrationFees ? parseFloat(registrationFees) : undefined
    };

    return {
      title,
      price: priceNum,
      type,
      purpose,
      bhk: bhk ? parseInt(bhk) : undefined,
      city,
      locality,
      size: sizeNum,
      furnished,
      description,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : ["Power Backup", "Security", "Parking"],
      images: [finalImage],
      reraApproved: isReraApproved,
      reraId: isReraApproved ? (reraId.trim() || `RAJ/RERA/PR/${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
      priceBreakdown: breakdown
    };
  };

  const validate = () => {
    if (!title || !price || !locality || !size || !description) {
      Alert.alert("Error", "Please fill in all mandatory fields.");
      return false;
    }
    if (isNaN(parseFloat(price)) || isNaN(parseFloat(size))) {
      Alert.alert("Error", "Price and size must be valid numeric values.");
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
    setUploadingImage(true);
    const url = await pickAndUploadPropertyImage();
    setUploadingImage(false);
    if (url) setImageUrl(url);
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    if (!isBroker) {
      Alert.alert("Dealer access required", "Only approved brokers can create listings.");
      return;
    }
    const created = await addProperty({ ...buildPayload(), status: "Draft" });
    if (!created) {
      Alert.alert("Could not save", "Dealer dashboard access is required.");
      return;
    }
    Alert.alert("Draft saved", "Open this draft later from your dashboard and submit when ready.", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  const handleSubmitForReview = async () => {
    if (!validate()) return;
    if (!isBroker) {
      Alert.alert("Dealer access required", "Only approved brokers can create listings.");
      return;
    }
    const created = await addProperty({ ...buildPayload(), status: "Pending Review" });
    if (!created) {
      Alert.alert("Could not submit", "Dealer dashboard access is required.");
      return;
    }
    Alert.alert(
      "Submitted for review",
      "Your listing is pending web admin approval. It will appear to buyers once Active.",
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#0F1E36" />
        </Pressable>
        <Text style={styles.headerTitle}>{isBroker ? "Add Property" : "Post Property"}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section 1: Basic Info */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          
          <Text style={styles.label}>Listing Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Modern 3 BHK Penthouse"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />

          <Text style={styles.label}>Base Price (INR) *</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 7500000 (75 Lakhs) or 25000 for rent"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Purpose</Text>
          <View style={styles.selectorRow}>
            {(["buy", "rent"] as const).map((p) => {
              const active = purpose === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setPurpose(p)}
                  style={[styles.selectorBtn, active && styles.selectorBtnActive]}
                >
                  <Text style={[styles.selectorText, active && styles.selectorTextActive]}>
                    For {p.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 2: Location & Specifications */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Location & Specifications</Text>

          {/* Custom Dropdown for City */}
          <DropdownSelect
            label="Select City"
            value={city}
            options={CITIES}
            isOpen={activeDropdown === "city"}
            onToggle={() => handleToggleDropdown("city")}
            onSelect={(opt) => {
              setCity(opt);
              setActiveDropdown(null);
            }}
          />

          <Text style={styles.label}>Locality / Area *</Text>
          <TextInput
            value={locality}
            onChangeText={setLocality}
            placeholder="e.g. C-Scheme or Panchwati"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />

          {/* Custom Dropdown for Property Type */}
          <DropdownSelect
            label="Property Type"
            value={type}
            options={PROPERTY_TYPES}
            isOpen={activeDropdown === "type"}
            onToggle={() => handleToggleDropdown("type")}
            onSelect={(opt) => {
              setType(opt as Property["type"]);
              setActiveDropdown(null);
            }}
          />

          <Text style={styles.label}>Total Area Size (sq.ft.) *</Text>
          <TextInput
            value={size}
            onChangeText={setSize}
            placeholder="e.g. 1800"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            style={styles.input}
          />

          {type !== "Industrial Plot" && (
            <>
              <Text style={styles.label}>BHK Configuration</Text>
              <TextInput
                value={bhk}
                onChangeText={setBhk}
                placeholder="e.g. 3 (leave empty for plots)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                style={styles.input}
              />
            </>
          )}

          {/* Custom Dropdown for Furnishing Status */}
          <DropdownSelect
            label="Furnishing Status"
            value={furnished}
            options={FURNISHING_OPTIONS}
            isOpen={activeDropdown === "furnished"}
            onToggle={() => handleToggleDropdown("furnished")}
            onSelect={(opt) => {
              setFurnished(opt as Property["furnished"]);
              setActiveDropdown(null);
            }}
          />
        </View>

        {/* Section 3: Advanced Pricing Breakdown */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Advanced Pricing Breakdown</Text>

          <Text style={styles.label}>Security Deposit (Optional)</Text>
          <TextInput
            value={securityDeposit}
            onChangeText={setSecurityDeposit}
            placeholder="e.g. 50000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Monthly Maintenance (Optional)</Text>
          <TextInput
            value={maintenance}
            onChangeText={setMaintenance}
            placeholder="e.g. 2500"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Registration & Stamp Duty (Optional)</Text>
          <TextInput
            value={registrationFees}
            onChangeText={setRegistrationFees}
            placeholder="e.g. 150000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        {/* Section 4: Amenities Checklist */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {AMENITIES_LIST.map((item) => {
              const active = selectedAmenities.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => handleToggleAmenity(item)}
                  style={[styles.amenityItem, active && styles.amenityItemActive]}
                >
                  <Text style={[styles.amenityText, active && styles.amenityTextActive]}>
                    {item}
                  </Text>
                  {active && <Check size={12} color="#FFFFFF" />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 5: RERA Status Onboarding */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>RERA Certification</Text>
          
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Is RERA Approved?</Text>
              <Text style={styles.toggleDesc}>Increases visibility and listing trust score</Text>
            </View>
            <Switch
              value={isReraApproved}
              onValueChange={setIsReraApproved}
              trackColor={{ false: "#D1D5DB", true: "#E05A36" }}
            />
          </View>

          {isReraApproved && (
            <View style={styles.reraInputBox}>
              <Text style={styles.label}>RERA Registration ID</Text>
              <TextInput
                value={reraId}
                onChangeText={setReraId}
                placeholder="e.g. RAJ/RERA/PR/2026/8940"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>
          )}
        </View>

        {/* Section 6: Details & Media */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Details & Media</Text>

          <Text style={styles.label}>Description *</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Detailed description of the property features, landmarks..."
            placeholderTextColor="#9CA3AF"
            multiline
            style={[styles.input, styles.textArea]}
          />

          <Text style={styles.label}>Property image</Text>
          <TextInput
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="Paste URL or upload from gallery"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
          <Pressable
            onPress={() => void handlePickImage()}
            disabled={uploadingImage}
            style={[styles.draftBtn, { marginTop: 8, alignSelf: "flex-start", paddingHorizontal: 14 }]}
          >
            <Text style={styles.draftBtnText}>
              {uploadingImage ? "Uploading…" : "Upload from gallery"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.submitRow}>
          {isBroker ? (
            <>
              <Pressable onPress={handleSaveDraft} style={styles.draftBtn}>
                <Text style={styles.draftBtnText}>Save draft</Text>
              </Pressable>
              <Pressable onPress={handleSubmitForReview} style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>Submit for review</Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={handleSubmitForReview} style={[styles.submitBtn, { flex: 1 }]}>
              <Text style={styles.submitBtnText}>Submit for review</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9F6", // Unified off-white cream background
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#EAE9E4",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF9F6",
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F1E36", // Slate Blue
  },
  placeholder: {
    width: 36,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F1E36",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "600",
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingVertical: 10,
  },
  selectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectorBtnActive: {
    backgroundColor: "#0F1E36", // Slate Blue for active selector
    borderColor: "#0F1E36",
  },
  selectorText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#6B7280",
  },
  selectorTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  dropdownGroup: {
    marginBottom: 16,
    gap: 8,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 44,
  },
  dropdownHeaderActive: {
    borderColor: "#0F1E36",
  },
  dropdownValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  dropdownList: {
    marginTop: 4,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxHeight: 180,
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  },
  dropdownScroll: {
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemActive: {
    backgroundColor: "#FAF9F6",
  },
  dropdownItemText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#4B5563",
  },
  dropdownItemTextActive: {
    color: "#E05A36",
    fontWeight: "700",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  amenityItemActive: {
    backgroundColor: "#0F1E36",
    borderColor: "#0F1E36",
  },
  amenityText: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "700",
  },
  amenityTextActive: {
    color: "#FFFFFF",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F1E36",
  },
  toggleDesc: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    marginTop: 1,
  },
  reraInputBox: {
    marginTop: 6,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: "#E05A36", // Primary Warm Orange
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#E05A36",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  submitRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  draftBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  draftBtnText: {
    color: "#0F1E36",
    fontWeight: "800",
    fontSize: 14,
  },
});
