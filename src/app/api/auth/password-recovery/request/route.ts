import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildPasswordRecoveryEmail } from "@/lib/password-recovery-email";

type GenerateLinkResponse = {
  action_link?: string;
  hashed_token?: string;
  verification_type?: string;
};

function genericSuccess() {
  return NextResponse.json({
    ok: true,
    message: "Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña.",
  });
}

function privateHash(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
}

function brandedSender(value: string) {
  return value.includes("<") ? value : `Chetesaí Fitness+ <${value}>`;
}

function publicAppUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured)) {
    return configured.replace(/\/$/, "");
  }
  return request.nextUrl.origin.replace(/\/$/, "");
}

async function checkRateLimit(
  supabaseUrl: string,
  serviceKey: string,
  emailHash: string,
  ipHash: string
) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/check_password_recovery_rate_limit`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_email_hash: emailHash, p_ip_hash: ipHash }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Password recovery rate limit failed", response.status, await response.text());
    return false;
  }

  return (await response.json()) === true;
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.AUTH_FROM_EMAIL || process.env.BOOKING_FROM_EMAIL;
  const replyTo = process.env.AUTH_REPLY_TO || process.env.BOOKING_REPLY_TO;

  if (!supabaseUrl || !serviceKey || !resendApiKey || !fromEmail) {
    return NextResponse.json(
      { ok: false, error: "El servicio de recuperación no está configurado" },
      { status: 500 }
    );
  }

  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = body.email?.trim().toLowerCase() || "";
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud no válida" }, { status: 400 });
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Introduce un correo electrónico válido" },
      { status: 400 }
    );
  }

  const appUrl = publicAppUrl(request);
  const callbackUrl = `${appUrl}/api/auth/password-recovery/callback`;
  const emailHash = privateHash(email, serviceKey);
  const ipHash = privateHash(clientIp(request), serviceKey);

  if (!(await checkRateLimit(supabaseUrl, serviceKey, emailHash, ipHash))) {
    return genericSuccess();
  }

  const linkResponse = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "recovery",
      email,
      redirect_to: callbackUrl,
    }),
    cache: "no-store",
  });

  if (!linkResponse.ok) {
    console.warn("Password recovery link was not generated", linkResponse.status);
    return genericSuccess();
  }

  const linkData = (await linkResponse.json()) as GenerateLinkResponse;
  if (!linkData.hashed_token || linkData.verification_type !== "recovery") {
    console.error("Password recovery link response was incomplete");
    return genericSuccess();
  }

  const brandedRecoveryUrl = new URL(callbackUrl);
  brandedRecoveryUrl.searchParams.set("token_hash", linkData.hashed_token);
  brandedRecoveryUrl.searchParams.set("type", "recovery");
  const emailContent = buildPasswordRecoveryEmail(brandedRecoveryUrl.toString());

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ChetesaiFitness/1.0",
      "Idempotency-Key": `password-recovery-${emailHash}-${Math.floor(Date.now() / 60_000)}`,
    },
    body: JSON.stringify({
      from: brandedSender(fromEmail),
      to: [email],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }),
  });

  if (!emailResponse.ok) {
    console.error("Password recovery email failed", emailResponse.status, await emailResponse.text());
  }

  return genericSuccess();
}
