import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { removeRoom, toggleSelection } from "@/app/actions/rooms";
import { ScaleView } from "@/components/ScaleView";
import { Swatch } from "@/components/Swatch";
import { requireUser } from "@/lib/auth";
import {
  AGE_STAGES,
  LIGHT_LEVELS,
  MOODS,
  ORIENTATIONS,
  labelOf,
  type Consultation,
} from "@/lib/consultation";
import { findRoom, listPhotos } from "@/lib/db";
import { MAX_PHOTOS_PER_ROOM } from "@/lib/photo-model";
import { PhotoUpload } from "@/components/PhotoUpload";
import studioStyles from "@/components/PhotoStudio.module.css";
import { CATEGORIES, materialById, swatchSizeCm, type Category, type Material } from "@/lib/materials";
import {
  estimatedCost,
  floorArea,
  quantityFor,
  recommend,
  roomAdvice,
  scoreMaterial,
  type Recommendation,
  type Selections,
} from "@/lib/recommend";
import { formatAED } from "@/lib/money";
import { parseConsultation, parseSelections } from "@/lib/room-data";
import styles from "./room.module.css";

export const metadata: Metadata = { title: "Your room" };

export default function RoomPage({ params }: PageProps<"/atelier/pieces/[id]">) {
  return (
    <section className={`container ${styles.page}`}>
      <Suspense fallback={<p className="center lede">Laying out your swatches…</p>}>
        <Room params={params} />
      </Suspense>
    </section>
  );
}

const money = formatAED;

