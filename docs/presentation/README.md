# Allatura — Technical Product Design (slide deck)

A self-contained 3-slide deck for the "Section 3 — Technical Product Design" presentation.
Covers the architecture represented when the deck was prepared. Treat the HTML and PDF as presentation snapshots; confirm current behaviour and deployment claims against the [developer handover](../HANDOVER.md), source and dated QA evidence before presenting them.

| Slide | Question it answers |
|---|---|
| 1 — Current System Architecture | What did we actually build and deploy? |
| 2 — Identity, Tenant Isolation & Request Flow | How does one request move through the system, and where is security enforced? |
| 3 — Design Decisions, NFRs & Trade-offs | Why is it designed this way, and what did each decision gain/cost? |

## Files

- `allatura-architecture.html` — the deck. **This is the editable source** (single file: HTML + CSS + a little vanilla JS, no build step, no dependencies).
- `assets/` — drop your real screenshots here (see below).
- `allatura-architecture.pdf` — exported PDF, if present (regenerate any time, see "Export").

## View / present

Just open `allatura-architecture.html` in any modern browser (Chrome/Edge/Safari).

- **← / →** (or Space) — next / previous slide
- **N** — toggle speaker notes (hidden from the audience; ~60–75s per slide)
- **F** — fullscreen
- Dots in the footer jump to a slide; the URL hash (`#1`, `#2`, `#3`) deep-links.

## Edit

Everything is inline and plain. Common edits:

- **Text / endpoints / decisions** — edit the markup inside each `<section class="slide">`.
- **Speaker notes** — edit the `<div class="notes-src">…</div>` at the bottom of each slide.
- **Theme** — all colours/typography are CSS custom properties in `:root` at the top
  (`--gold`, `--emerald`, `--ink`, `--mono`, etc.). Change once, applied everywhere.
- **Architecture diagram** — it's a hand-authored inline `<svg>` in Slide 1 (`viewBox="0 0 1200 462"`);
  edit the `<rect>` / `<text>` / `<line>` nodes directly.

## Add real screenshots

The deck ships with labelled placeholder drop-zones. To use a real screenshot:

1. Save the image into `assets/` (e.g. `assets/cloud-run.png`).
2. Find the matching `<div class="shot">…</div>` and replace its inner
   `<div class="drop">…</div>` with:
   ```html
   <img src="assets/cloud-run.png" alt="GCP Cloud Run service">
   ```
   (`.shot img` is already styled to fill the frame.)

Suggested shots: **Slide 1** — app dashboard, GCP Cloud Run, MongoDB Atlas · **Slide 2** — Auth0 dashboard, Stripe webhooks.

## Export to PDF

The deck has a print stylesheet that lays out all 3 slides as landscape pages.

- **In-browser:** `Ctrl/Cmd + P` → **Landscape** → Margins **None** → enable **Background graphics** → *Save as PDF*.
- **Headless (Edge/Chrome):**
  ```bash
  msedge --headless=new --disable-gpu --no-margins \
    --print-to-pdf="allatura-architecture.pdf" \
    "file:///C:/Users/ProductiTeam/Desktop/Allatura/plutus-fe/docs/presentation/allatura-architecture.html"
  ```

> PowerPoint: the HTML is the editable source of truth. A `.pptx` would be a separate re-layout
> (it can't preserve the live SVG/CSS theme faithfully) — ask if you want one generated.

## Environment references recorded in the deck

The deck records the following environment references. They have not been revalidated by this documentation cleanup and are not evidence of current provider or deployment acceptance:
Frontend `allatura.com` on Vercel · Backend `plutus-api-462298977190.us-central1.run.app/v1` on GCP Cloud Run (`us-central1`) · Swagger `/api` · Auth0 `allatura-dev.au.auth0.com`, audience `https://api.allatura.app`, RS256 via JWKS · MongoDB Atlas (20 tenant-scoped collections) · Cloud Storage bucket `allaturabucket` (V4 signed URLs) · live Stripe · Mailgun.

> Note: the Auth0 tenant shown is the verified dev value (`allatura-dev.au.auth0.com`). If production
> uses an `allatura-prod` tenant, update it in Slide 1's SVG and in Slide 2.
