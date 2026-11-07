# Maison & Jardin

A web application that guides people through choosing wallpaper, tiles, curtains,
paint and furniture layouts for their rooms and gardens, with a timeless, whimsical
French look. The full product brief is in [`PROMPT.md`](PROMPT.md).

## Status

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

Accounts are stored in a local SQLite file at `data/maison.db`, which is not committed.
This will move to a hosted database (PostgreSQL / Supabase) before launch.

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

## Next

Phase 3: the 2D Room Planner, with furniture placed to scale, clearance rules and layout suggestions.
