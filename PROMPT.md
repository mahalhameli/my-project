# Build Prompt: "Maison & Jardin" (working name)

You are a senior full-stack engineer working with a classically trained interior designer who has 25 years of experience in French and English residential interiors and garden design. Build a web application that helps homeowners choose the right materials, patterns and layouts for their living spaces. It should feel like a private consultation with a designer, not like browsing a catalogue.

---

## 1. Purpose

Most people get overwhelmed choosing wallpaper, tiles, curtains and furniture placement. They pick things they like one at a time, and the room doesn't hang together. This app guides each client through those decisions, explains *why* each choice works, and shows the result as realistically as possible before they spend any money.

## 1b. Market

- **Country:** United Arab Emirates. **Currency:** AED (UAE dirham) for every price, estimate and membership.
- Stores, delivery and product availability are those of the UAE.

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

### 3.0 Show Us Your Space (the starting point of every project)
Every consultation begins with the client's own space. They upload either:
- **a photo of the room or garden** (several angles are welcome), or
- **a site plan or floor plan**: a drawing, a PDF, a photo of a sketch, or an estate agent's plan.

The app reads what was uploaded:
- From a **plan**: walls, measurements, doors, windows and the shape of the space. It fills in the Consultation's measurements itself, and the client only confirms them.
- From a **photo**: walls, windows, floor and existing furniture, so materials can be shown on the client's real room.

Uploaded photos and plans are private to the member, stored securely, and can be deleted at any time.

### 3.1 The Consultation ("Le Questionnaire")
After the upload, a friendly step-by-step questionnaire asks what the upload can't tell us:
- Who uses the room (ages, pets, allergies, mobility)
- Room dimensions, ceiling height, window and door positions, which way the windows face
- Natural light and time of day the room is used most
- Mood words (e.g. "calm", "playful", "grand", "cosy")
- Budget tier (modest / considered / generous)
- Things to keep (existing furniture, flooring, heirlooms)
- (Measurements and window positions come from the uploaded plan where possible.)

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

### 3.3b The Golden Rule: their room stays their room
When a client changes something, **only that thing changes**. Their windows, doors, walls, ceiling, camera angle, existing furniture and lighting stay exactly as they are, every time, unlike general AI image tools that redraw the whole room with each request.

How the app guarantees it:
1. **The uploaded photo is never redrawn.** It is kept as the original, and every version is built on top of it.
2. **The room is mapped once, then locked.** After upload, the app outlines each wall, the floor, the ceiling, every window and door, and existing furniture. The client checks and corrects the outlines, and they are saved. Windows and doors are always protected.
3. **Each material is its own layer** (walls, floor, curtains, tiles, furniture). Changing one layer redraws only that layer.
4. **Every change is saved as a version.** The client can go back to any earlier version or compare two side by side.

### 3.4 Realistic Visualisation: their own room, transformed
The client sees **their own uploaded room** dressed in the chosen scheme, in two ways:
- **B. Pattern on the photo (every membership, always available):** the chosen paper, paint, tiles and curtains are placed exactly inside the saved outlines of their real photo, at true scale and in perspective. The photo's own light and shadows are kept on top, so the lighting is always the room's real lighting. The same choices always give exactly the same picture.
- **A. Realistic AI render (premium, Atelier):** a photo-realistic picture with natural light and shadow. The AI may only work **inside the outline of the element being changed**. Everything outside it is restored from the original photo pixel for pixel, so it can never move a window or redraw the room. It uses a paid image service, so it is limited per month. If an AI result isn't right, the exact version B is always there.
- They can swap any material and see the room again straight away.
- A 3D room view that applies the chosen wallpaper, tiles, paint, curtains and furniture
- Lighting set to the room's orientation and time of day (north light is cool, south light is warm)
- "See it in my room": overlay materials onto the client's uploaded photo
- Correct pattern scale: a large-scale toile must look large on the wall

