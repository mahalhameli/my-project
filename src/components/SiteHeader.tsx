import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import styles from "./Site.module.css";

const NAV = [
  { href: "/#rooms", french: "Les Pièces", english: "Rooms" },
  { href: "/materiaux", french: "Les Matériaux", english: "Materials" },
  { href: "/#methode", french: "La Méthode", english: "How it works" },
  { href: "/abonnements", french: "Abonnements", english: "Membership" },
];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <Link href="/" className={styles.brand} aria-label="Maison & Jardin, home">
          <span className={styles.brandMark} aria-hidden="true">
            M<span>&amp;</span>J
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>Maison &amp; Jardin</span>
            <span className={styles.brandSince}>Maison de décoration · Interiors &amp; Gardens</span>
          </span>
        </Link>

        <nav aria-label="Main" className={styles.nav}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.french}
              <span className={styles.navEnglish}>{item.english}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.account}>
          <Suspense fallback={<span className={styles.accountPlaceholder} />}>
            <AccountLinks />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function AccountLinks() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <>
        <Link href="/connexion" className="btn btn-quiet">
          Sign in
        </Link>
        <Link href="/inscription" className="btn btn-seal">
          Join
        </Link>
      </>
    );
  }
  return (
    <>
      <Link href="/atelier" className="btn">
        Mon Atelier
      </Link>
      <form action={signOut}>
        <button type="submit" className="btn btn-quiet">
          Sign out
        </button>
      </form>
    </>
  );
}
