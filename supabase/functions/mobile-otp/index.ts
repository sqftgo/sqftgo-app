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
};

async function deliverSms(
  e164: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string; code: string }> {
  const text = `Your SqftGo verification code is ${code}. It expires in 5 minutes.`;
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM");
  if (sid && token && from) {
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

  const hook = Deno.env.get("MOBILE_OTP_WEBHOOK_URL");
  if (hook) {
    const secret = Deno.env.get("MOBILE_OTP_WEBHOOK_SECRET") ?? "";
    const res = await fetch(hook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({ to: e164, code, text }),
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

  return {
    ok: false,
    code: "delivery_unconfigured",
    message: "Mobile verification is temporarily unavailable.",
  };
}

function statusFor(code?: string) {
  if (code === "rate_limited" || code === "cooldown" || code === "locked") return 429;
  if (code === "duplicate") return 409;
  if (code === "delivery_unconfigured" || code === "delivery_failed") return 503;
  return 400;
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

  const authorization = req.headers.get("Authorization") ?? "";
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

  let body: { action?: string; countryCode?: string; mobileNumber?: string; code?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  const admin = createClient(url, serviceKey);
  const provider = typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : null;

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
    };
    return json(result, result.ok ? 200 : statusFor(result.code));
  }

  if (body.action !== "send") return json({ ok: false, message: "Unsupported action." }, 400);

  const smsReady = Boolean(
    (Deno.env.get("TWILIO_ACCOUNT_SID") && Deno.env.get("TWILIO_AUTH_TOKEN") && Deno.env.get("TWILIO_FROM"))
    || Deno.env.get("MOBILE_OTP_WEBHOOK_URL"),
  );
  if (!smsReady) {
    return json({
      ok: false,
      code: "delivery_unconfigured",
      message: "Mobile verification is temporarily unavailable.",
    }, 503);
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

  const delivery = await deliverSms(`+${country}${national}`, issued.otp);
  if (!delivery.ok) {
    await admin.rpc("void_mobile_otp", { p_challenge: issued.challengeId });
    return json({ ok: false, code: delivery.code, message: delivery.message }, statusFor(delivery.code));
  }

  return json({
    ok: true,
    expiresAt: issued.expiresAt,
    resendAfterSeconds: issued.resendAfterSeconds ?? 30,
  });
});
