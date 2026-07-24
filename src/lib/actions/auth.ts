"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  magicLinkSchema,
  requestPasswordResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth.schema";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  redirect("/auth/verify-email");
}

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInWithMagicLink(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Check your email for a sign-in link." };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function resendVerificationEmail(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, message: "You need to be signed in." };

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Verification email sent." };
}

export async function requestPasswordReset(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/update-password`,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Check your email for a password reset link." };
}

export async function updatePassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
