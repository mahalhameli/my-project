# Build Prompt: "Maison & Jardin" (working name)

You are a senior full-stack engineer working with a classically trained interior designer who has 25 years of experience in French and English residential interiors and garden design. Build a web application that helps homeowners choose the right materials, patterns and layouts for their living spaces. It should feel like a private consultation with a designer, not like browsing a catalogue.

---

## 1. Purpose

Most people get overwhelmed choosing wallpaper, tiles, curtains and furniture placement. They pick things they like one at a time, and the room doesn't hang together. This app guides each client through those decisions, explains *why* each choice works, and shows the result as realistically as possible before they spend any money.

## 2. Spaces covered

Each space has its own guided flow, material library and design rules:

1. **Children's bedrooms**: safe, washable, able to grow with the child (nursery → young child → teen)
2. **Parents' suite**: bedroom, en-suite bathroom and seating nook; restful and layered
3. **Playroom**: durable, storage-led, zoned for play, reading and craft
4. **Kitchen**: layout type (galley, L-shape, U-shape, island), cabinetry, splashback tiles, flooring, hardware
5. **Wardrobe and dressing room**: fitted joinery, hanging and shelf zones, interior finishes
6. **Entrance and hallway**: first impressions, hard-wearing floors, storage, lighting
7. **Gardens**: two distinct styles:
   - *English landscape and cottage*: informal planting, meadow, rose borders, winding paths
   - *French formal*: parterres, clipped box and yew, gravel allées, symmetry, potager

## 3. Core features

### 3.1 The Consultation ("Le Questionnaire")
A friendly step-by-step questionnaire before any design work starts:
- Who uses the room (ages, pets, allergies, mobility)
- Room dimensions, ceiling height, window and door positions, which way the windows face
- Natural light and time of day the room is used most
- Mood words (e.g. "calm", "playful", "grand", "cosy")
- Budget tier (modest / considered / generous)
- Things to keep (existing furniture, flooring, heirlooms)
- Optional photo upload of the current room

Answers feed every recommendation that follows.

### 3.2 Material Library
A curated, filterable library of:
- **Wallpaper**: toile de Jouy, florals, stripes, damask, chinoiserie, small-scale prints, murals. Show pattern repeat size, match type (straight or drop), and how many rolls the room needs.
- **Tiles**: encaustic, terracotta, zellige, marble, chequerboard, metro, hexagonal. Show the layout pattern (herringbone, basketweave, straight lay, diagonal), grout colour, and slip and wear ratings.
- **Curtains and fabrics**: linen, velvet, chintz, ticking, gingham, voile. Show heading types (pinch pleat, goblet, pencil), lining, fullness and drop length.
- **Paint**: historic, heritage-style colour palettes with undertone notes.
- **Flooring, trims, hardware and lighting**.

Each item shows its real scale at room size, not just a swatch.

### 3.3 Room Planner
- A 2D floor plan drawn to scale from the client's dimensions
- Drag-and-drop furniture with real sizes
- Live clearance warnings based on professional rules (see section 5)
- One-click "suggest a layout" that proposes 2–3 arrangements and explains each

### 3.4 Realistic Visualisation
- A 3D room view that applies the chosen wallpaper, tiles, paint, curtains and furniture
- Lighting set to the room's orientation and time of day (north light is cool, south light is warm)
- "See it in my room": overlay materials onto the client's uploaded photo
- Correct pattern scale: a large-scale toile must look large on the wall

### 3.5 The Designer's Notes
Every recommendation comes with a short, warm explanation in the voice of a designer, for example:
> *"I've paired the large-scale floral paper with a narrow ticking stripe on the curtains. One bold pattern and one quiet one lets both breathe."*

### 3.6 Harmony Checker
Flags combinations that clash, such as two competing large-scale patterns, undertones that fight, or a tile too busy beside a busy paper. It suggests gentle fixes.

