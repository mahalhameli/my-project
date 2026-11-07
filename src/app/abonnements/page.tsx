import type { Metadata } from "next";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import styles from "./abonnements.module.css";

export const metadata: Metadata = { title: "Membership" };

export default function MembershipPage() {
  return (
    <section className={`container ${styles.page}`}>
      <header className="center">
        <p className="smallcaps">Abonnements</p>
        <h1>
          Memberships of the house
          <span className="translation">choose the one that suits your home</span>
        </h1>
        <p className="lede">
          Begin for free with a single room. Become a member when you are ready to decorate the
          whole house.
        </p>
      </header>

      <ul className={styles.grid}>
        {PLANS.map((plan) => (
          <li key={plan.id} className={`frame ${styles.card} ${plan.featured ? styles.featured : ""}`}>
            {plan.featured && <span className={styles.ribbon}>Most chosen</span>}
            <h2 className={styles.name}>
              {plan.french}
              <span className="translation">{plan.english}</span>
            </h2>
            <p className={styles.price}>
              {plan.price}
              <span>{plan.cadence}</span>
            </p>
            <p className={styles.summary}>{plan.summary}</p>
            <ul className={styles.features}>
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {plan.id === "visiteur" ? (
              <Link href="/inscription" className="btn btn-seal">
                Begin for free
              </Link>
            ) : (
              <button type="button" className="btn" disabled aria-disabled="true">
                Opening soon
              </button>
            )}
          </li>
        ))}
      </ul>

      <p className={styles.footnote}>
        Paid memberships open shortly. Create a free account now and your rooms will be waiting.
      </p>
    </section>
  );
}
