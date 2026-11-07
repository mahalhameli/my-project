/**
 * Option B: the client's own photo, dressed in their scheme.
 *
 * Runs in the browser with WebGL2. The photo is drawn untouched, then each
 * material layer is painted only inside its own locked outline, never inside
 * a window, door or kept piece of furniture. Patterns are laid on in true
 * perspective at true scale, and multiplied by the photo's own light, so its
 * shadows and highlights stay exactly where they were. The same photo,
 * outlines and choices always produce exactly the same picture.
 */
import type { Material } from "./materials";
import {
  curtainPanels,
  homography,
  pointInPolygon,
  type Layers,
  type Mat3,
  type Point,
  type Region,
} from "./photo-model";

export type PatternTexture = { image: HTMLImageElement | HTMLCanvasElement; wCm: number; hCm: number };

const VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos;
  gl_Position = vec4(a_pos.x * 2.0 - 1.0, 1.0 - a_pos.y * 2.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_photo;
uniform sampler2D u_mask;     // r: window/door/kept furniture, g: kept furniture only
uniform sampler2D u_pattern;
uniform int u_mode;           // 0 photo, 1 surface, 2 curtain, 3 solid colour
uniform mat3 u_H;             // photo (0-1) -> centimetres on the surface
uniform vec2 u_tileCm;
uniform float u_meanLum;
uniform float u_shadeMix;
uniform vec3 u_solid;

vec3 toLin(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)); }

