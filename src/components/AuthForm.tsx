"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthFormState } from "@/app/actions/auth";
import styles from "./AuthForm.module.css";

type Mode = "signin" | "signup";

export function AuthForm({
  mode,
  action,
}: {
  mode: Mode;
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.error && (
        <p className="notice" role="alert">
          {state.error}
        </p>
      )}

      {isSignup && (
        <div className="field">
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            name="name"
            className="input"
            autoComplete="name"
            defaultValue={state.fields?.name}
            required
          />
        </div>
      )}

      <div className="field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          autoComplete="email"
          defaultValue={state.fields?.email}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={isSignup ? 8 : undefined}
          required
        />
        {isSignup && <span className="hint">At least eight characters.</span>}
      </div>

      <button type="submit" className={`btn btn-seal ${styles.submit}`} disabled={pending}>
        {pending ? "One moment…" : isSignup ? "Open my atelier" : "Sign in"}
      </button>

      <p className={styles.switch}>
        {isSignup ? (
          <>
            Already a member? <Link href="/connexion">Sign in</Link>
          </>
        ) : (
          <>
            New to the house? <Link href="/inscription">Create an account</Link>
          </>
        )}
      </p>
    </form>
  );
}
