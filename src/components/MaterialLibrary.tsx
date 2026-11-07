"use client";

import { useState } from "react";
import { MOODS } from "@/lib/consultation";
import { CATEGORIES, MATERIALS, swatchSizeCm, type Category, type Material } from "@/lib/materials";
import { formatAED } from "@/lib/money";
import { ScaleView } from "./ScaleView";
import { Swatch } from "./Swatch";
import styles from "./MaterialLibrary.module.css";

const SCALE_WORDS = { plain: "Plain", small: "Small-scale", medium: "Medium-scale", large: "Large-scale" } as const;
const WASH_WORDS = { spongeable: "Spongeable", washable: "Washable", scrubbable: "Scrubbable" } as const;
const PRICE = ["", "Accessible", "Mid-range", "Premium"];

export function MaterialLibrary() {
  const [mood, setMood] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);

  const visible = (m: Material) => mood === "all" || m.moods.includes(mood as Material["moods"][number]);

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Filter by feeling">
        <span className={styles.filterLabel}>Show me the</span>
        {[{ id: "all", label: "Whole collection" }, ...MOODS].map((m) => (
          <button
            key={m.id}
            type="button"
            className={`${styles.filter} ${mood === m.id ? styles.filterOn : ""}`}
            aria-pressed={mood === m.id}
            onClick={() => setMood(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <nav className={styles.jump} aria-label="Jump to a category">
        {CATEGORIES.map((c) => (
          <a key={c.id} href={`#${c.id}`}>
            {c.french}
          </a>
        ))}
      </nav>

      {CATEGORIES.map((cat) => {
        const items = MATERIALS.filter((m) => m.category === cat.id && visible(m));
        return (
          <section key={cat.id} id={cat.id} className={styles.category}>
            <h2>
              {cat.french}
              <span className="translation">{cat.english}</span>
            </h2>
            {items.length === 0 ? (
              <p className={styles.empty}>Nothing in this collection has that feeling. Try another word.</p>
            ) : (
              <ul className={styles.grid}>
                {items.map((m) => (
                  <MaterialCard key={m.id} m={m} category={cat.id} open={open === m.id} onToggle={() => setOpen(open === m.id ? null : m.id)} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}

function MaterialCard({
  m,
  category,
  open,
  onToggle,
}: {
  m: Material;
  category: Category;
  open: boolean;
  onToggle: () => void;
}) {
  const unit = CATEGORIES.find((c) => c.id === category)!.unit;
  const canPreview = category !== "flooring";
  return (
    <li className={`${styles.card} ${open ? styles.cardOpen : ""}`}>
      <Swatch uid={`lib-${m.id}`} spec={m.pattern} sizeCm={swatchSizeCm(m)} title={`${m.name} swatch`} className={styles.swatch} />
      <div className={styles.body}>
        <h3>
          {m.name}
          <span className="translation">{m.english}</span>
        </h3>
        <p className={styles.desc}>{m.description}</p>
        <ul className={styles.tags}>
          <li>{SCALE_WORDS[m.scale]}</li>
          {m.repeatCm > 0 && <li>{m.repeatCm} cm repeat</li>}
          {m.washability && <li>{WASH_WORDS[m.washability]}</li>}
          <li>{m.undertone === "neutral" ? "Neutral" : m.undertone === "warm" ? "Warm" : "Cool"} undertone</li>
          <li title="Indicative price band">
            {PRICE[m.priceTier]} · about {formatAED(m.unitPrice)} per {unit}
          </li>
        </ul>
        <blockquote className={styles.note}>“{m.note}”</blockquote>
        {canPreview && (
          <button type="button" className="btn" onClick={onToggle} aria-expanded={open}>
            {open ? "Close the preview" : "See it at full scale"}
          </button>
        )}
      </div>
      {open && canPreview && (
        <div className={styles.preview}>
          <ScaleView
            uid={`lib-scale-${m.id}`}
            wall={category === "fabric" ? undefined : m}
            fabric={category === "fabric" ? m : undefined}
            ceilingM={2.5}
            wallLengthM={3.2}
            windowWidthCm={120}
            ageStage={m.ages[0]}
          />
          <p className={styles.previewCaption}>
            Shown on a 3.2 m wall with a 2.5 m ceiling. The pattern is at its true size.
          </p>
        </div>
      )}
    </li>
  );
}