void main() {
  vec3 photo = texture(u_photo, v_uv).rgb;
  if (u_mode == 0) { outColor = vec4(photo, 1.0); return; }

  vec4 mask = texture(u_mask, v_uv);
  if (u_mode == 1 && mask.r > 0.5) discard;
  if ((u_mode == 2 || u_mode == 3) && mask.g > 0.5) discard;

  float lum = dot(toLin(photo), vec3(0.2126, 0.7152, 0.0722));
  float shade = clamp(lum / max(u_meanLum, 0.002), 0.25, 1.7);

  if (u_mode == 3) {
    outColor = vec4(toSrgb(toLin(u_solid) * mix(1.0, shade, 0.3)), 1.0);
    return;
  }

  vec3 w = u_H * vec3(v_uv, 1.0);
  vec2 cm = w.xy / w.z;
  vec3 pat = toLin(texture(u_pattern, cm / u_tileCm).rgb);

  if (u_mode == 2) {
    // Gathered folds every ~16 cm, and a little shadow under the heading.
    float fold = 0.74 + 0.26 * (0.5 + 0.5 * cos(cm.x * 6.2831853 / 16.0));
    float heading = smoothstep(0.0, 18.0, cm.y) * 0.15 + 0.85;
    pat *= fold * heading;
  }
  outColor = vec4(toSrgb(pat * mix(1.0, shade, u_shadeMix)), 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader error");
  return s;
}

/** Column-major for GLSL from our row-major matrix. */
function colMajor(H: Mat3): Float32Array {
  return new Float32Array([H[0], H[3], H[6], H[1], H[4], H[7], H[2], H[5], H[8]]);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

export class RoomRenderer {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private buf: WebGLBuffer;
  private photoTex: WebGLTexture;
  private maskTex: WebGLTexture;
  private patterns = new Map<string, WebGLTexture>();
  private lumCanvas: HTMLCanvasElement;
  private loc: Record<string, WebGLUniformLocation | null> = {};

  constructor(
    private canvas: HTMLCanvasElement,
    private photo: HTMLImageElement,
  ) {
    canvas.width = photo.naturalWidth;
    canvas.height = photo.naturalHeight;
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: true });
    if (!gl) throw new Error("This browser can't show the room preview (WebGL2 is not available).");
    this.gl = gl;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link error");
    this.prog = prog;
    gl.useProgram(prog);
    for (const name of ["u_photo", "u_mask", "u_pattern", "u_mode", "u_H", "u_tileCm", "u_meanLum", "u_shadeMix", "u_solid"]) {
      this.loc[name] = gl.getUniformLocation(prog, name);
    }
    this.buf = gl.createBuffer()!;
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.photoTex = this.texture(photo, false);
    this.maskTex = gl.createTexture()!;

    // A small copy of the photo for measuring each surface's average light.
    this.lumCanvas = document.createElement("canvas");
    const scale = Math.min(1, 320 / photo.naturalWidth);
    this.lumCanvas.width = Math.max(1, Math.round(photo.naturalWidth * scale));
    this.lumCanvas.height = Math.max(1, Math.round(photo.naturalHeight * scale));
    this.lumCanvas.getContext("2d", { willReadFrequently: true })!.drawImage(photo, 0, 0, this.lumCanvas.width, this.lumCanvas.height);
  }

  private texture(src: TexImageSource, repeat: boolean): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    if (repeat) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  private patternTexture(id: string, pt: PatternTexture): WebGLTexture {
    let tex = this.patterns.get(id);
    if (!tex) {
      tex = this.texture(pt.image, true);
      this.patterns.set(id, tex);
    }
    return tex;
  }

  private drawMask(regions: Region[]) {
    const c = document.createElement("canvas");
    c.width = Math.min(1600, this.canvas.width);
    c.height = Math.round((c.width * this.canvas.height) / this.canvas.width);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, c.width, c.height);
    const path = (pts: Point[]) => {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x * c.width, p.y * c.height) : ctx.moveTo(p.x * c.width, p.y * c.height)));
      ctx.closePath();
    };
    ctx.globalCompositeOperation = "lighter";
    for (const r of regions) {
      if (r.kind === "window" || r.kind === "door") {
        ctx.fillStyle = "#ff0000";
        path(r.points);
        ctx.fill();
      } else if (r.kind === "keep") {
        ctx.fillStyle = "#ffff00"; // red + green
        path(r.points);
        ctx.fill();
      }
    }
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  /** The surface's average brightness, ignoring windows, doors and kept furniture. */
  private meanLum(poly: Point[], protectedPolys: Point[][]): number {
    const c = this.lumCanvas;
    const data = c.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    let n = 0;
    const step = Math.max(1, Math.round(c.width / 80));
    for (let y = 0; y < c.height; y += step) {
      for (let x = 0; x < c.width; x += step) {
        const p = { x: (x + 0.5) / c.width, y: (y + 0.5) / c.height };
        if (!pointInPolygon(p, poly) || protectedPolys.some((q) => pointInPolygon(p, q))) continue;
        const i = (y * c.width + x) * 4;
        const lin = (v: number) => Math.pow(v / 255, 2.2);
        sum += 0.2126 * lin(data[i]) + 0.7152 * lin(data[i + 1]) + 0.0722 * lin(data[i + 2]);
        n++;
      }
    }
    return n ? sum / n : 0.25;
  }

  private quad(pts: Point[]) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    // two triangles of the (convex) quad
    const v = [pts[0], pts[1], pts[2], pts[0], pts[2], pts[3]].flatMap((p) => [p.x, p.y]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  render(opts: {
    regions: Region[];
    layers: Layers;
    materials: Map<string, Material>;
    textures: Map<string, PatternTexture>;
    ceilingCm: number;
  }) {
    const { regions, layers, materials, textures, ceilingCm } = opts;
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.prog);
    this.drawMask(regions);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.photoTex);
    gl.uniform1i(this.loc.u_photo, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.uniform1i(this.loc.u_mask, 1);
    gl.uniform1i(this.loc.u_pattern, 2);

    // 1. The photo itself, untouched.
    gl.uniform1i(this.loc.u_mode, 0);
    this.quad([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);

    const protectedPolys = regions.filter((r) => r.kind === "window" || r.kind === "door" || r.kind === "keep").map((r) => r.points);

    const paintSurface = (r: Region, materialId: string | null | undefined) => {
      if (!materialId) return;
      const tex = textures.get(materialId);
      if (!tex || !r.widthCm || !r.heightCm) return;
      const H = homography(r.points, [
        { x: 0, y: 0 },
        { x: r.widthCm, y: 0 },
        { x: r.widthCm, y: r.heightCm },
        { x: 0, y: r.heightCm },
      ]);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.patternTexture(materialId, tex));
      gl.uniform1i(this.loc.u_mode, 1);
      gl.uniformMatrix3fv(this.loc.u_H, false, colMajor(H));
      gl.uniform2f(this.loc.u_tileCm, tex.wCm, tex.hCm);
      gl.uniform1f(this.loc.u_meanLum, this.meanLum(r.points, protectedPolys));
      gl.uniform1f(this.loc.u_shadeMix, 0.92);
      this.quad(r.points);
    };

    // 2. Walls, then the floor.
    for (const r of regions) if (r.kind === "wall") paintSurface(r, layers.walls[r.id]);
    for (const r of regions) if (r.kind === "floor") paintSurface(r, layers.floor);

    // 3. Curtains at every window, hung high and wide, with a brass pole.
    const fabric = layers.curtains ? materials.get(layers.curtains) : undefined;
    const fabricTex = layers.curtains ? textures.get(layers.curtains) : undefined;
    if (fabric && fabricTex) {
      for (const win of regions.filter((r) => r.kind === "window")) {
        const { panels, pole } = curtainPanels(win, regions, ceilingCm);
        let poleLum = 0.25;
        for (const panel of panels) {
          // Light the fabric like the wall it hangs against.
          const lum = this.meanLum(panel.quad, protectedPolys);
          poleLum = lum;
          const H = homography(panel.quad, [
            { x: 0, y: 0 },
            { x: panel.widthCm, y: 0 },
            { x: panel.widthCm, y: panel.dropCm },
            { x: 0, y: panel.dropCm },
          ]);
          gl.activeTexture(gl.TEXTURE2);
          gl.bindTexture(gl.TEXTURE_2D, this.patternTexture(fabric.id, fabricTex));
          gl.uniform1i(this.loc.u_mode, 2);
          gl.uniformMatrix3fv(this.loc.u_H, false, colMajor(H));
          // Gathered fabric shows the pattern a little compressed across the width.
          gl.uniform2f(this.loc.u_tileCm, fabricTex.wCm / 1.6, fabricTex.hCm);
          gl.uniform1f(this.loc.u_meanLum, lum);
          gl.uniform1f(this.loc.u_shadeMix, 0.25);
          this.quad(panel.quad);
        }
        // The pole
        const t = 0.006;
        gl.uniform1i(this.loc.u_mode, 3);
        gl.uniform3fv(this.loc.u_solid, hexToRgb("#a9874a"));
        gl.uniform1f(this.loc.u_meanLum, poleLum);
        this.quad([
          { x: pole[0].x - 0.01, y: pole[0].y - t },
          { x: pole[1].x + 0.01, y: pole[1].y - t },
          { x: pole[1].x + 0.01, y: pole[1].y + t },
          { x: pole[0].x - 0.01, y: pole[0].y + t },
        ]);
      }
    }
  }

  /** A small JPEG of the current picture, for the list of saved versions. */
  thumbnail(maxWidth = 360): string {
    const c = document.createElement("canvas");
    const scale = Math.min(1, maxWidth / this.canvas.width);
    c.width = Math.round(this.canvas.width * scale);
    c.height = Math.round(this.canvas.height * scale);
    c.getContext("2d")!.drawImage(this.canvas, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.72);
  }
}
