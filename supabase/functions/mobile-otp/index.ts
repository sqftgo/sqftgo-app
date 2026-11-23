import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

type IssueResult = {
  ok: boolean;
  code?: string;
  message?: string;
  challengeId?: string;
  otp?: string;
  expiresAt?: string;
  resendAfterSeconds?: number;
  userId?: string;
};

type AuthPurpose = "verify" | "register" | "login";

async function deliverViaMsg91WhatsApp(
  e164Digits: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string; code: string } | null> {
  const authkey = Deno.env.get("MSG91_AUTH_KEY");
  const integratedNumber = Deno.env.get("MSG91_WHATSAPP_NUMBER");
  const templateName = Deno.env.get("MSG91_WHATSAPP_TEMPLATE");
  const namespace = Deno.env.get("MSG91_WHATSAPP_NAMESPACE");
  const language = Deno.env.get("MSG91_WHATSAPP_LANGUAGE") ?? "en";
  if (!authkey || !integratedNumber || !templateName) return null;

  const to = e164Digits.replace(/\D/g, "");
  const payload: Record<string, unknown> = {
    integrated_number: integratedNumber,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: templateName,
        language: { code: language, policy: "deterministic" },
        ...(namespace ? { namespace } : {}),
        to_and_components: [
          {
            to: [to],
            components: {
              body_1: { type: "text", value: code },
              button_1: { subtype: "url", type: "text", value: code },
            },
          },
        ],
      },
    },
  };

  const res = await fetch(
    "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("MSG91 WhatsApp delivery failed", res.status, detail);
    return {
      ok: false,
      code: "delivery_failed",
      message: "We couldn't send the WhatsApp verification code. Try again shortly.",
    };
  }
  return { ok: true };
}

async function deliverViaMsg91OtpSms(
  e164Digits: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string; code: string } | null> {
  const authkey = Deno.env.get("MSG91_AUTH_KEY");
  const templateId = Deno.env.get("MSG91_OTP_TEMPLATE_ID");
  if (!authkey || !templateId) return null;

  const mobile = e164Digits.replace(/\D/g, "");
  const url = new URL("https://control.msg91.com/api/v5/otp");
  url.searchParams.set("template_id", templateId);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("otp", code);
  url.searchParams.set("otp_length", "6");
  url.searchParams.set("otp_expiry", "5");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey,
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("MSG91 OTP SMS delivery failed", res.status, detail);
    return {
      ok: false,
      code: "delivery_failed",
      message: "We couldn't send the verification code. Try again shortly.",
    };
  }
  return { ok: true };
}

async function deliverViaTwilio(
  e164: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string; code: string } | null> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM");
  if (!sid || !token || !from) return null;

  const text = `Your SqftGo verification code is ${code}. It expires in 5 minutes.`;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: e164, From: from, Body: text }),
  });
  if (!res.ok) {
    return {
      ok: false,
      code: "delivery_failed",
      message: "We couldn't send the verification code. Try again shortly.",
    };
  }
  return { ok: true };
}

async function deliverViaWebhook(
  e164: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string; code: string } | null> {
  const hook = Deno.env.get("MOBILE_OTP_WEBHOOK_URL");
  if (!hook) return null;
  const secret = Deno.env.get("MOBILE_OTP_WEBHOOK_SECRET") ?? "";
  const text = `Your SqftGo verification code is ${code}. It expires in 5 minutes.`;
  const res = await fetch(hook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify({ to: e164, code, text, channel: "whatsapp" }),
  });
  if (!res.ok) {
    return {
      ok: false,
      code: "delivery_failed",
      message: "We couldn't send the verification code. Try again shortly.",
    };
  }
  return { ok: true };
}

async function deliverOtp(
  e164: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string; code: string }> {
  const digits = e164.replace(/\D/g, "");
  const msg91WhatsApp = await deliverViaMsg91WhatsApp(digits, code);
  if (msg91WhatsApp) return msg91WhatsApp;

  const msg91Sms = await deliverViaMsg91OtpSms(digits, code);
  if (msg91Sms) return msg91Sms;

  const twilio = await deliverViaTwilio(e164.startsWith("+") ? e164 : `+${digits}`, code);
  if (twilio) return twilio;

  const webhook = await deliverViaWebhook(e164.startsWith("+") ? e164 : `+${digits}`, code);
  if (webhook) return webhook;

  return {
    ok: false,
    code: "delivery_unconfigured",
    message: "Mobile verification is temporarily unavailable.",
  };
}

function deliveryConfigured(): boolean {
  return Boolean(
    (Deno.env.get("MSG91_AUTH_KEY") &&
      ((Deno.env.get("MSG91_WHATSAPP_NUMBER") && Deno.env.get("MSG91_WHATSAPP_TEMPLATE")) ||
        Deno.env.get("MSG91_OTP_TEMPLATE_ID"))) ||
      (Deno.env.get("TWILIO_ACCOUNT_SID") &&
        Deno.env.get("TWILIO_AUTH_TOKEN") &&
        Deno.env.get("TWILIO_FROM")) ||
      Deno.env.get("MOBILE_OTP_WEBHOOK_URL"),
  );
}

function statusFor(code?: string) {
  if (code === "rate_limited" || code === "cooldown" || code === "locked") return 429;
  if (code === "duplicate" || code === "not_found") return 409;
  if (code === "delivery_unconfigured" || code === "delivery_failed") return 503;
  if (code === "unauthorized") return 401;
  return 400;
}

