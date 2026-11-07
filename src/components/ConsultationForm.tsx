"use client";

import { useActionState, useState } from "react";
import type { ConsultationFormState } from "@/app/actions/rooms";
import {
  AGE_STAGES,
  BUDGETS,
  DEFAULT_CONSULTATION,
  LIGHT_LEVELS,
  MAX_MOODS,
  MOODS,
  ORIENTATIONS,
  TIMES_OF_USE,
  labelOf,
  validateConsultation,
  type Consultation,
} from "@/lib/consultation";
import styles from "./ConsultationForm.module.css";

type NumericKey = "sharedBy" | "lengthM" | "widthM" | "ceilingM" | "windows" | "windowWidthCm" | "doors";
type Draft = Omit<Consultation, NumericKey> & Record<NumericKey, string>;

const toDraft = (c: Consultation): Draft => ({
  ...c,
  sharedBy: String(c.sharedBy),
  lengthM: String(c.lengthM),
  widthM: String(c.widthM),
  ceilingM: String(c.ceilingM),
  windows: String(c.windows),
  windowWidthCm: String(c.windowWidthCm),
  doors: String(c.doors),
});

const fromDraft = (d: Draft) => ({
  ...d,
  sharedBy: Number(d.sharedBy),
  lengthM: Number(d.lengthM),
  widthM: Number(d.widthM),
  ceilingM: Number(d.ceilingM),
  windows: Number(d.windows),
  windowWidthCm: Number(d.windowWidthCm),
  doors: Number(d.doors),
});

const STEPS = [
  { numeral: "I", french: "L'Enfant", english: "The child" },
  { numeral: "II", french: "La Pièce", english: "The room" },
  { numeral: "III", french: "La Lumière", english: "The light" },
  { numeral: "IV", french: "L'Atmosphère", english: "The feeling" },
  { numeral: "V", french: "Le Budget", english: "Budget & keepsakes" },
];

/** Which step's questions an error message belongs to, so we can stop on that step. */
function stepError(step: number, d: Draft): string | null {
  const r = validateConsultation(fromDraft(d));
  if (r.ok) return null;
  const owners: [number, RegExp][] = [
    [0, /age|children share/i],
    [1, /length|width|ceiling|windows|doors|window width/i],
    [2, /faces|light|used most/i],
    [3, /mood/i],
    [4, /budget/i],
  ];
  for (const [s, re] of owners) {
    if (s <= step && re.test(r.error)) return r.error;
  }
  return null;
}

