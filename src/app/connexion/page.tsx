import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { signIn } from "@/app/actions/auth";
import styles from "@/components/AuthForm.module.css";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <section className={`container ${styles.page}`}>
      <div className={`frame ${styles.card}`}>
        <h1>
          Connexion
          <span className="translation">Welcome back</span>
        </h1>
        <p className={styles.intro}>Sign in to return to your rooms.</p>
        <AuthForm mode="signin" action={signIn} />
      </div>
    </section>
  );
}
