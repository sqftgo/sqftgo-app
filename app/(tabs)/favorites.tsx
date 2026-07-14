import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { Heart, Star, MapPin, Calendar, Home, ArrowRight, ShieldCheck } from 'lucide-react-native';

export default function FavoritesScreen() {
  const router = useRouter();
  const { properties, favorites, toggleFavorite } = useApp();

  const favProperties = properties.filter((prop) => favorites.includes(prop.id));

  // Format currency
  const formatIndianCurrency = (num: number) => {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Crore`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)} Lakh`;
    }
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const handleRemovePress = (id: string, title: string) => {
    Alert.alert(
      "Remove Shortlist",
      `Are you sure you want to remove "${title}" from your shortlist?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => toggleFavorite(id) 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Shortlisted Properties</Text>
          <Text style={styles.subtitle}>Saved listings for quick comparison & access</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <Heart size={20} color="#FFFFFF" fill="rgba(255, 255, 255, 0.2)" />
        </View>
      </View>

      <View style={styles.curvedContentWrapper}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.listContainer}
        >
        {favProperties.length === 0 ? (
          // Restructured Empty State
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Heart size={44} color="#E05A36" fill="rgba(224, 90, 54, 0.15)" />
            </View>
            <Text style={styles.emptyText}>Your shortlist is empty</Text>
            <Text style={styles.emptySubtext}>
              Explore verified properties and tap the heart icon to save listings here.
            </Text>
            <Pressable 
              onPress={() => router.push("/explore" as any)}
              style={styles.emptyBtn}
            >
              <Text style={styles.emptyBtnText}>Explore Properties</Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          favProperties.map((prop) => (
            <Pressable
              key={prop.id}
              onPress={() => router.push({ pathname: "/property/[id]", params: { id: prop.id } } as any)}
              style={styles.listCard}
            >
              {/* Left Side: Property Image */}
              <View style={styles.cardImageContainer}>
                <Image source={{ uri: prop.images[0] }} style={styles.cardImage} />
                
                {/* RERA Badge Overlay if approved */}
                {prop.reraApproved && (
                  <View style={styles.reraBadge}>
                    <ShieldCheck size={9} color="#FFFFFF" fill="#34C759" />
                    <Text style={styles.reraBadgeText}>RERA</Text>
                  </View>
                )}
                
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{prop.type.toUpperCase()}</Text>
                </View>
              </View>

              {/* Right Side: Content Details */}
              <View style={styles.cardContent}>
                <View style={styles.priceRow}>
                  <Text style={styles.cardPrice}>
                    {formatIndianCurrency(prop.price)}
                    {prop.purpose === "rent" || prop.purpose === "lease" ? " / mo" : ""}
                  </Text>
                  
                  {/* Floating-style Fav button inside details */}
                  <Pressable 
                    onPress={() => handleRemovePress(prop.id, prop.title)} 
                    style={styles.cardFav}
                  >
                    <Heart size={14} color="#FF4D4D" fill="#FF4D4D" />
                  </Pressable>
                </View>

                <Text style={styles.cardTitle} numberOfLines={1}>
                  {prop.title}
                </Text>

                <View style={styles.locationRow}>
                  <MapPin size={11} color="#6B7280" />
                  <Text style={styles.cardLocation} numberOfLines={1}>
                    {prop.locality}, {prop.city}
                  </Text>
                </View>

                {/* Spec Icons Row */}
                <View style={styles.metaRow}>
                  {prop.bhk && (
                    <View style={styles.specItem}>
                      <Home size={10} color="#6B7280" />
                      <Text style={styles.metaText}>{prop.bhk} BHK</Text>
                    </View>
                  )}
                  <View style={styles.specItem}>
                    <Calendar size={10} color="#6B7280" />
                    <Text style={styles.metaText}>{prop.size} sqft</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Star size={10} color="#FFB800" fill="#FFB800" />
                    <Text style={styles.metaText}>4.8</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F1E36", // Slate Blue background for header alignment
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 25,
    backgroundColor: "#0F1E36",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  headerIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    marginTop: 2,
    fontWeight: "500",
  },
  curvedContentWrapper: {
    flex: 1,
    backgroundColor: "#FAF9F6", // Off-white cream background
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -12,
    paddingTop: 10,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 90, // Spacing for floating tab bar
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE9E4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#0F1E36",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
    fontWeight: "500",
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E05A36",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#E05A36",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    marginVertical: 8,
    flexDirection: "row", // Horizontal split
    height: 124,
    borderWidth: 1,
    borderColor: "#EAE9E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageContainer: {
    width: 124,
    height: "100%",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  reraBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(15, 30, 54, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  reraBadgeText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "800",
  },
  typeBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(15, 30, 54, 0.72)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "800",
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardPrice: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#E05A36",
  },
  cardFav: {
    backgroundColor: "#FFFFFF",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#EAE9E4",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F1E36",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginVertical: 2,
  },
  cardLocation: {
    fontSize: 10.5,
    color: "#6B7280",
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 9.5,
    color: "#4B5563",
    fontWeight: "700",
  },
});