function parsePurpose(raw: unknown): AuthPurpose | null {
  if (raw === "register" || raw === "login" || raw === "verify") return raw;
  if (raw === undefined || raw === null || raw === "") return "verify";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, message: "Method not allowed." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anon) {
    return json({ ok: false, message: "Verification is not configured." }, 500);
  }

  let body: {
    action?: string;
    purpose?: string;
    countryCode?: string;
    mobileNumber?: string;
    code?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  const purpose = parsePurpose(body.purpose);
  if (!purpose) return json({ ok: false, message: "Unsupported verification purpose." }, 400);

  const admin = createClient(url, serviceKey);
  const authorization = req.headers.get("Authorization") ?? "";

  // Authenticated verify flow (existing post-login gate)
  if (purpose === "verify") {
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userError || !user) {
      return json(
        { ok: false, code: "unauthorized", message: "Sign in again to verify your mobile number." },
        401,
      );
    }

    const provider =
      typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : null;

    if (body.action === "verify") {
      const { data, error } = await admin.rpc("consume_mobile_otp", {
        p_user_id: user.id,
        p_code: String(body.code ?? ""),
        p_auth_provider: provider,
      });
      if (error) return json({ ok: false, message: "Couldn't verify that code. Try again." }, 500);
      const result = (data ?? { ok: false, message: "Couldn't verify that code. Try again." }) as {
        ok: boolean;
        message?: string;
        code?: string;
        phone?: string;
        countryCode?: string;
      };
      return json(result, result.ok ? 200 : statusFor(result.code));
    }

    if (body.action !== "send") return json({ ok: false, message: "Unsupported action." }, 400);
    if (!deliveryConfigured()) {
      return json(
        {
          ok: false,
          code: "delivery_unconfigured",
          message: "Mobile verification is temporarily unavailable.",
        },
        503,
      );
    }

    const country = String(body.countryCode ?? "").replace(/\D/g, "");
    const national = String(body.mobileNumber ?? "").replace(/\D/g, "");
    const { data, error } = await admin.rpc("issue_mobile_otp", {
      p_user_id: user.id,
      p_country: country,
      p_national: national,
    });
    if (error) return json({ ok: false, message: "Couldn't send a code. Try again." }, 500);

    const issued = (data ?? { ok: false, message: "Couldn't send a code. Try again." }) as IssueResult;
    if (!issued.ok || !issued.otp || !issued.challengeId) {
      return json(
        {
          ok: false,
          code: issued.code,
          message: issued.message,
          resendAfterSeconds: issued.resendAfterSeconds,
        },
        statusFor(issued.code),
      );
    }

    const delivery = await deliverOtp(`+${country}${national}`, issued.otp);
    if (!delivery.ok) {
      await admin.rpc("void_mobile_otp", { p_challenge: issued.challengeId });
      return json(
        { ok: false, code: delivery.code, message: delivery.message },
        statusFor(delivery.code),
      );
    }

    return json({
      ok: true,
      expiresAt: issued.expiresAt,
      resendAfterSeconds: issued.resendAfterSeconds ?? 30,
      channel: "whatsapp",
    });
  }

  // Unauthenticated register / login OTP
  if (body.action === "verify") {
    const country = String(body.countryCode ?? "").replace(/\D/g, "");
    const national = String(body.mobileNumber ?? "").replace(/\D/g, "");
    const { data, error } = await admin.rpc("consume_auth_mobile_otp", {
      p_purpose: purpose,
      p_country: country,
      p_national: national,
      p_code: String(body.code ?? ""),
    });
    if (error) return json({ ok: false, message: "Couldn't verify that code. Try again." }, 500);
    const result = (data ?? { ok: false, message: "Couldn't verify that code. Try again." }) as {
      ok: boolean;
      message?: string;
      code?: string;
      claimToken?: string;
      userId?: string;
      phone?: string;
      countryCode?: string;
      purpose?: string;
    };
    return json(result, result.ok ? 200 : statusFor(result.code));
  }

  if (body.action !== "send") return json({ ok: false, message: "Unsupported action." }, 400);
  if (!deliveryConfigured()) {
    return json(
      {
        ok: false,
        code: "delivery_unconfigured",
        message: "Mobile verification is temporarily unavailable.",
      },
      503,
    );
  }

  const country = String(body.countryCode ?? "").replace(/\D/g, "");
  const national = String(body.mobileNumber ?? "").replace(/\D/g, "");
  const { data, error } = await admin.rpc("issue_auth_mobile_otp", {
    p_purpose: purpose,
    p_country: country,
    p_national: national,
  });
  if (error) return json({ ok: false, message: "Couldn't send a code. Try again." }, 500);

  const issued = (data ?? { ok: false, message: "Couldn't send a code. Try again." }) as IssueResult;
  if (!issued.ok || !issued.otp || !issued.challengeId) {
    return json(
      {
        ok: false,
        code: issued.code,
        message: issued.message,
        resendAfterSeconds: issued.resendAfterSeconds,
      },
      statusFor(issued.code),
    );
  }

  const delivery = await deliverOtp(`+${country}${national}`, issued.otp);
  if (!delivery.ok) {
    await admin.rpc("void_mobile_otp", { p_challenge: issued.challengeId });
    return json(
      { ok: false, code: delivery.code, message: delivery.message },
      statusFor(delivery.code),
    );
  }

  return json({
    ok: true,
    expiresAt: issued.expiresAt,
    resendAfterSeconds: issued.resendAfterSeconds ?? 30,
    channel: "whatsapp",
  });
});
