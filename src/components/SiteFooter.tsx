import Link from "next/link";
import { Flourish } from "./Engravings";
import styles from "./Site.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <Flourish className={styles.footerFlourish} />
        <p className={styles.footerMotto}>
          <span className="script">Une maison bien pensée est une maison heureuse.</span>
          <span className={styles.footerMottoEnglish}>A well-considered home is a happy home.</span>
        </p>
        <nav aria-label="Footer" className={styles.footerNav}>
          <Link href="/#rooms">Rooms</Link>
          <Link href="/materiaux">Materials</Link>
          <Link href="/#methode">How it works</Link>
          <Link href="/abonnements">Membership</Link>
          <Link href="/connexion">Sign in</Link>
        </nav>
        <p className={styles.footerSmall}>
          © Maison &amp; Jardin · Interiors &amp; Gardens
        </p>
      </div>
    </footer>
  );
}
