import Link from "next/link";
import { HeroWindow, Flourish } from "@/components/Engravings";
import { ROOMS } from "@/lib/rooms";
import { PLANS } from "@/lib/plans";
import styles from "./home.module.css";

const STEPS = [
  {
    numeral: "I",
    french: "La Consultation",
    english: "The Consultation",
    text: "Tell us about the room, who lives in it, which way the windows face, and the feeling you hope for. It takes about five minutes.",
  },
  {
    numeral: "II",
    french: "Le Choix des Matériaux",
    english: "Choosing the Materials",
    text: "We propose wallpaper, tiles, curtains and paint that sit well together, and explain why, just as a designer would.",
  },
  {
    numeral: "III",
    french: "La Mise en Place",
    english: "Arranging the Room",
    text: "Place your furniture to scale with proper walkways, then see the finished room before you spend a single dirham.",
  },
];

export default function Home() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className={`container ${styles.hero}`}>
        <div className={`${styles.heroText} unfurl`}>
          <p className="smallcaps">Interiors &amp; Gardens</p>
          <h1>
            The art of choosing,{" "}
            <span className="script" style={{ fontSize: "1.05em" }}>
              beautifully
            </span>
          </h1>
          <p className="lede">
            Wallpaper, tiles, curtains and the placing of every chair. We guide you through each
            decision as a trusted designer would, so your rooms feel as though they have always
            been loved.
          </p>
          <div className={styles.heroActions}>
            <Link href="/inscription" className="btn btn-seal">
              Begin your consultation
            </Link>
            <Link href="#rooms" className="btn">
              Browse the rooms
            </Link>
          </div>
          <p className={styles.heroNote}>Free to begin · No card required</p>
        </div>

        <div className={`${styles.heroArt} unfurl unfurl-delay`}>
          <div className="gilt">
            <HeroWindow />
          </div>
          <p className={styles.plateCaption}>
            Pl. I, <em>Fenêtre sur le parterre</em>
          </p>
        </div>
      </section>

      <div className="fleuron">
        <span>❦</span>
      </div>

      {/* ---------- Rooms ---------- */}
      <section id="rooms" className={`section ${styles.rooms}`}>
        <div className="container">
          <header className="center">
            <p className="smallcaps">Les Pièces</p>
            <h2>
              Every room of the house
              <span className="translation">and the garden beyond</span>
            </h2>
            <p>
              Each room has its own guided consultation, its own library of materials, and the
              practical rules a designer would never forget.
            </p>
          </header>

          <ul className={styles.roomGrid}>
            {ROOMS.map(({ slug, french, english, description, Illustration }) => (
              <li key={slug} className={styles.roomCard}>
                <div className={styles.roomPlate}>
                  <Illustration />
                </div>
                <h3 className={styles.roomTitle}>
                  {french}
                  <span className="translation">{english}</span>
                </h3>
                <p className={styles.roomText}>{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Method ---------- */}
      <section id="methode" className={`section ${styles.method}`}>
        <div className="container">
          <header className="center">
            <p className="smallcaps">La Méthode</p>
            <h2>
              A consultation in three movements
              <span className="translation">how it works</span>
            </h2>
          </header>

          <ol className={styles.steps}>
            {STEPS.map((step) => (
              <li key={step.numeral} className={`frame ${styles.step}`}>
                <span className={styles.numeral} aria-hidden="true">
                  {step.numeral}
                </span>
                <h3>
                  {step.french}
                  <span className="translation">{step.english}</span>
                </h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Designer's note ---------- */}
      <section className="section">
        <div className="container">
          <figure className={styles.note}>
            <Flourish className={styles.noteFlourish} />
            <blockquote>
              “I’ve paired the large-scale floral paper with a narrow ticking stripe on the
              curtains. One bold pattern and one quiet one lets both breathe.”
            </blockquote>
            <figcaption>
              <span className="script">Les notes du décorateur</span>
              <span className="translation" style={{ fontSize: "0.9rem" }}>
                Every suggestion comes with the reason behind it.
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ---------- Membership preview ---------- */}
      <section className={`section ${styles.membership}`}>
        <div className="container center">
          <p className="smallcaps">Abonnements</p>
          <h2>
            Become a member of the house
            <span className="translation">membership</span>
          </h2>
          <ul className={styles.planRow}>
            {PLANS.map((plan) => (
              <li key={plan.id} className={plan.featured ? styles.planFeatured : styles.plan}>
                <span className={styles.planName}>{plan.french}</span>
                <span className={styles.planPrice}>{plan.price}</span>
                <span className={styles.planCadence}>{plan.cadence}</span>
                <span className={styles.planSummary}>{plan.summary}</span>
              </li>
            ))}
          </ul>
          <Link href="/abonnements" className="btn">
            Compare memberships
          </Link>
        </div>
      </section>
    </>
  );
}
