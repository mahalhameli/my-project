import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { listRooms } from "@/lib/db";
import { ROOM_LIMIT, planInfo } from "@/lib/plans";
import { ROOMS } from "@/lib/rooms";
import { parseSelections } from "@/lib/room-data";
import { materialById } from "@/lib/materials";
import { Swatch } from "@/components/Swatch";
import styles from "./atelier.module.css";

export const metadata: Metadata = { title: "Mon Atelier" };

/** Rooms whose consultation is open. The rest follow in later phases. */
const OPEN_ROOMS: Record<string, string> = {
  "chambre-enfant": "/atelier/consultation/chambre-enfant",
};

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
  const rooms = await listRooms(user.id);
  const limit = ROOM_LIMIT[user.plan];
  const atLimit = rooms.length >= limit;

  return (
    <>
      <header className="center">
        <p className="smallcaps">Mon Atelier</p>
        <h1>
          Bonjour, <span className="script">{firstName}</span>
        </h1>
        <p className="lede">{rooms.length ? "Welcome back to your rooms." : "Which room shall we begin with today?"}</p>
        <p className={styles.plan}>
          Your membership: <strong>{plan.french}</strong> ({plan.english})
          {Number.isFinite(limit) ? ` · ${rooms.length} of ${limit} room used` : ""} ·{" "}
          <Link href="/abonnements">view memberships</Link>
        </p>
      </header>

      {rooms.length > 0 && (
        <>
          <div className="fleuron">
            <span>❦</span>
          </div>
          <h2 className="center">
            Vos Pièces <span className="translation">your rooms</span>
          </h2>
          <ul className={styles.myRooms}>
            {rooms.map((room) => {
              const selections = parseSelections(room.selections);
              const chosen = Object.values(selections)
                .map((id) => materialById(id))
                .filter((m) => m !== undefined);
              return (
                <li key={room.id}>
                  <Link href={`/atelier/pieces/${room.id}`} className={`frame ${styles.myRoom}`}>
                    <span className={styles.myRoomName}>{room.name}</span>
                    <span className="translation" style={{ fontSize: "0.95rem" }}>
                      Children&apos;s bedroom
                    </span>
                    <span className={styles.myRoomSwatches}>
                      {chosen.length ? (
                        chosen.map((m) => (
                          <Swatch key={m.id} uid={`${room.id}-${m.id}`} spec={m.pattern} sizeCm={m.category === "flooring" ? 60 : 24} title={m.name} className={styles.miniSwatch} />
                        ))
                      ) : (
                        <em>No materials chosen yet</em>
                      )}
                    </span>
                    <span className={styles.open}>Open the room →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="fleuron">
        <span>❦</span>
      </div>
      <h2 className="center">
        Begin a room <span className="translation">start a new consultation</span>
      </h2>

      <ul className={styles.grid}>
        {ROOMS.map(({ slug, french, english, Illustration }) => {
          const href = OPEN_ROOMS[slug];
          return (
            <li key={slug} className={styles.card}>
              <div className={styles.plate}>
                <Illustration />
              </div>
              <h3 className={styles.title}>
                {french}
                <span className="translation">{english}</span>
              </h3>
              {href ? (
                atLimit ? (
                  <Link href="/abonnements" className={styles.soon}>
                    Become a Membre for more rooms
                  </Link>
                ) : (
                  <Link href={href} className="btn btn-seal">
                    Begin the consultation
                  </Link>
                )
              ) : (
                <span className={styles.soon}>The consultation opens soon</span>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