async function Room({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const row = await findRoom(user.id, id);
  if (!row) notFound();

  const c = parseConsultation(row.consultation);
  if (!c) {
    return <p className="notice">This room&apos;s consultation could not be read. Please remove it and begin again.</p>;
  }
  const selections = parseSelections(row.selections);
  const photos = await listPhotos(user.id, row.id);

  // The suggested scheme pairs everything with the chosen paper, or the best paper if none is chosen yet.
  const paperRecs = recommend("wallpaper", c, selections);
  const effectivePaper = selections.wallpaper ?? paperRecs[0]?.material.id;
  const pairing: Selections = { ...selections, wallpaper: effectivePaper };

  const recs: Record<Category, Recommendation[]> = {
    wallpaper: paperRecs,
    paint: recommend("paint", c, pairing),
    fabric: recommend("fabric", c, pairing),
    flooring: recommend("flooring", c, pairing),
  };
  // Always show what the client chose, even if it isn't in the top three.
  for (const cat of Object.keys(recs) as Category[]) {
    const chosen = materialById(selections[cat]);
    if (chosen && !recs[cat].some((r) => r.material.id === chosen.id)) {
      recs[cat] = [scoreMaterial(chosen, c, pairing), ...recs[cat]];
    }
  }

  const scheme = Object.fromEntries(
    (Object.keys(recs) as Category[]).map((cat) => [
      cat,
      { material: materialById(selections[cat]) ?? recs[cat][0]?.material, chosen: Boolean(selections[cat]) },
    ]),
  ) as Record<Category, { material?: Material; chosen: boolean }>;

  const wallMaterial = materialById(selections.wallpaper) ?? materialById(selections.paint) ?? scheme.wallpaper.material;
  const chosenTotal = (Object.keys(selections) as Category[]).reduce((sum, cat) => {
    const m = materialById(selections[cat]);
    return m ? sum + estimatedCost(m, c) : sum;
  }, 0);

  return (
    <>
      <p className={styles.back}>
        <Link href="/atelier">← Mon Atelier</Link>
      </p>
      <header className="center">
        <p className="smallcaps">La Chambre d&apos;Enfant</p>
        <h1>{row.name}</h1>
        <Summary c={c} />
      </header>

      <div className="fleuron">
        <span>❦</span>
      </div>

      {/* ---------- The client's own photos ---------- */}
      <section className={`frame ${styles.photos}`} aria-labelledby="photos-title">
        <h2 id="photos-title" className="center">
          Votre Pièce en Photo <span className="translation">show us your space</span>
        </h2>
        <p className="center" style={{ margin: "0 auto 20px" }}>
          See your chosen papers, paints, curtains and floors on a photo of <em>your own room</em>, with its own light,
          windows and furniture exactly as they are.
        </p>
        {photos.length > 0 && (
          <ul className={studioStyles.photoGrid}>
            {photos.map((p, i) => (
              <li key={p.id}>
                <Link href={`/atelier/pieces/${row.id}/photos/${p.id}`} className={studioStyles.photoCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/photos/${p.id}`} alt={`Photo ${i + 1} of ${row.name}`} />
                  <span>{p.locked ? "Dress this photo →" : "Finish outlining →"}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {photos.length < MAX_PHOTOS_PER_ROOM ? (
          <PhotoUpload roomId={row.id} />
        ) : (
          <p className="center">
            <em>This room has its {MAX_PHOTOS_PER_ROOM} photos. Delete one to add another.</em>
          </p>
        )}
      </section>

      {/* ---------- The scheme ---------- */}
      <section className={styles.scheme} aria-labelledby="scheme-title">
        <div className={styles.schemeView}>
          <div className="gilt">
            <ScaleView
              uid={`room-${row.id}`}
              wall={wallMaterial}
              fabric={scheme.fabric.material}
              flooring={scheme.flooring.material}
              ceilingM={c.ceilingM}
              wallLengthM={c.lengthM}
              windowWidthCm={c.windows > 0 ? c.windowWidthCm : 0}
              ageStage={c.ageStage}
            />
          </div>
          <p className={styles.caption}>
            One wall of your room, drawn to scale: every pattern is shown at its true size.
          </p>
        </div>

        <div className={styles.schemeBoard}>
          <h2 id="scheme-title">
            Le Projet <span className="translation">your scheme</span>
          </h2>
          <p className={styles.schemeIntro}>
            Where you haven&apos;t chosen yet, I&apos;ve suggested the piece I would choose for you. Choose your own
            below and the suggestions will rearrange themselves around it.
          </p>
          <ul className={styles.boardList}>
            {CATEGORIES.map((cat) => {
              const item = scheme[cat.id];
              if (!item.material) return null;
              return (
                <li key={cat.id}>
                  <Swatch uid={`board-${cat.id}`} spec={item.material.pattern} sizeCm={swatchSizeCm(item.material)} title={item.material.name} className={styles.boardSwatch} />
                  <span>
                    <span className={styles.boardCat}>{cat.english}</span>
                    <span className={styles.boardName}>{item.material.name}</span>
                    <span className={item.chosen ? styles.tagChosen : styles.tagSuggested}>
                      {item.chosen ? "Your choice" : "Suggested"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className={styles.total}>
            {chosenTotal > 0 ? (
              <>
                Your choices so far: about <strong>{money(chosenTotal)}</strong> in materials
                <span className="hint"> (an indicative guide, not a quote)</span>
              </>
            ) : (
              <em>Choose a material below to begin your estimate.</em>
            )}
          </p>
        </div>
      </section>

      {/* ---------- Recommendations by category ---------- */}
      {CATEGORIES.map((cat) => (
        <section key={cat.id} className={styles.category} aria-labelledby={`cat-${cat.id}`}>
          <header className={styles.categoryHeader}>
            <h2 id={`cat-${cat.id}`}>
              {cat.french}
              <span className="translation">{cat.english}</span>
            </h2>
            <Link href={`/materiaux#${cat.id}`} className={styles.libraryLink}>
              See the whole collection →
            </Link>
          </header>
          <ul className={styles.recGrid}>
            {recs[cat.id].map((r, i) => (
              <RecCard
                key={r.material.id}
                rec={r}
                c={c}
                roomId={row.id}
                chosen={selections[cat.id] === r.material.id}
                rank={i}
                hasChoice={Boolean(selections[cat.id])}
              />
            ))}
          </ul>
        </section>
      ))}

      {/* ---------- Advice ---------- */}
      <section className={`frame ${styles.advice}`} aria-labelledby="advice-title">
        <h2 id="advice-title" className="center">
          Les conseils du décorateur <span className="translation">notes for this room</span>
        </h2>
        <ul>
          {roomAdvice(c).map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        {c.keep && (
          <p className={styles.keep}>
            <strong>You&apos;d like to keep:</strong> {c.keep}. Bring a photograph or a scrap of its colour when you choose
            samples, so everything is chosen to sit happily beside it.
          </p>
        )}
      </section>

      <form action={removeRoom} className={styles.remove}>
        <input type="hidden" name="roomId" value={row.id} />
        <button type="submit" className="btn btn-quiet">
          Remove this room
        </button>
      </form>
    </>
  );
}

function Summary({ c }: { c: Consultation }) {
  const chips = [
    labelOf(AGE_STAGES, c.ageStage) + (c.sharedBy > 1 ? `, ${c.sharedBy} sharing` : ""),
    `${c.lengthM} × ${c.widthM} m (${floorArea(c).toFixed(1)} m²)`,
    `Ceiling ${c.ceilingM} m`,
    `${labelOf(ORIENTATIONS, c.orientation)}-facing, ${labelOf(LIGHT_LEVELS, c.light).toLowerCase()} light`,
    ...c.moods.map((m) => labelOf(MOODS, m)),
    ...(c.allergies ? ["Allergies"] : []),
  ];
  return (
    <ul className={styles.summary} aria-label="Your answers">
      {chips.map((chip) => (
        <li key={chip}>{chip}</li>
      ))}
    </ul>
  );
}

function RecCard({
  rec,
  c,
  roomId,
  chosen,
  rank,
  hasChoice,
}: {
  rec: Recommendation;
  c: Consultation;
  roomId: string;
  chosen: boolean;
  rank: number;
  hasChoice: boolean;
}) {
  const m = rec.material;
  const qty = quantityFor(m, c);
  const cost = estimatedCost(m, c);
  return (
    <li className={`${styles.rec} ${chosen ? styles.recChosen : ""}`}>
      {chosen ? (
        <span className={styles.ribbon}>Your choice</span>
      ) : (
        rank === 0 && !hasChoice && <span className={styles.ribbonGold}>My first choice</span>
      )}
      <Swatch uid={`rec-${m.id}`} spec={m.pattern} sizeCm={swatchSizeCm(m)} title={`${m.name} swatch`} className={styles.recSwatch} />
      <h3 className={styles.recName}>
        {m.name}
        <span className="translation">{m.english}</span>
      </h3>
      <p className={styles.recDesc}>{m.description}</p>

      {rec.reasons.length > 0 && (
        <ul className={styles.reasons} aria-label="Why I suggest it">
          {rec.reasons.slice(0, 3).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {rec.cautions.length > 0 && (
        <ul className={styles.cautions} aria-label="Things to consider">
          {rec.cautions.slice(0, 2).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      <blockquote className={styles.note}>“{m.note}”</blockquote>

      <dl className={styles.facts}>
        <dt>You&apos;ll need</dt>
        <dd>
          {qty.amount} {qty.unit}
          <span className={styles.factDetail}>{qty.detail}</span>
        </dd>
        <dt>Indicative cost</dt>
        <dd>about {money(cost)}</dd>
      </dl>

      <form action={toggleSelection}>
        <input type="hidden" name="roomId" value={roomId} />
        <input type="hidden" name="category" value={m.category} />
        <input type="hidden" name="materialId" value={m.id} />
        <button type="submit" className={chosen ? "btn" : "btn btn-seal"} style={{ width: "100%" }}>
          {chosen ? "Chosen ✓ (tap to undo)" : "Choose this"}
        </button>
      </form>
    </li>
  );
}
