import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createChildrenRoom } from "@/app/actions/rooms";
import { ConsultationForm } from "@/components/ConsultationForm";
import { requireUser } from "@/lib/auth";
import { countRooms } from "@/lib/db";
import { ROOM_LIMIT, planInfo } from "@/lib/plans";

export const metadata: Metadata = { title: "The Consultation · Children's Bedroom" };

export default function ConsultationPage() {
  return (
    <section className="container" style={{ padding: "clamp(40px, 6vw, 80px) var(--gutter)" }}>
      <header className="center" style={{ marginBottom: 32 }}>
        <p className="smallcaps">La Consultation</p>
        <h1>
          La Chambre d&apos;Enfant
          <span className="translation">a consultation for a child&apos;s bedroom</span>
        </h1>
        <p className="lede">
          Five short steps. Answer as best you can. There are no wrong answers, and it takes about five minutes.
        </p>
      </header>
      <Suspense fallback={<p className="center lede">One moment…</p>}>
        <Gate />
      </Suspense>
    </section>
  );
}

async function Gate() {
  const user = await requireUser();
  const limit = ROOM_LIMIT[user.plan];
  if ((await countRooms(user.id)) >= limit) {
    return (
      <div className="frame center" style={{ maxWidth: 620, margin: "0 auto" }}>
        <h2>Your room is waiting</h2>
        <p>
          Your {planInfo(user.plan).french} membership includes {limit} room, and you have already begun one. You can
          return to it, remove it to start afresh, or become a Membre to design the whole house.
        </p>
        <p style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/atelier" className="btn btn-seal">
            Return to Mon Atelier
          </Link>
          <Link href="/abonnements" className="btn">
            View memberships
          </Link>
        </p>
      </div>
    );
  }
  return <ConsultationForm action={createChildrenRoom} />;
}
