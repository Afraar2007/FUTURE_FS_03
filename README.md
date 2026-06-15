"# FUTURE_FS_03"

## Vercel deployment

If you import this repository into Vercel, set the project's **Root Directory** to:

- `orderly-eats`

Use the following Build & Output settings in the Vercel UI (when creating or editing the project):

- Framework / Preset: `Other`
- Root Directory: `orderly-eats`
- Install Command: `npm install`
- Build Command: `npm run build` (from root will forward to workspace)
- Output Directory: leave blank (Vercel will detect the server build)

Notes:
- Do not include a `rootDirectory` property in `vercel.json`; Vercel's import API rejects it. The repository already omits that field.
- The app uses TanStack Start with a Vercel server preset; the `vite.config.ts` is configured accordingly.

"# Future-FS-03" 
