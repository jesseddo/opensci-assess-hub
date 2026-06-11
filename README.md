# OpenSciEd Assessment Library (prototype)

Browse OpenSciEd assessments by grade, unit, and lesson. Built with TanStack Start + Vite.

## Quick start

```bash
npm install
npm run dev          # http://localhost:8080
```

Default view: **Grade 8 · Unit 8.1 Contact Forces** (ingested from OpenSciEd unit materials).

## Ingest OpenSciEd materials from Google Drive

Download a unit from OpenSciEd (e.g. Grade 8 → 8.1 Contact Forces) and run:

```bash
npm run ingest:unit -- \
  "/path/to/8.1 Contact Forces" \
  src/data/ingested/unit-8.1.json
```

This regenerates the catalog, TE guidance HTML, assessment guides, and TE links.

## Developer documentation

| Doc | Purpose |
|-----|---------|
| **[docs/PRD-ASSESSMENT-OPPORTUNITY-INGEST.md](./docs/PRD-ASSESSMENT-OPPORTUNITY-INGEST.md)** | Plain-language PRD — how assessment opportunities get into the library |
| **[docs/TECHNICAL-NOTES-ASSESSMENT-OPPORTUNITIES.md](./docs/TECHNICAL-NOTES-ASSESSMENT-OPPORTUNITIES.md)** | Dev notes — TE assessment opportunity scrape |
| **[docs/OPENSCIED-ASSESSMENT-SYSTEM.md](./docs/OPENSCIED-ASSESSMENT-SYSTEM.md)** | OpenSciEd assessment system — PRD explainer + diagram |
| **[docs/OPENSCIED-TERMINOLOGY.md](./docs/OPENSCIED-TERMINOLOGY.md)** | OpenSciEd terminology table — row kinds, categories, TE fields, UI labels |
| **[docs/STYLE-GUIDE.md](./docs/STYLE-GUIDE.md)** | Typography & UI tokens (sans-serif only) |
| **[docs/ONBOARDING.md](./docs/ONBOARDING.md)** | 5-minute start for new devs |
| **[docs/OPENSCIED-INGEST.md](./docs/OPENSCIED-INGEST.md)** | Full ingest + integration guide |
| **[docs/diagrams.html](./docs/diagrams.html)** | **Open in browser** — live Mermaid graphs |
| **[docs/openscied-ingest-architecture.png](./docs/openscied-ingest-architecture.png)** | System overview (static image) |

## Build & deploy

```bash
npm run build        # dist/client for Netlify/static hosting
```

See `netlify.toml` — publish directory: `dist/client`.
