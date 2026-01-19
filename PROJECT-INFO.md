# Donnelly Adventures - Project Reference

## Quick Links
- **Live Site**: https://donnelly-adventures.pages.dev
- **Custom Domain**: https://donnellyadventures.com (DNS configured on Namecheap)
- **GitHub Repo**: https://github.com/brandondonnelly33/donnelly-adventures

## Current Trip: California 2026
- **Dates**: January 22 - February 4, 2026 (14 days)
- **Family**: Brandon, Racheal, Olivia

### Itinerary
1. **Thu Jan 22** - Sacramento: Hyatt Regency, Lion King 7:30pm
2. **Fri Jan 23** - Jelly Belly Factory morning, San Jose Sharks game 7pm
3. **Sat Jan 24 - Sat Jan 31** - Disneyland Hotel (7 nights)
4. **Sat Jan 31 - Mon Feb 2** - Great Wolf Lodge (2 nights), Medieval Times
5. **Mon Feb 2 - Wed Feb 4** - Sheraton Redding Presidential Suite (2 nights)
6. **Wed Feb 4** - Drive home to Sherwood, OR

---

## How to Make Changes

1. Tell Claude what you want changed
2. Files are at `C:\Users\brand\Documents\claude-hq\donnelly-adventures\`
3. Claude edits, commits, and deploys automatically
4. Site updates in ~30 seconds

**Manual deploy command** (if needed):
```bash
cd C:\Users\brand\Documents\claude-hq\donnelly-adventures
git add -A && git commit -m "your message" && git push
npx wrangler pages deploy public --project-name donnelly-adventures
```

---

## Hosting: Cloudflare Pages (FREE)

- **Dashboard**: https://dash.cloudflare.com
- **Account ID**: 5cb2fdc344ee4f912dafa445ec466409
- **Project**: donnelly-adventures
- **URL**: donnelly-adventures.pages.dev
- **Features**: Instant loading, no cold starts, free forever

### Cloudflare Worker API
- **URL**: https://donnelly-api.brandondonnelly33.workers.dev
- **Handles**: Photo listing from Cloudinary, journal entries
- **KV Namespace ID**: 71806b9180c244de86b80cea80d01280 (for journal)

---

## Domain: Namecheap

- **Domain**: donnellyadventures.com
- **Purchased**: 10 years ($148.10)
- **DNS Settings**:
  - CNAME `@` → `donnelly-adventures.pages.dev`
  - CNAME `www` → `donnelly-adventures.pages.dev`

---

## Photo Storage: Cloudinary (FREE)

- **Dashboard**: https://cloudinary.com/console
- **Cloud Name**: dpazcxxyp
- **API Key**: 772562965278268
- **API Secret**: Dkzu63ARC_8E7I3KCA-krYrGaVE
- **Upload Preset**: donnelly_unsigned
- **Folder**: donnelly-adventures
- **Free Tier**: 25GB storage (plenty for 1000+ photos)

Photos upload directly from browser to Cloudinary - no server needed.

---

## Project Structure

```
donnelly-adventures/
├── public/
│   ├── index.html              # Home page (adventure cards)
│   └── california-2026.html    # California trip page
├── worker/
│   ├── worker.js               # Cloudflare Worker API
│   └── wrangler.toml           # Worker config
├── .env                        # Local Cloudinary creds (don't commit)
├── package.json
└── PROJECT-INFO.md             # This file
```

---

## Adding New Trips

1. Copy `public/california-2026.html` as template
2. Rename to `public/new-trip-name.html`
3. Edit the content
4. Add card to `public/index.html`
5. Deploy

---

## Troubleshooting

**Site not loading?**
- Check https://www.cloudflarestatus.com
- Run: `npx wrangler pages deploy public --project-name donnelly-adventures`

**Photos not showing?**
- Check Cloudinary dashboard for storage
- Test API: `curl https://donnelly-api.brandondonnelly33.workers.dev/api/photos`

**Custom domain issues?**
- Check DNS: https://dnschecker.org
- Verify CNAME points to `donnelly-adventures.pages.dev`

**Need to redeploy worker?**
```bash
cd C:\Users\brand\Documents\claude-hq\donnelly-adventures\worker
npx wrangler deploy
```

---

## Credentials Summary

| Service | Login | Notes |
|---------|-------|-------|
| Cloudflare | GitHub OAuth | Workers + Pages |
| GitHub | brandondonnelly33 | Code repo |
| Namecheap | Your account | Domain |
| Cloudinary | Your account | Photo storage |

---

## Created
- **Date**: January 17-19, 2026
- **By**: Brandon + Claude (Atlas)
- **Stack**: Static HTML + Cloudflare Pages + Cloudflare Workers + Cloudinary
