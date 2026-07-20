import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  Dimensions,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Search, Check, MapPin } from "lucide-react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from "react-native-svg";
import { BlurView } from "expo-blur";
import { CITIES, City } from "../../constants/cities";
import { useApp } from "../../context/AppContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CitySelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

const CardGradient = () => (
  <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
    <Defs>
      <SvgLinearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="30%" stopColor="transparent" stopOpacity="0" />
        <Stop offset="75%" stopColor="#000000" stopOpacity="0.5" />
        <Stop offset="100%" stopColor="#000000" stopOpacity="0.9" />
      </SvgLinearGradient>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#cardGrad)" />
  </Svg>
);

export default function CitySelectionModal({ visible, onClose }: CitySelectionModalProps) {
  const { selectedCity, setSelectedCity } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCities = CITIES.filter((city) =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCity = (city: City) => {
    setSelectedCity(city.name);
    // Standard close after a brief delay for visual confirmation of selection
    setTimeout(() => {
      onClose();
      setSearchQuery("");
    }, 150);
  };

  const containerMargin = 10;
  const spacing = 12;
  const padding = 16;
  const cardSize = (SCREEN_WIDTH - containerMargin * 2 - padding * 2 - spacing) / 2;

  const renderCityCard = ({ item }: { item: City }) => {
    const isSelected = selectedCity.toLowerCase() === item.name.toLowerCase();

    return (
      <Pressable
        onPress={() => handleSelectCity(item)}
        style={({ pressed }) => [
          styles.card,
          { width: cardSize, height: cardSize },
          isSelected && styles.cardActive,
          pressed && styles.cardPressed,
        ]}
      >
        {/* City Image */}
        <Image source={{ uri: item.image }} style={styles.cardImage} />

        {/* Premium Dark Gradient Overlay */}
        <CardGradient />

        {/* Centered City Name */}
        <View style={styles.textContainer}>
          <Text style={styles.cityName}>{item.name}</Text>
        </View>

        {/* Selected Check Badge */}
        {isSelected && (
          <View style={styles.checkBadge}>
            <Check size={10} color="#FFFFFF" strokeWidth={3} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={70} style={StyleSheet.absoluteFill} tint="dark">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalContent}
        >
          <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <View style={styles.container}>
              {/* Header section */}
              <View style={styles.header}>
                <View style={styles.headerTitleBox}>
                  <Text style={styles.headerTitle}>Select City</Text>
                  <Text style={styles.headerSubtitle}>
                    Choose your preferred location to explore premium properties
                  </Text>
                </View>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color="#E5E7EB" />
                </Pressable>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Search size={16} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search cities..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
                {searchQuery !== "" && (
                  <Pressable onPress={() => setSearchQuery("")} style={styles.clearBtn}>
                    <X size={14} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>

              {/* Grid of Cities */}
              {filteredCities.length > 0 ? (
                <FlatList
                  data={filteredCities}
                  renderItem={renderCityCard}
                  keyExtractor={(item) => item.name}
                  numColumns={2}
                  contentContainerStyle={styles.gridContainer}
                  columnWrapperStyle={styles.columnWrapper}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <MapPin size={48} color="#9CA3AF" style={styles.emptyIcon} />
                  <Text style={styles.emptyText}>No matching cities found</Text>
                  <Text style={styles.emptySubtext}>Try searching for a different name</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(15, 30, 54, 0.95)", // Glassmorphic deep slate blue background
    marginHorizontal: 10,
    marginTop: Platform.OS === "ios" ? 10 : 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: Platform.OS === "ios" ? 32 : 0,
    borderBottomRightRadius: Platform.OS === "ios" ? 32 : 0,
    overflow: "hidden",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingTop: 8,
  },
  headerTitleBox: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 16,
    fontWeight: "500",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    height: "100%",
  },
  clearBtn: {
    padding: 4,
  },
  gridContainer: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardActive: {
    borderColor: "#E05A36", // Theme Orange Border
    shadowColor: "#E05A36",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardPressed: {
    transform: [{ scale: 0.95 }],
  },
  cardImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  textContainer: {
    position: "absolute",
    bottom: 12,
    left: 8,
    right: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cityName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#E05A36",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptySubtext: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
  },
});
