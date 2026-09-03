import React, { useMemo } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { colors, radius, spacing, type } from "@/theme/tokens";

export type RazorpayCheckoutSuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type Props = {
  visible: boolean;
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  prefillName?: string;
  prefillEmail?: string;
  onSuccess: (payload: RazorpayCheckoutSuccess) => void;
  onDismiss: () => void;
  onError: (message: string) => void;
};

function buildHtml(opts: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  prefillName?: string;
  prefillEmail?: string;
}) {
  const payload = JSON.stringify({
    key: opts.keyId,
    amount: opts.amount,
    currency: opts.currency,
    name: "SqftGo Partner",
    description: opts.description,
    order_id: opts.orderId,
    prefill: {
      name: opts.prefillName || "",
      email: opts.prefillEmail || "",
    },
    theme: { color: "#E05A36" },
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body { font-family: -apple-system, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#F7F5F2; color:#0F1E36; }
  </style>
</head>
<body>
  <p id="status">Opening secure checkout…</p>
  <script>
    (function () {
      var options = ${payload};
      options.handler = function (response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', response: response }));
      };
      options.modal = {
        ondismiss: function () {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dismiss' }));
        }
      };
      try {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          var msg = (resp && resp.error && resp.error.description) || 'Payment failed';
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: msg }));
        });
        rzp.open();
        document.getElementById('status').textContent = 'Complete payment in the Razorpay window.';
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: String(e && e.message || e) }));
      }
    })();
  </script>
</body>
</html>`;
}

export function RazorpayCheckoutModal({
  visible,
  keyId,
  orderId,
  amount,
  currency,
  description,
  prefillName,
  prefillEmail,
  onSuccess,
  onDismiss,
  onError,
}: Props) {
  const html = useMemo(
    () =>
      buildHtml({
        keyId,
        orderId,
        amount,
        currency,
        description,
        prefillName,
        prefillEmail,
      }),
    [keyId, orderId, amount, currency, description, prefillName, prefillEmail],
  );

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type: string;
        response?: RazorpayCheckoutSuccess;
        message?: string;
      };
      if (data.type === "success" && data.response) {
        onSuccess(data.response);
        return;
      }
      if (data.type === "dismiss") {
        onDismiss();
        return;
      }
      if (data.type === "error") {
        onError(data.message || "Payment failed");
      }
    } catch {
      onError("Unexpected checkout response");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: spacing.xl }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
          }}
        >
          <Text style={{ ...type.heading, color: colors.ink }}>Pay securely</Text>
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Text style={{ ...type.label, color: colors.accent }}>Close</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, overflow: "hidden" }}>
          {visible ? (
            <WebView
              originWhitelist={["*"]}
              source={{ html }}
              onMessage={onMessage}
              startInLoadingState
              renderLoading={() => (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <ActivityIndicator color={colors.accent} />
                </View>
              )}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
