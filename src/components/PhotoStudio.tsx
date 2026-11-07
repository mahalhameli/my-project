"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { removeVersion, saveOutlines, saveVersion } from "@/app/actions/photos";
import { MATERIALS, type Category, type Material } from "@/lib/materials";
import {
  REGION_INFO,
  isConvexQuad,
  type Layers,
  type Point,
  type Region,
  type RegionKind,
} from "@/lib/photo-model";
import { RoomRenderer, type PatternTexture } from "@/lib/render-room";
import { Swatch, TileSvg, tileFor } from "./Swatch";
import styles from "./PhotoStudio.module.css";

export type StudioVersion = { id: string; name: string; layers: Layers; thumbnail: string };

type Defaults = {
  lengthCm: number;
  widthCm: number;
  ceilingCm: number;
  windowWidthCm: number;
};

type Props = {
  photoId: string;
  photoUrl: string;
  width: number;
  height: number;
  initialRegions: Region[];
  locked: boolean;
  versions: StudioVersion[];
  initialLayers: Layers;
  recommended: Partial<Record<Category, string[]>>;
  defaults: Defaults;
};

const KIND_ORDER: RegionKind[] = ["wall", "floor", "window", "door", "keep"];
const KIND_COLOUR: Record<RegionKind, string> = {
  wall: "#b46f69",
  floor: "#c99a4b",
  window: "#5f8580",
  door: "#64704f",
  keep: "#6e6458",
};

const byId = new Map(MATERIALS.map((m) => [m.id, m]));

function newId(kind: RegionKind) {
  return `${kind}-${Math.random().toString(36).slice(2, 8)}`;
}

function pxPerCmFor(m: Material) {
  const t = tileFor(m.pattern);
  return Math.min(64, Math.max(4, 512 / Math.max(t.w, t.h)));
}

