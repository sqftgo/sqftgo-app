import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  Dimensions,
  TextInput,
} from "react-native";
import { Search, Check, MapPin, X } from "@/components/ui/icons";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from "react-native-svg";
import { CITIES, City } from "@/constants/cities";
import { useApp } from "@/context/AppContext";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import { colors, radius, spacing, type } from "@/theme/tokens";


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
    setTimeout(() => {
      onClose();
      setSearchQuery("");
    }, 150);
  };

  const cardGap = spacing.md;
  const paddingHorizontal = spacing.xl;
  const cardSize = (SCREEN_WIDTH - paddingHorizontal * 2 - cardGap) / 2;

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
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        <CardGradient />
        <View style={styles.textContainer}>
          <Text style={styles.cityName}>{item.name}</Text>
        </View>
        {isSelected && (
          <View style={styles.checkBadge}>
            <Check size={10} color="#FFFFFF" strokeWidth={3} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      avoidKeyboard
      maxHeight="85%"
    >
      <ModalSheetHeader
        title="Select City"
        subtitle="Choose your location to explore premium properties"
        onClose={onClose}
      />

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color={colors.inkMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cities..."
            placeholderTextColor={colors.inkMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery !== "" && (
            <Pressable onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <X size={14} color={colors.inkMuted} />
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
            <MapPin size={40} color={colors.inkMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No matching cities found</Text>
            <Text style={styles.emptySubtext}>Try searching for a different name</Text>
          </View>
        )}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    height: 46,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: "500",
    height: "100%",
  },
  clearBtn: {
    padding: spacing.xs,
  },
  gridContainer: {
    paddingBottom: spacing.xl,
  },
  columnWrapper: {
    justifyContent: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  textContainer: {
    position: "absolute",
    bottom: 10,
    left: 8,
    right: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cityName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.accent,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    marginBottom: spacing.md,
    opacity: 0.7,
  },
  emptyText: {
    ...type.emphasis,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...type.caption,
    color: colors.inkMuted,
    textAlign: "center",
  },
});
