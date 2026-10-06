import React, { forwardRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { Eye, EyeOff } from "@/components/ui/icons";
import { colors, radius, spacing, touchTarget, type } from "@/theme/tokens";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  /** Fixed text before the input, e.g. "₹" or "+91". */
  prefix?: string;
  suffix?: string;
  /** Adds a show/hide toggle; implies secureTextEntry. */
  password?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    hint,
    error,
    required,
    prefix,
    suffix,
    password,
    multiline,
    editable = true,
    containerStyle,
    onFocus,
    onBlur,
    ...input
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? colors.danger : focused ? colors.accent : colors.border;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={{ color: colors.accent }}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          { borderColor, opacity: editable ? 1 : 0.6 },
        ]}
      >
        {prefix ? <Text style={styles.affix}>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          {...input}
          editable={editable}
          multiline={multiline}
          secureTextEntry={password ? hidden : input.secureTextEntry}
          placeholderTextColor={colors.placeholder}
          accessibilityLabel={input.accessibilityLabel ?? label}
          accessibilityHint={error ?? hint}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
        {suffix ? <Text style={styles.affix}>{suffix}</Text> : null}
        {password ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            {hidden ? (
              <Eye size={20} color={colors.inkMuted} />
            ) : (
              <EyeOff size={20} color={colors.inkMuted} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs + 2 },
  label: { ...type.label, color: colors.inkSecondary },
  field: {
    minHeight: touchTarget + 6,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: "continuous",
  },
  fieldMultiline: { alignItems: "flex-start", paddingVertical: spacing.md },
  input: { ...type.body, flex: 1, color: colors.ink, paddingVertical: spacing.sm },
  inputMultiline: { minHeight: 96, textAlignVertical: "top", paddingVertical: 0 },
  affix: { ...type.body, color: colors.inkMuted },
  hint: { ...type.caption, color: colors.inkMuted },
  error: { ...type.caption, color: colors.danger },
});