### 3.4b Real Furniture from Real Stores
Clients pick actual furniture pieces from the stores they shop at in the UAE, starting with **Zara Home, Home Centre, Sophia Home (www.sophiahome.com), 2XL and Crate & Barrel**, using each store's UAE website.
- From the uploaded photo and plan, the app works out what the room has, what is missing, and how much space each spot allows (for example, "room for a 160 cm sofa on this wall").
- It suggests real pieces that fit the **measurements, style, mood and budget**, each with a Designer's Note, and shows each piece **in the client's own photo**. The Golden Rule applies: only the new piece is added.
- **"Buy at [store]"** opens the product on the store's own website. Purchases earn the business an affiliate commission alongside subscriptions.
- **Where the products come from:** store affiliate programmes and direct partnerships, which give legal product data (photos, sizes, prices, links), refreshed daily so prices and stock stay current. Never copied from store websites without permission.
- **No team needed. The plan runs itself, in four steps:**
  1. **From day one, the designer's specification with "shop it" buttons:** for each spot in the room the app specifies exactly what is needed (for example, "a three-seat sofa, 190–210 cm wide, oatmeal linen, low arms, leaving a 90 cm walkway") and shows *a piece like this* in the client's own photo, at the right size and following the Golden Rule. Buttons open **Zara Home, Home Centre, Sophia Home, 2XL and Crate & Barrel** on their own UAE websites at a matching search, and the client chooses the exact piece there.
  2. **"Add a piece you love":** the client pastes the link to any product they've found and enters its width and depth, and the app places it in their room to check it fits.
  3. **Automatic product feeds** from UAE stores with affiliate programmes, refreshed daily, so real products with real AED prices appear in the room, and purchases earn a commission. Candidates found so far: **Danube Home** (ArabClicks) and **Sedar** for curtains and blinds (FlexOffers). Confirm each when applying, as store programmes change.
  4. **A direct approach to the five favourite stores**, starting with UAE-based 2XL and Sophia Home: "We send you customers who have already seen your furniture in their own room." Stores that agree are added through the same feed.
- **Not used:** AI agents or programs that browse and copy store websites. That breaks most stores' terms, uses copyrighted photos, is slow and costly per search, breaks when sites change, and risks showing wrong prices.
- **Note (late 2025):** West Elm and Pottery Barn closed in the UAE, so they are not included.
- Store names and logos are used only as each store's partner terms allow.

### 3.5 The Designer's Notes
Every recommendation comes with a short, warm explanation in the voice of a designer, for example:
> *"I've paired the large-scale floral paper with a narrow ticking stripe on the curtains. One bold pattern and one quiet one lets both breathe."*

### 3.6 Harmony Checker
Flags combinations that clash, such as two competing large-scale patterns, undertones that fight, or a tile too busy beside a busy paper. It suggests gentle fixes.

### 3.7 Mood Boards ("Planches d'Ambiance")
Every room gets a mood board, created automatically and then made the client's own:
- **Built from their room:** the uploaded photo, the transformed render, and true-to-scale swatches of every chosen paper, tile, fabric and paint, plus the furniture pieces and the Designer's Notes.
- **Looks like a designer's pinned board:** swatches pinned to a linen board with brass pins, handwritten-style labels, and fabric cuttings with pinked edges.
- **Editable:** drag pieces around, resize, add their own inspiration photos and notes, and swap a material (the board updates).
- **Whole-house board:** brings every room together, to check the colours flow from room to room.
- **Share and print:** a private share link for a partner or decorator, and a printable PDF. Boards on the free plan are watermarked.

### 3.8 Projects
- Save rooms into a "Maison" (the client's home) made up of several rooms
- Each room has a specification sheet as a PDF: every material, its quantity, its dimensions and where it goes. The client can hand it to a decorator or builder.

### 3.9 Accounts and Subscriptions
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

1. **Foundation:** vintage design system (colours, fonts, textures, components), auth, landing page *(done)*
2. **Consultation + Material Library** for one room, starting with the Children's Bedroom *(done)*
3. **Show Us Your Space:** photo and site-plan upload, reading the plan to fill in the Consultation, and the chosen materials shown on the client's own photo
4. **Mood boards:** automatic, editable, whole-house, share and print; plus the Harmony Checker
5. **2D Room Planner** built from the uploaded plan, with clearance rules and layout suggestions, plus **real furniture from stores** (in-house catalogue first, then partner feeds)
6. **Subscriptions** with Stripe and tier limits
7. **Realistic AI renders and 3D view** (premium)
8. **Remaining rooms and the Garden module** (gardens from photos and site plans too)

At each phase, show me the result, explain the decisions you made, and wait for my feedback before moving on.

## 8. Tone of Voice

Warm, knowledgeable and gently encouraging, like a trusted designer who has been decorating beautiful homes for decades. Never pushy or salesy, and never technical jargon without explanation.
