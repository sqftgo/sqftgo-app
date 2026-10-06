import { Image } from "expo-image";
import { type Href } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { CityField } from "@/components/ds/CityField";
import { Screen, useBack } from "@/components/ds/Screen";
import { TextField } from "@/components/ds/TextField";
import { toast } from "@/components/ds/Toast";
import { appAlert } from "@/components/ui/app-alert";
import { useApp } from "@/context/AppContext";
import { initialsFromName } from "@/lib/format";
import { pickAndUploadAvatar } from "@/lib/media-upload";
import { colors, radius, spacing, type } from "@/theme/tokens";

const BIO_MAX = 500;

export default function EditProfileScreen() {
  const back = useBack("/settings" as Href);
  const { profile, userName, userEmail, updateProfile, isApiMode } = useApp();

  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const changePhoto = async () => {
    setUploading(true);
    try {
      const url = await pickAndUploadAvatar();
      if (url) setAvatar(url);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (name.trim().length < 2) {
      setNameError("Enter at least 2 characters.");
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      city: city.trim(),
      avatarUrl: avatar,
    });
    setSaving(false);
    if (!result.ok) {
      appAlert("Couldn't save profile", result.message);
      return;
    }
    toast("Profile saved");
    back();
  };

  return (
    <Screen
      title="Edit profile"
      fallbackHref={"/settings" as Href}
      footer={<Button label="Save changes" loading={saving} disabled={uploading} onPress={() => void save()} fullWidth />}
    >
      <View style={styles.avatarWrap}>
        <Pressable
          onPress={() => void changePhoto()}
          disabled={uploading || !isApiMode}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.85 }]}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          ) : (
            <Text style={styles.initials}>{initialsFromName(name || userEmail)}</Text>
          )}
          {uploading ? (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : null}
        </Pressable>
        {isApiMode ? (
          <View style={styles.avatarActions}>
            <Pressable onPress={() => void changePhoto()} disabled={uploading} hitSlop={8} accessibilityRole="button">
              <Text style={styles.link}>{avatar ? "Change photo" : "Add photo"}</Text>
            </Pressable>
            {avatar ? (
              <Pressable onPress={() => setAvatar(null)} disabled={uploading} hitSlop={8} accessibilityRole="button">
                <Text style={[styles.link, { color: colors.danger }]}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={{ gap: spacing.lg }}>
        <TextField
          label="Full name"
          required
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (nameError) setNameError(null);
          }}
          maxLength={100}
          autoCapitalize="words"
          autoComplete="name"
          error={nameError}
        />
        <TextField label="Email" value={userEmail} editable={false} hint="Email can't be changed in the app." />
        <TextField
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={30}
          placeholder="+91"
          hint="Shared with dealers only when you send an inquiry or book a visit."
        />
        <CityField value={city} onChange={setCity} />
        <TextField
          label="About you"
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={BIO_MAX}
          placeholder="What are you looking for?"
          hint={`${bio.length}/${BIO_MAX}`}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { alignItems: "center", gap: spacing.md },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center" },
  initials: { ...type.hero, color: colors.onPrimary },
  avatarActions: { flexDirection: "row", gap: spacing.xl },
  link: { ...type.label, color: colors.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});

