import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { planInfo } from "@/lib/plans";
import { ROOMS } from "@/lib/rooms";
import styles from "./atelier.module.css";

export const metadata: Metadata = { title: "Mon Atelier" };

export default function AtelierPage() {
  return (
    <section className={`container ${styles.page}`}>
      <Suspense fallback={<p className="center lede">Opening your atelier…</p>}>
        <Atelier />
      </Suspense>
    </section>
  );
}

async function Atelier() {
  const user = await requireUser();
  const plan = planInfo(user.plan);
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <header className="center">
        <p className="smallcaps">Mon Atelier</p>
        <h1>
          Bonjour, <span className="script">{firstName}</span>
        </h1>
        <p className="lede">Which room shall we begin with today?</p>
        <p className={styles.plan}>
          Your membership: <strong>{plan.french}</strong> ({plan.english}) ·{" "}
          <Link href="/abonnements">view memberships</Link>
        </p>
      </header>

      <div className="fleuron">
        <span>❦</span>
      </div>

      <ul className={styles.grid}>
        {ROOMS.map(({ slug, french, english, Illustration }) => (
          <li key={slug} className={styles.card}>
            <div className={styles.plate}>
              <Illustration />
            </div>
            <h2 className={styles.title}>
              {french}
              <span className="translation">{english}</span>
            </h2>
            <span className={styles.soon}>The consultation opens soon</span>
          </li>
        ))}
      </ul>
    </>
  );
}