export function PhotoStudio(props: Props) {
  const { photoId, photoUrl, width, height, defaults } = props;
  const [regions, setRegions] = useState<Region[]>(props.initialRegions);
  const [locked, setLocked] = useState(props.locked);
  const [drawing, setDrawing] = useState<{ kind: RegionKind; points: Point[] } | null>(null);
  const [drag, setDrag] = useState<{ id: string; index: number } | null>(null);
  const [layers, setLayers] = useState<Layers>(props.initialLayers);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [split, setSplit] = useState(100);
  const [versionName, setVersionName] = useState("");
  const [compare, setCompare] = useState<StudioVersion | null>(null);
  const [liveThumb, setLiveThumb] = useState<string>("");

  /* ---------------- Outlines ---------------- */

  const svgRef = useRef<SVGSVGElement>(null);
  const toPoint = (e: React.PointerEvent): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: Math.min(1, Math.max(0, p.x / width)), y: Math.min(1, Math.max(0, p.y / height)) };
  };

  const countOf = (kind: RegionKind) => regions.filter((r) => r.kind === kind).length;

  const finishRegion = (kind: RegionKind, points: Point[]) => {
    const n = countOf(kind) + 1;
    const region: Region = {
      id: newId(kind),
      kind,
      points,
      label:
        kind === "floor" ? "The floor" : kind === "keep" ? `Furniture ${n}` : `${REGION_INFO[kind].english.replace(/^An? /, "").replace(/^\w/, (c) => c.toUpperCase())} ${n}`,
    };
    if (kind === "wall") {
      region.widthCm = n % 2 === 1 ? defaults.lengthCm : defaults.widthCm;
      region.heightCm = defaults.ceilingCm;
    } else if (kind === "floor") {
      region.widthCm = defaults.widthCm;
      region.heightCm = defaults.lengthCm;
    } else if (kind === "window") {
      region.widthCm = defaults.windowWidthCm;
    }
    setRegions((rs) => [...rs, region]);
    setDrawing(null);
    if (REGION_INFO[kind].corners && !isConvexQuad(points)) {
      setMessage({ kind: "error", text: "Those corners cross over. Drag the round handles until the outline sits neatly." });
    }
  };

  const onStagePointerDown = (e: React.PointerEvent) => {
    if (!drawing || locked) return;
    const p = toPoint(e);
    if (!p) return;
    const points = [...drawing.points, p];
    if (REGION_INFO[drawing.kind].corners && points.length === 4) finishRegion(drawing.kind, points);
    else setDrawing({ ...drawing, points });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = toPoint(e);
    if (!p) return;
    setRegions((rs) =>
      rs.map((r) => (r.id === drag.id ? { ...r, points: r.points.map((q, i) => (i === drag.index ? p : q)) } : r)),
    );
  };

  const updateRegion = (id: string, patch: Partial<Region>) =>
    setRegions((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const persistOutlines = (lock: boolean) => {
    setMessage(null);
    startTransition(async () => {
      const res = await saveOutlines(photoId, JSON.stringify(regions), lock);
      if (!res.ok) setMessage({ kind: "error", text: res.error });
      else {
        setLocked(lock);
        setMessage({ kind: "ok", text: lock ? "Your outlines are locked. Now let's dress the room." : "Outlines saved." });
        if (lock) {
          // Start every new wall with the first wall's material.
          setLayers((l) => {
            const first = Object.values(l.walls).find(Boolean) ?? null;
            const walls: Record<string, string | null> = {};
            for (const r of regions) if (r.kind === "wall") walls[r.id] = r.id in l.walls ? l.walls[r.id] : first;
            return { ...l, walls };
          });
        }
      }
    });
  };

  /* ---------------- Dressing the room ---------------- */

  const neededIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(layers.walls).forEach((id) => id && ids.add(id));
    if (layers.floor) ids.add(layers.floor);
    if (layers.curtains) ids.add(layers.curtains);
    return [...ids];
  }, [layers]);

  const tileEls = useRef(new Map<string, SVGSVGElement>());
  const [textures, setTextures] = useState(new Map<string, PatternTexture>());

  useEffect(() => {
    let cancelled = false;
    const missing = neededIds.filter((id) => !textures.has(id));
    if (!missing.length) return;
    Promise.all(
      missing.map(
        (id) =>
          new Promise<[string, PatternTexture] | null>((resolve) => {
            const el = tileEls.current.get(id);
            const m = byId.get(id);
            if (!el || !m) return resolve(null);
            const t = tileFor(m.pattern);
            const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(el)], { type: "image/svg+xml" }));
            const img = new Image();
            img.onload = () => {
              URL.revokeObjectURL(url);
              resolve([id, { image: img, wCm: t.w, hCm: t.h }]);
            };
            img.onerror = () => resolve(null);
            img.src = url;
          }),
      ),
    ).then((loaded) => {
      if (cancelled) return;
      setTextures((prev) => {
        const next = new Map(prev);
        for (const entry of loaded) if (entry) next.set(entry[0], entry[1]);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [neededIds, textures]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RoomRenderer | null>(null);
  const [photoEl, setPhotoEl] = useState<HTMLImageElement | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setPhotoEl(img);
    img.src = photoUrl;
  }, [photoUrl]);

  const draw = useCallback(() => {
    if (!locked || !photoEl || !canvasRef.current) return;
    try {
      if (!rendererRef.current) rendererRef.current = new RoomRenderer(canvasRef.current, photoEl);
      rendererRef.current.render({ regions, layers, materials: byId, textures, ceilingCm: defaults.ceilingCm });
      if (errorRef.current) errorRef.current.hidden = true;
    } catch (e) {
      // Shown without re-rendering, so a failing preview can't loop.
      if (errorRef.current) {
        errorRef.current.textContent = e instanceof Error ? e.message : "The preview could not be drawn.";
        errorRef.current.hidden = false;
      }
    }
  }, [locked, photoEl, regions, layers, textures, defaults.ceilingCm]);

  useEffect(() => {
    if (!locked) rendererRef.current = null; // the canvas is removed while editing outlines
    draw();
  }, [draw, locked]);

  const setWall = (id: string, materialId: string | null) => setLayers((l) => ({ ...l, walls: { ...l.walls, [id]: materialId } }));

  const saveThisVersion = () => {
    if (!rendererRef.current) return;
    draw();
    const thumb = rendererRef.current.thumbnail();
    setMessage(null);
    startTransition(async () => {
      const res = await saveVersion(photoId, JSON.stringify(layers), versionName, thumb);
      if (!res.ok) setMessage({ kind: "error", text: res.error });
      else {
        setVersionName("");
        setMessage({ kind: "ok", text: "Saved. This is now your room's scheme too." });
      }
    });
  };

  const walls = regions.filter((r) => r.kind === "wall");
  const hasFloor = regions.some((r) => r.kind === "floor");
  const hasWindow = regions.some((r) => r.kind === "window");

  /* ---------------- Render ---------------- */

  const hint = drawing
    ? REGION_INFO[drawing.kind].corners
      ? REGION_INFO[drawing.kind].hint[drawing.points.length]
      : REGION_INFO[drawing.kind].hint[0]
    : null;
  const handleR = Math.max(width, height) * 0.012;

  return (
    <div className={styles.studio}>
      {/* Hidden: one repeat of each pattern in use, turned into textures */}
      <div aria-hidden="true" className={styles.hiddenTiles}>
        {neededIds.map((id) => {
          const m = byId.get(id);
          return m ? (
            <TileSvg
              key={id}
              spec={m.pattern}
              pxPerCm={pxPerCmFor(m)}
              svgRef={(el) => {
                if (el) tileEls.current.set(id, el);
                else tileEls.current.delete(id);
              }}
            />
          ) : null;
        })}
      </div>

      <div className={styles.stageWrap}>
        <div className={styles.stage} style={{ aspectRatio: `${width} / ${height}` }}>
          {locked ? (
            <>
              <canvas ref={canvasRef} className={styles.canvas} aria-label="Your room, dressed in your chosen scheme" role="img" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Your room as it is today"
                className={styles.before}
                style={{ clipPath: `inset(0 ${split}% 0 0)` }}
              />
              {split < 100 && <span className={styles.splitLine} style={{ left: `${100 - split}%` }} />}
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Your room" className={styles.photo} />
          )}

          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className={`${styles.overlay} ${drawing ? styles.overlayDrawing : ""}`}
            onPointerDown={onStagePointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => setDrag(null)}
            onPointerCancel={() => setDrag(null)}
            style={{ pointerEvents: locked ? "none" : "auto" }}
          >
            {!locked &&
              regions.map((r) => (
                <g key={r.id}>
                  <polygon
                    points={r.points.map((p) => `${p.x * width},${p.y * height}`).join(" ")}
                    fill={KIND_COLOUR[r.kind]}
                    fillOpacity={0.22}
                    stroke={KIND_COLOUR[r.kind]}
                    strokeWidth={handleR * 0.35}
                  />
                  <text
                    x={(r.points.reduce((s, p) => s + p.x, 0) / r.points.length) * width}
                    y={(r.points.reduce((s, p) => s + p.y, 0) / r.points.length) * height}
                    fontSize={handleR * 2.4}
                    textAnchor="middle"
                    className={styles.regionLabel}
                  >
                    {r.label}
                  </text>
                  {r.points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x * width}
                      cy={p.y * height}
                      r={handleR}
                      fill="#fffdf7"
                      stroke={KIND_COLOUR[r.kind]}
                      strokeWidth={handleR * 0.4}
                      className={styles.handle}
                      onPointerDown={(e) => {
                        if (drawing) return;
                        e.stopPropagation();
                        (e.currentTarget as Element).setPointerCapture(e.pointerId);
                        setDrag({ id: r.id, index: i });
                      }}
                    />
                  ))}
                </g>
              ))}
            {drawing && (
              <g>
                {drawing.points.length > 1 && (
                  <polyline
                    points={drawing.points.map((p) => `${p.x * width},${p.y * height}`).join(" ")}
                    fill="none"
                    stroke={KIND_COLOUR[drawing.kind]}
                    strokeWidth={handleR * 0.35}
                    strokeDasharray={`${handleR} ${handleR * 0.6}`}
                  />
                )}
                {drawing.points.map((p, i) => (
                  <circle key={i} cx={p.x * width} cy={p.y * height} r={handleR} fill={KIND_COLOUR[drawing.kind]} />
                ))}
              </g>
            )}
          </svg>
        </div>

        {locked && (
          <div className={styles.slider}>
            <label htmlFor="split">Before and after</label>
            <input
              id="split"
              type="range"
              min={0}
              max={100}
              value={100 - split}
              onChange={(e) => setSplit(100 - Number(e.target.value))}
              aria-valuetext={split === 100 ? "Showing your new scheme" : `${100 - split}% shows the room as it is`}
            />
            <span className={styles.sliderEnds}>
              <span>As it is</span>
              <span>Your new scheme</span>
            </span>
          </div>
        )}
        <p ref={errorRef} className="notice" role="alert" hidden />
      </div>

      <aside className={styles.panel}>
        {message && (
          <p className={message.kind === "error" ? "notice" : styles.ok} role={message.kind === "error" ? "alert" : "status"}>
            {message.text}
          </p>
        )}

        {!locked ? (
          <>
            <h2>
              La Mise au Point <span className="translation">outline your room, once</span>
            </h2>
            <p className={styles.help}>
              Mark the walls and floor you&apos;d like to dress, then the windows, doors and any furniture you&apos;re
              keeping. Those are always protected, so nothing is ever painted over them.
            </p>

            {drawing ? (
              <div className={styles.drawing}>
                <p className={styles.hint} aria-live="polite">
                  <strong>{REGION_INFO[drawing.kind].english}:</strong> {hint}
                </p>
                <div className={styles.row}>
                  {!REGION_INFO[drawing.kind].corners && (
                    <button
                      type="button"
                      className="btn btn-seal"
                      disabled={drawing.points.length < 3}
                      onClick={() => finishRegion(drawing.kind, drawing.points)}
                    >
                      Finish
                    </button>
                  )}
                  <button type="button" className="btn btn-quiet" onClick={() => setDrawing(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.addRow}>
                {KIND_ORDER.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={styles.addBtn}
                    style={{ borderColor: KIND_COLOUR[k] }}
                    disabled={k === "floor" && hasFloor}
                    onClick={() => {
                      setMessage(null);
                      setDrawing({ kind: k, points: [] });
                    }}
                  >
                    <span className={styles.dot} style={{ background: KIND_COLOUR[k] }} />
                    {REGION_INFO[k].english}
                  </button>
                ))}
              </div>
            )}

            {regions.length > 0 && (
              <ul className={styles.regionList}>
                {regions.map((r) => (
                  <li key={r.id}>
                    <div className={styles.regionHead}>
                      <span className={styles.dot} style={{ background: KIND_COLOUR[r.kind] }} />
                      <input
                        className={`input ${styles.small}`}
                        aria-label="Name"
                        value={r.label}
                        maxLength={40}
                        onChange={(e) => updateRegion(r.id, { label: e.target.value })}
                      />
                      <button
                        type="button"
                        className={styles.remove}
                        aria-label={`Remove ${r.label}`}
                        onClick={() => setRegions((rs) => rs.filter((x) => x.id !== r.id))}
                      >
                        ×
                      </button>
                    </div>
                    {(r.kind === "wall" || r.kind === "floor" || r.kind === "window") && (
                      <div className={styles.dims}>
                        <label>
                          {r.kind === "window" ? "Window width" : "Width you can see"}
                          <span className={styles.unitWrap}>
                            <input
                              className={`input ${styles.small}`}
                              type="number"
                              min={20}
                              value={r.widthCm ?? ""}
                              onChange={(e) => updateRegion(r.id, { widthCm: Number(e.target.value) })}
                            />
                            cm
                          </span>
                        </label>
                        {r.kind !== "window" && (
                          <label>
                            {r.kind === "wall" ? "Height" : "Depth you can see"}
                            <span className={styles.unitWrap}>
                              <input
                                className={`input ${styles.small}`}
                                type="number"
                                min={20}
                                value={r.heightCm ?? ""}
                                onChange={(e) => updateRegion(r.id, { heightCm: Number(e.target.value) })}
                              />
                              cm
                            </span>
                          </label>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <p className={styles.help}>
              <em>Measurements set the true size of every pattern. Your Consultation&apos;s answers are filled in to begin with.</em>
            </p>
            <div className={styles.row}>
              <button type="button" className="btn btn-seal" disabled={pending || !!drawing} onClick={() => persistOutlines(true)}>
                {pending ? "Saving…" : "Lock the outlines"}
              </button>
              <button type="button" className="btn" disabled={pending || !!drawing} onClick={() => persistOutlines(false)}>
                Save for later
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>
              Habiller la Pièce <span className="translation">dress your room</span>
            </h2>
            <p className={styles.help}>
              Only what you change, changes. Your windows, doors and furniture stay exactly as they are.
            </p>

            {walls.length > 0 && (
              <section className={styles.layer}>
                <h3>Walls</h3>
                {walls.map((w, i) => (
                  <div key={w.id} className={styles.layerRow}>
                    <span className={styles.layerName}>{w.label}</span>
                    <MaterialChooser
                      categories={["wallpaper", "paint"]}
                      value={layers.walls[w.id] ?? null}
                      recommended={[...(props.recommended.wallpaper ?? []), ...(props.recommended.paint ?? [])]}
                      noneLabel="As it is"
                      onChange={(id) => setWall(w.id, id)}
                    />
                    {i === 0 && walls.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-quiet"
                        onClick={() =>
                          setLayers((l) => ({
                            ...l,
                            walls: Object.fromEntries(walls.map((x) => [x.id, l.walls[w.id] ?? null])),
                          }))
                        }
                      >
                        Use on every wall
                      </button>
                    )}
                  </div>
                ))}
              </section>
            )}

            {hasFloor && (
              <section className={styles.layer}>
                <h3>Floor</h3>
                <MaterialChooser
                  categories={["flooring"]}
                  value={layers.floor}
                  recommended={props.recommended.flooring ?? []}
                  noneLabel="As it is"
                  onChange={(id) => setLayers((l) => ({ ...l, floor: id }))}
                />
              </section>
            )}

            {hasWindow && (
              <section className={styles.layer}>
                <h3>Curtains</h3>
                <MaterialChooser
                  categories={["fabric"]}
                  value={layers.curtains}
                  recommended={props.recommended.fabric ?? []}
                  noneLabel="No curtains"
                  onChange={(id) => setLayers((l) => ({ ...l, curtains: id }))}
                />
              </section>
            )}

            <section className={styles.layer}>
              <h3>Save this look</h3>
              <div className={styles.row}>
                <input
                  className="input"
                  placeholder="e.g. Toile with rose curtains"
                  value={versionName}
                  maxLength={60}
                  onChange={(e) => setVersionName(e.target.value)}
                  aria-label="Name for this version"
                />
                <button type="button" className="btn btn-seal" disabled={pending} onClick={saveThisVersion}>
                  {pending ? "Saving…" : "Save version"}
                </button>
              </div>
            </section>

            {props.versions.length > 0 && (
              <section className={styles.layer}>
                <h3>Your versions</h3>
                <ul className={styles.versions}>
                  {props.versions.map((v) => (
                    <li key={v.id}>
                      {v.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.thumbnail} alt={`Version: ${v.name}`} />
                      ) : (
                        <span className={styles.noThumb} />
                      )}
                      <span className={styles.versionName}>{v.name}</span>
                      <span className={styles.row}>
                        <button type="button" className="btn" onClick={() => setLayers(v.layers)}>
                          Show
                        </button>
                        <button
                          type="button"
                          className="btn btn-quiet"
                          onClick={() => {
                            setLiveThumb(rendererRef.current?.thumbnail(720) ?? "");
                            setCompare(v);
                          }}
                        >
                          Compare
                        </button>
                        <button
                          type="button"
                          className={styles.remove}
                          aria-label={`Delete ${v.name}`}
                          onClick={() => startTransition(() => removeVersion(v.id))}
                        >
                          ×
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => {
                if (window.confirm("Adjust the outlines? Your saved versions will follow the new outlines.")) persistOutlines(false);
              }}
            >
              Adjust the outlines
            </button>
          </>
        )}
      </aside>

      {compare && (
        <div className={styles.compare} role="dialog" aria-label="Compare versions">
          <div className={styles.compareInner}>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={compare.thumbnail} alt={`Version: ${compare.name}`} />
              <figcaption>{compare.name}</figcaption>
            </figure>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {liveThumb && <img src={liveThumb} alt="What you see now" />}
              <figcaption>What you see now</figcaption>
            </figure>
            <button type="button" className="btn" onClick={() => setCompare(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialChooser({
  categories,
  value,
  recommended,
  noneLabel,
  onChange,
}: {
  categories: Category[];
  value: string | null;
  recommended: string[];
  noneLabel: string;
  onChange: (id: string | null) => void;
}) {
  const items = MATERIALS.filter((m) => categories.includes(m.category)).sort((a, b) => {
    const ra = recommended.indexOf(a.id);
    const rb = recommended.indexOf(b.id);
    return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
  });
  return (
    <div className={styles.chooser} role="radiogroup">
      <button type="button" role="radio" aria-checked={value === null} className={`${styles.choice} ${value === null ? styles.choiceOn : ""}`} onClick={() => onChange(null)}>
        <span className={styles.noneSwatch} />
        <span className={styles.choiceName}>{noneLabel}</span>
      </button>
      {items.map((m) => (
        <button
          key={m.id}
          type="button"
          role="radio"
          aria-checked={value === m.id}
          className={`${styles.choice} ${value === m.id ? styles.choiceOn : ""}`}
          onClick={() => onChange(m.id)}
          title={m.description}
        >
          <Swatch uid={`ch-${categories.join("")}-${m.id}`} spec={m.pattern} sizeCm={m.category === "flooring" ? 90 : 40} title={m.name} className={styles.choiceSwatch} />
          <span className={styles.choiceName}>
            {recommended.includes(m.id) && <span className={styles.rec} title="Recommended for your room">❦ </span>}
            {m.name}
          </span>
        </button>
      ))}
    </div>
  );
}
