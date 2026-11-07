# Maison & Jardin

A web application that guides people through choosing wallpaper, tiles, curtains,
paint and furniture layouts for their rooms and gardens, with a timeless, whimsical
French look. The full product brief is in [`PROMPT.md`](PROMPT.md).

## Status

### Phase 3: Show Us Your Space (photos)

- **Upload a photo** of a room from its page (up to 3 per room). It is straightened and resized in the browser, stored privately,
  and only its owner can open it.
- **La Mise au Point:** the client outlines walls, the floor, windows, doors and furniture to keep, with draggable corners
  and true measurements, then locks them.
- **Option B, the pattern on their photo:** a WebGL renderer lays the chosen paper or paint on each wall, flooring on the
  floor, and curtains with a brass pole at each window, in true perspective and at true scale, multiplied by the photo's own
  light. Windows, doors and kept furniture are never painted over.
- **Before-and-after slider, saved versions** (with thumbnails) and side-by-side comparison. Saving a version also makes it
  the room's scheme.
- Tested pixel by pixel: protected areas are unchanged, changing one layer leaves everything else identical, and restoring
  a version reproduces it exactly.

### Phase 2: Consultation & Material Library (children's bedroom)

- **The Consultation** (`/atelier/consultation/chambre-enfant`): five steps covering the child, the room's
  measurements, the light, the feeling and the budget. Answers are checked on the server.
- **Material Library** (`/materiaux`): 8 wallpapers, 8 paints, 7 curtain fabrics and 5 floors from the
  house's own (invented) collections, drawn as true-to-scale patterns, filterable by mood, with a
  full-scale wall preview.
- **Recommendations** (`/atelier/pieces/[id]`): each material is scored against the consultation using
  designer rules (age, mood, light direction and undertone, washability, allergies, budget, pattern
  scale and pairing with the chosen paper). Each suggestion comes with reasons, cautions, the quantity
  to order and an indicative cost.
- **Scale view**: one wall of the client's room drawn to scale, dressed with their scheme.
- The free Visiteur plan keeps one room; members will have unlimited rooms.
- Rules and quantities are covered by unit tests (`npm test`).

### Phase 1: Foundation

- Vintage French design system: aged-paper background, heritage palette, classical
  serif and script fonts, gilt frames, fleurons, wax-seal buttons, gentle animations
- Hand-drawn engraving illustrations for all eight spaces
- Landing page: rooms, the three-step method, a designer's note, a membership preview
- Accounts: sign up, sign in, sign out (email and password, hashed with scrypt,
  signed session cookie)
- **Mon Atelier**, the signed-in member's home page (`/atelier`)
- Membership page (`/abonnements`). Paid plans show "Opening soon" until Stripe is
  connected in Phase 5. Prices are placeholders.

## Running it

Requires Node.js 22 or newer.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Put a long random string in `SESSION_SECRET` (for example the output of
`openssl rand -base64 48`). It is required in production; development uses a
built-in fallback.

```bash
npm run dev
```

Open http://localhost:3000.

Accounts and rooms are stored in PostgreSQL. Online, set `DATABASE_URL` (for example Supabase).
On your own computer, leave it empty and a local copy of PostgreSQL (PGlite) keeps its data
in `data/`, which is not committed.

**To put the app online, follow [`DEPLOY.md`](DEPLOY.md).**

## Pages

| Path           | Page                                  |
| -------------- | ------------------------------------- |
| `/`            | Landing page                          |
| `/inscription` | Create an account                     |
| `/connexion`   | Sign in                               |
| `/atelier`     | Mon Atelier (signed-in members only)  |
| `/abonnements` | Memberships                           |
| `/materiaux`   | Material Library                      |
| `/atelier/consultation/chambre-enfant` | The Consultation |
| `/atelier/pieces/[id]` | A room's scheme and recommendations |
| `/atelier/pieces/[id]/photos/[photoId]` | The client's own photo: outline and dress it |

## Next

Phase 3, continued: site and floor plans (read automatically to fill in the Consultation). Then Phase 4: mood boards.
