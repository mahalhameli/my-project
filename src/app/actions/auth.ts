"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createUser, findUserByEmail } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, deleteSession } from "@/lib/session";

export type AuthFormState = {
  error?: string;
  fields?: { name?: string; email?: string };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fields = { name, email };

  if (name.length < 2) {
    return { error: "Please tell us your name.", fields };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "That email address doesn't look quite right.", fields };
  }
  if (password.length < 8) {
    return {
      error: "Your password should be at least eight characters long.",
      fields,
    };
  }
  if (findUserByEmail(email)) {
    return {
      error: "An account with this email already exists. Please sign in.",
      fields,
    };
  }

  const id = randomUUID();
  createUser({ id, name, email, passwordHash: await hashPassword(password) });
  await createSession(id);
  redirect("/atelier");
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = findUserByEmail(email);
  const valid = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !valid) {
    return {
      error: "We couldn't find that email and password together.",
      fields: { email },
    };
  }

  await createSession(user.id);
  redirect("/atelier");
}

export async function signOut(): Promise<void> {
  await deleteSession();
  redirect("/");
}
