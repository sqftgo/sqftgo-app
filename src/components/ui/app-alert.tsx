import React, { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export type AppAlertButtonStyle = "default" | "cancel" | "destructive";

export type AppAlertButton = {
  text: string;
  style?: AppAlertButtonStyle;
  onPress?: () => void;
};

export type AppAlertOptions = {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
};

type Listener = (options: AppAlertOptions | null) => void;

let listener: Listener | null = null;

/** Drop-in replacement for React Native `Alert.alert` — branded in-app dialog. */
export function appAlert(
  title: string,
  message?: string,
  buttons?: AppAlertButton[],
): void {
  if (!listener) {
    if (__DEV__) {
      console.warn("[appAlert] AppAlertProvider is not mounted");
    }
    return;
  }
  listener({
    title,
    message,
    buttons: buttons?.length
      ? buttons
      : [{ text: "OK", style: "default" }],
  });
}

function buttonVisual(style: AppAlertButtonStyle | undefined, alone: boolean) {
  if (style === "destructive") {
    return {
      container: {
        backgroundColor: colors.dangerSoft,
        borderColor: "rgba(220, 38, 38, 0.22)",
      },
      label: { color: colors.danger },
    };
  }
  if (style === "cancel") {
    return {
      container: {
        backgroundColor: colors.surfaceSubtle,
        borderColor: colors.border,
      },
      label: { color: colors.inkSecondary },
    };
  }
  // primary / default
  return {
    container: {
      backgroundColor: alone || style === "default" ? colors.accent : colors.accentSoft,
      borderColor: alone || style === "default" ? colors.accent : colors.accentBorder,
    },
    label: {
      color: alone || style === "default" ? colors.onAccent : colors.accent,
    },
  };
}

function AppAlertDialog({
  options,
  onDismiss,
}: {
  options: AppAlertOptions;
  onDismiss: () => void;
}) {
  const buttons = options.buttons?.length
    ? options.buttons
    : [{ text: "OK", style: "default" as const }];

  const stacked = buttons.length > 2;

  const runPress = (btn: AppAlertButton) => {
    onDismiss();
    // Defer so the modal can close before navigation / side effects.
    requestAnimationFrame(() => btn.onPress?.());
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        const cancel = buttons.find((b) => b.style === "cancel");
        if (cancel) runPress(cancel);
        else onDismiss();
      }}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            const cancel = buttons.find((b) => b.style === "cancel");
            if (cancel) runPress(cancel);
          }}
          accessibilityLabel="Dismiss"
        />
        <View style={styles.card} accessibilityRole="alert">
          <Text style={styles.title}>{options.title}</Text>
          {options.message ? (
            <Text style={styles.message}>{options.message}</Text>
          ) : null}

          <View style={[styles.actions, stacked && styles.actionsStacked]}>
            {buttons.map((btn, index) => {
              const visual = buttonVisual(
                btn.style,
                buttons.length === 1,
              );
              return (
                <Pressable
                  key={`${btn.text}-${index}`}
                  onPress={() => runPress(btn)}
                  accessibilityRole="button"
                  accessibilityLabel={btn.text}
                  style={({ pressed }) => [
                    styles.button,
                    stacked && styles.buttonFull,
                    !stacked && buttons.length > 1 && styles.buttonFlex,
                    visual.container,
                    { borderWidth: 1 },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={[styles.buttonLabel, visual.label]}>{btn.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Mount once near the app root so `appAlert()` can render. */
export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<AppAlertOptions | null>(null);

  const dismiss = useCallback(() => setOptions(null), []);

  useEffect(() => {
    listener = setOptions;
    return () => {
      listener = null;
    };
  }, []);

  return (
    <>
      {children}
      {options ? <AppAlertDialog options={options} onDismiss={dismiss} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    padding: spacing.xl,
    gap: spacing.md,
    boxShadow: shadow.raised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...type.heading,
    color: colors.ink,
  },
  message: {
    ...type.body,
    color: colors.inkMuted,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionsStacked: {
    flexDirection: "column",
  },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonFull: {
    width: "100%",
  },
  buttonLabel: {
    ...type.emphasis,
  },
});
