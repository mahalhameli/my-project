# Maison & Jardin

A web application that guides people through choosing wallpaper, tiles, curtains,
paint and furniture layouts for their rooms and gardens, with a timeless, whimsical
French look. The full product brief is in [`PROMPT.md`](PROMPT.md).

## Status: Phase 1, Foundation

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

## Next

Phase 2: the Consultation questionnaire and Material Library for the Children's Bedroom.
