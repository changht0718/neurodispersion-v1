# NeuroDispersion Clinical Research Dashboard v1.1

GitHub Pages + Supabase prototype for SCD / aMCI / DAT cognitive-profile dispersion research.

## Features

- Demographic and cardiovascular-risk-factor input
- Raw neuropsychological score entry
- Demo raw-score → percentile conversion (replace before research use)
- Domain-specific mean percentile and dispersion (within-domain SD)
- Figure 2–style domain dispersion chart
- Figure 3–style domain percentile radar plots
- Exploratory manuscript-derived memory profile index
- Supabase Auth + PostgreSQL persistence
- Row Level Security (each signed-in researcher sees only their own records)

## 1. Deploy the frontend to GitHub Pages

Upload the repository contents so that `index.html` is in the repository root.

GitHub repository → **Settings → Pages → Deploy from a branch → main → /(root)**.

## 2. Create a Supabase project

Create a Supabase project, then open **SQL Editor** and run:

`supabase_schema.sql`

This creates `public.neurodispersion_records`, enables RLS, revokes anonymous access, grants authenticated users CRUD access, and creates policies so `auth.uid()` must equal `owner_id`.

## 3. Create researcher accounts

For a research deployment, create user accounts in Supabase Authentication rather than allowing open public sign-up.

The dashboard currently uses email/password login via `signInWithPassword()`.

## 4. Configure the browser client

Open:

`config/supabase-config.js`

and fill in:

```js
window.NEURODISPERSION_SUPABASE = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_PUBLISHABLE_OR_ANON_KEY"
};
```

The publishable/anon key is intended for browser use. **Never put the `service_role` key in GitHub or browser JavaScript.** Security depends on RLS and least-privilege grants.

## 5. Data model

Each saved row includes:

- `subject_id` — pseudonymous research ID only
- demographics — age, sex, education, estimated premorbid IQ
- clinical features — cardiovascular risk factors (recorded only in v1.1)
- raw neuropsychological scores
- converted percentiles
- domain means and dispersions
- exploratory profile outputs
- model version and timestamps

Do not store names, national ID numbers, phone numbers, addresses, medical-record numbers, or other direct identifiers in this prototype.

## 6. Important research limitations

### Norms
`app.js` currently uses **DEMO_NORMS**. Replace them with validated Taiwanese normative conversion tables before any research or clinical interpretation.

### Risk model
The current memory-profile output is an exploratory manuscript-derived index, **not a validated probability of MCI or future dementia**. A DAT/dementia risk probability is intentionally not generated until a validated logistic/Cox/longitudinal model is supplied.

### Security / governance
Supabase provides technical access control, but deployment with real participant data still requires your institution's IRB/data-governance, retention, backup, and access-control requirements.

## v1.2 chart behavior
- Figure 2 is calculated only from the currently entered participant data; no SCD/aMCI/DAT reference curves are plotted.
- Figure 3 radar plots are calculated only from the currently entered participant raw scores after percentile conversion.
- Demo values are no longer loaded automatically on page open; the demo button must be clicked explicitly.
