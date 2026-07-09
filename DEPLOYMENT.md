# Production Deployment

UniCrypt is configured to build using Vite and deploy to Vercel.

## Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Redirects**: SPA rewrites configured in `vercel.json` to route everything to `index.html`.

## Deployment Command
To deploy using Vercel CLI:
```bash
vercel --prod
```