### 3.7 Mood Boards and Projects
- Save rooms into a "Maison" (the client's home) made up of several rooms
- Each room can be exported as a mood board (beautiful, printable)
- Each room has a specification sheet as a PDF: every material, its quantity, its dimensions and where it goes. The client can hand it to a decorator or builder.

### 3.8 Accounts and Subscriptions
- Sign up and sign in with email and password, plus Google and Apple sign-in
- Subscription tiers, for example:
  - **Free ("Visiteur")**: 1 room, limited library, watermarked boards
  - **Monthly or annual ("Membre")**: unlimited rooms, full library, 3D view, PDF specs
  - **Premium ("Atelier")**: everything, plus photo overlay, garden design and priority features
- Payments through Stripe: free trial, cancel anytime, billing portal
- Account page showing projects, plan and invoices

## 4. Visual Design: very French, timeless, whimsical

The app must look as though it has existed for a hundred years, like a beloved Parisian maison de décoration or an old botanical atlas. **Nothing modern.**

**Do:**
- Aged paper and linen textures as backgrounds, with a soft cream, never stark white
- A palette of chalk white, faded rose, duck-egg blue, sage, French grey, ochre and a touch of antique gold
- Classical serif typography, e.g. *Cormorant Garamond* or *Playfair Display* for headings and *EB Garamond* for body text, plus an elegant script for occasional flourishes
- Hand-drawn engravings and botanical illustrations, toile-style vignettes, ribbons, garlands
- Gilded or carved-frame borders around images, decorative dividers and fleurons (❦)
- Buttons that feel like engraved labels or wax seals
- Gentle, delightful animations, like a page turning, a ribbon unfurling or a curtain drawing open
- French touches in naming (*Le Salon*, *Les Matériaux*, *Mon Atelier*), always with clear English alongside

**Do not:**
- Flat design, glassmorphism, neon, gradients, harsh black or stark minimalism
- Generic SaaS dashboards or sans-serif tech fonts

**But always user-friendly:**
- Clear, simple navigation with no more than 5 main sections
- Large readable text and accessible colour contrast (WCAG AA)
- Fully responsive, so it works beautifully on phone and tablet
- One clear next step on every screen

## 5. Professional Design Rules to build in

Encode these as the app's "designer brain":

**Layout and clearances**
- Main walkways: at least 90 cm. Secondary paths: at least 60 cm.
- Coffee table to sofa: 40–45 cm
- Bed: at least 60–75 cm clear on each accessible side
- Kitchen island to counters: 100–120 cm. Keep the work triangle (sink, hob, fridge) between 4 and 8 m in total.
- Wardrobe depth: 60 cm. Long hanging: 150–170 cm. Double hanging: about 100 cm per rail.

**Curtains**
- Hang the pole 10–15 cm above the window frame (or close to the ceiling for height) and 15–25 cm beyond each side
- Fullness: 2–2.5× the width of the window
- Length: just kissing the floor (classic), a slight break, or puddled (romantic)

**Pattern and colour**
- Mix pattern by scale: one large, one medium, one small
- Use the 60/30/10 colour balance
- North-facing rooms suit warm undertones; south-facing rooms can take cooler ones
- Small rooms can carry a bold paper, which is often more charming than a timid one

**Children's spaces**
- Anchor tall furniture to the wall, round the corners, use cordless blinds
- Choose washable and scrubbable wallpaper and paint
- Design for growth: neutral bones, playful and changeable accents

**Lighting**
- Layer ambient, task and accent lighting in every room

**Gardens**
- English: drifts of planting in odd numbers, layered heights, informal curves
- French: symmetry, a strong central axis, clipped evergreens, gravel and stone
- Plant suggestions based on the client's climate zone and soil

## 6. Suggested Technical Stack

- **Frontend:** Next.js (React) + TypeScript, with Tailwind or CSS modules for the custom vintage theme
- **3D and visualisation:** Three.js / React Three Fiber, with photo overlay through canvas and perspective mapping
- **Backend and database:** Supabase or PostgreSQL with Prisma
- **Auth:** Supabase Auth or NextAuth (email, Google, Apple)
- **Payments:** Stripe Checkout + Customer Portal + webhooks
- **Storage:** user photo uploads and material images
- **PDF export:** for specification sheets and mood boards

## 7. Build in Phases

1. **Foundation:** vintage design system (colours, fonts, textures, components), auth, landing page
2. **Consultation + Material Library** for one room (start with Children's Bedroom)
3. **2D Room Planner** with clearance rules and layout suggestions
4. **Mood boards, Designer's Notes, Harmony Checker**
5. **Subscriptions** with Stripe and tier limits
6. **3D visualisation and photo overlay**
7. **Remaining rooms and the Garden module**

At each phase, show me the result, explain the decisions you made, and wait for my feedback before moving on.

## 8. Tone of Voice

Warm, knowledgeable and gently encouraging, like a trusted designer who has been decorating beautiful homes for decades. Never pushy or salesy, and never technical jargon without explanation.
