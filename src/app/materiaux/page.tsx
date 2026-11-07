import type { Metadata } from "next";
import Link from "next/link";
import { MaterialLibrary } from "@/components/MaterialLibrary";

export const metadata: Metadata = { title: "The Material Library" };

export default function MaterialsPage() {
  return (
    <section className="container" style={{ padding: "clamp(40px, 6vw, 80px) var(--gutter)" }}>
      <header className="center">
        <p className="smallcaps">Les Matériaux</p>
        <h1>
          The Material Library
          <span className="translation">for the children&apos;s bedroom</span>
        </h1>
        <p className="lede">
          Papers, paints, fabrics and floors from the house&apos;s own collections. Each is shown at its true
          scale, with a note on how I would use it.
        </p>
        <p>
          For recommendations made for your own room,{" "}
          <Link href="/inscription">begin a consultation</Link>.
        </p>
      </header>
      <MaterialLibrary />
      <p className="center" style={{ marginTop: 48, fontStyle: "italic", color: "var(--ink-faint)" }}>
        Prices are indicative guides for budgeting, not quotes.
      </p>
    </section>
  );
}