export function ConsultationForm({
  action,
}: {
  action: (state: ConsultationFormState, formData: FormData) => Promise<ConsultationFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(() => toDraft(DEFAULT_CONSULTATION));
  const [localError, setLocalError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setD((prev) => ({ ...prev, [key]: value }));
    setLocalError(null);
  };

  const toggleIn = <K extends "moods" | "timesOfUse">(key: K, id: Draft[K][number], max?: number) => {
    setD((prev) => {
      const list = prev[key] as string[];
      if (list.includes(id)) return { ...prev, [key]: list.filter((x) => x !== id) };
      if (max && list.length >= max) return prev;
      return { ...prev, [key]: [...list, id] };
    });
    setLocalError(null);
  };

  const next = () => {
    const err = stepError(step, d);
    if (err) return setLocalError(err);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setLocalError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const area = Number(d.lengthM) * Number(d.widthM);
  const error = localError ?? state.error;
  const last = step === STEPS.length - 1;

  return (
    <form
      action={formAction}
      className={styles.form}
      onSubmit={(e) => {
        const err = stepError(STEPS.length - 1, d);
        if (err) {
          e.preventDefault();
          setLocalError(err);
        }
      }}
    >
      <input type="hidden" name="payload" value={JSON.stringify(fromDraft(d))} />

      {/* Progress */}
      <ol className={styles.progress} aria-label="Consultation steps">
        {STEPS.map((s, i) => (
          <li
            key={s.numeral}
            className={i === step ? styles.current : i < step ? styles.done : undefined}
            aria-current={i === step ? "step" : undefined}
          >
            <span className={styles.progressNumeral}>{s.numeral}</span>
            <span className={styles.progressLabel}>{s.english}</span>
          </li>
        ))}
      </ol>

      <fieldset className={`frame ${styles.step}`}>
        <legend className={styles.legend}>
          <span className={styles.legendNumeral}>{STEPS[step].numeral}</span>
          {STEPS[step].french}
          <span className="translation">{STEPS[step].english}</span>
        </legend>

        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}

        {step === 0 && (
          <>
            <div className="field">
              <label htmlFor="roomName">What shall we call this room?</label>
              <input
                id="roomName"
                className="input"
                placeholder="e.g. Rose's room"
                value={d.roomName}
                maxLength={60}
                onChange={(e) => set("roomName", e.target.value)}
              />
              <span className="hint">Optional, just so you can find it again.</span>
            </div>

            <Question label="How old is the child?">
              <div className={styles.cards}>
                {AGE_STAGES.map((a) => (
                  <Choice key={a.id} name="ageStage" checked={d.ageStage === a.id} onChange={() => set("ageStage", a.id)} title={a.label} detail={a.detail} />
                ))}
              </div>
            </Question>

            <Question label="How many children share the room?">
              <div className={styles.chips}>
                {["1", "2", "3", "4"].map((n) => (
                  <Chip key={n} type="radio" name="sharedBy" checked={d.sharedBy === n} onChange={() => set("sharedBy", n)} label={n === "1" ? "Just one" : n} />
                ))}
              </div>
            </Question>

            <Question label="Does anyone in the family have allergies or asthma?">
              <div className={styles.chips}>
                <Chip type="radio" name="allergies" checked={d.allergies} onChange={() => set("allergies", true)} label="Yes" />
                <Chip type="radio" name="allergies" checked={!d.allergies} onChange={() => set("allergies", false)} label="No" />
              </div>
              <span className="hint">We will favour materials that are easy to keep dust-free.</span>
            </Question>
          </>
        )}

        {step === 1 && (
          <>
            <p className={styles.help}>
              A tape measure is all you need. Measure wall to wall, and don&apos;t worry about being exact to the centimetre.
            </p>
            <div className={styles.grid3}>
              <NumberField id="lengthM" label="Length" unit="m" step="0.05" value={d.lengthM} onChange={(v) => set("lengthM", v)} />
              <NumberField id="widthM" label="Width" unit="m" step="0.05" value={d.widthM} onChange={(v) => set("widthM", v)} />
              <NumberField id="ceilingM" label="Ceiling height" unit="m" step="0.05" value={d.ceilingM} onChange={(v) => set("ceilingM", v)} />
            </div>
            {Number.isFinite(area) && area > 0 && (
              <p className={styles.computed}>
                A floor of about <strong>{area.toFixed(1)} m²</strong>
                {area < 9 ? ", a cosy room." : area > 16 ? ", a generous room." : "."}
              </p>
            )}
            <div className={styles.grid3}>
              <NumberField id="windows" label="Windows" step="1" value={d.windows} onChange={(v) => set("windows", v)} />
              {d.windows !== "0" && (
                <NumberField id="windowWidthCm" label="Width of the main window" unit="cm" step="5" value={d.windowWidthCm} onChange={(v) => set("windowWidthCm", v)} />
              )}
              <NumberField id="doors" label="Doors" step="1" value={d.doors} onChange={(v) => set("doors", v)} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Question label="Which way does the main window face?">
              <div className={styles.cards}>
                {ORIENTATIONS.map((o) => (
                  <Choice key={o.id} name="orientation" checked={d.orientation === o.id} onChange={() => set("orientation", o.id)} title={o.label} detail={o.detail} />
                ))}
              </div>
              <span className="hint">Not sure? A compass app on your phone, held at the window, will tell you.</span>
            </Question>

            <Question label="How much natural light does the room have?">
              <div className={styles.chips}>
                {LIGHT_LEVELS.map((l) => (
                  <Chip key={l.id} type="radio" name="light" checked={d.light === l.id} onChange={() => set("light", l.id)} label={l.label} />
                ))}
              </div>
            </Question>

            <Question label="When is the room used most?" hint="Choose as many as you like.">
              <div className={styles.chips}>
                {TIMES_OF_USE.map((t) => (
                  <Chip key={t.id} type="checkbox" name="timesOfUse" checked={d.timesOfUse.includes(t.id)} onChange={() => toggleIn("timesOfUse", t.id)} label={t.label} />
                ))}
              </div>
            </Question>
          </>
        )}

        {step === 3 && (
          <Question label="How should the room feel?" hint={`Choose up to ${MAX_MOODS} words. ${d.moods.length} of ${MAX_MOODS} chosen.`}>
            <div className={styles.chips}>
              {MOODS.map((m) => (
                <Chip
                  key={m.id}
                  type="checkbox"
                  name="moods"
                  checked={d.moods.includes(m.id)}
                  disabled={!d.moods.includes(m.id) && d.moods.length >= MAX_MOODS}
                  onChange={() => toggleIn("moods", m.id, MAX_MOODS)}
                  label={m.label}
                />
              ))}
            </div>
          </Question>
        )}

        {step === 4 && (
          <>
            <Question label="What kind of budget do you have in mind?">
              <div className={styles.cards}>
                {BUDGETS.map((b) => (
                  <Choice key={b.id} name="budget" checked={d.budget === b.id} onChange={() => set("budget", b.id)} title={b.label} detail={b.detail} />
                ))}
              </div>
            </Question>

            <div className="field">
              <label htmlFor="keep">Is there anything you would like to keep?</label>
              <textarea
                id="keep"
                className="input"
                rows={3}
                maxLength={500}
                placeholder="e.g. Grandmother's painted chest, the oak floor"
                value={d.keep}
                onChange={(e) => set("keep", e.target.value)}
              />
            </div>

            <div className={styles.review}>
              <h3>Your answers</h3>
              <dl>
                <dt>Child</dt>
                <dd>
                  {labelOf(AGE_STAGES, d.ageStage)}
                  {d.sharedBy !== "1" ? `, ${d.sharedBy} sharing` : ""}
                  {d.allergies ? ", allergies" : ""}
                </dd>
                <dt>Room</dt>
                <dd>
                  {d.lengthM} × {d.widthM} m, ceiling {d.ceilingM} m
                </dd>
                <dt>Light</dt>
                <dd>
                  {labelOf(ORIENTATIONS, d.orientation)}-facing, {labelOf(LIGHT_LEVELS, d.light).toLowerCase()}
                </dd>
                <dt>Feeling</dt>
                <dd>{d.moods.map((m) => labelOf(MOODS, m)).join(", ") || "Not chosen yet"}</dd>
              </dl>
            </div>
          </>
        )}

        <div className={styles.actions}>
          {step > 0 ? (
            <button type="button" className="btn btn-quiet" onClick={back}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          {last ? (
            <button key="submit" type="submit" className="btn btn-seal" disabled={pending}>
              {pending ? "Preparing your scheme…" : "See my recommendations"}
            </button>
          ) : (
            <button key="next" type="button" className="btn btn-seal" onClick={next}>
              Continue →
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}

function Question({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className={styles.question} role="group" aria-label={label}>
      <p className={styles.questionLabel}>{label}</p>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

function Choice({
  name,
  checked,
  onChange,
  title,
  detail,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail?: string;
}) {
  return (
    <label className={`${styles.card} ${checked ? styles.cardChecked : ""}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="visually-hidden" />
      <span className={styles.cardTitle}>{title}</span>
      {detail && <span className={styles.cardDetail}>{detail}</span>}
    </label>
  );
}

function Chip({
  type,
  name,
  checked,
  disabled,
  onChange,
  label,
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className={`${styles.chip} ${checked ? styles.chipChecked : ""} ${disabled ? styles.chipDisabled : ""}`}>
      <input type={type} name={`ui-${name}`} checked={checked} disabled={disabled} onChange={onChange} className="visually-hidden" />
      {label}
    </label>
  );
}

function NumberField({
  id,
  label,
  unit,
  step,
  value,
  onChange,
}: {
  id: string;
  label: string;
  unit?: string;
  step: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={styles.unitWrap}>
        <input id={id} className="input" type="number" inputMode="decimal" min="0" step={step} value={value} onChange={(e) => onChange(e.target.value)} />
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
    </div>
  );
}
