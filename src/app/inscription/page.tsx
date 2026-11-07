import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { signUp } from "@/app/actions/auth";
import styles from "@/components/AuthForm.module.css";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <section className={`container ${styles.page}`}>
      <div className={`frame ${styles.card}`}>
        <h1>
          Inscription
          <span className="translation">Create your account</span>
        </h1>
        <p className={styles.intro}>
          Your atelier keeps every room, swatch and plan in one place, ready whenever you are.
        </p>
        <AuthForm mode="signup" action={signUp} />
      </div>
    </section>
  );
}
