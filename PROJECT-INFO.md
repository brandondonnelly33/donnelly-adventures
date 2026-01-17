# Donnelly Adventures - Project Reference

## Quick Links
- **Live Site**: https://donnelly-adventures.onrender.com
- **Custom Domain**: https://donnellyadventures.com (once SSL is ready)
- **GitHub Repo**: https://github.com/brandondonnelly33/donnelly-adventures

## How to Make Changes

1. Tell me what you want changed
2. I edit the files locally in `C:\Users\brand\Documents\claude-hq\donnelly-adventures\`
3. I push to GitHub: `git add -A && git commit -m "message" && git push`
4. Render auto-deploys in ~1 minute

That's it! You don't need to do anything.

## Hosting: Render.com

- **Account**: Your GitHub login
- **Dashboard**: https://dashboard.render.com
- **Service Name**: donnelly-adventures
- **Plan**: Free tier
- **Auto-Deploy**: Yes (from GitHub main branch)

## Domain: Namecheap

- **Domain**: donnellyadventures.com
- **Purchased**: 10 years ($148.10)
- **DNS Settings** (already configured):
  - A Record: `@` → `216.24.57.1`
  - CNAME: `www` → `donnelly-adventures.onrender.com`

## Photo Storage: Cloudinary

- **Dashboard**: https://cloudinary.com/console
- **Cloud Name**: dpazcxxyp
- **Free Tier**: 25GB storage (plenty for 1000+ photos)
- **Credentials in**: `.env` file (don't share publicly)

## Project Structure

```
donnelly-adventures/
├── server.js          # Backend (Express.js)
├── package.json       # Dependencies
├── .env               # Cloudinary credentials (don't commit)
├── data/
│   └── donnelly.json  # Database (photos, journal entries)
└── public/
    ├── index.html          # Home page (adventure cards)
    └── california-2026.html # California trip page
```

## Family Members
- Brandon
- Racheal
- Olivia

## Adding New Trips

To add a new adventure:
1. Create a new HTML file in `public/` (e.g., `hawaii-2027.html`)
2. Add an adventure card to `public/index.html`
3. Push to GitHub

## If Something Breaks

**Site not loading?**
- Check https://status.render.com
- Render free tier sleeps after 15 min inactivity (first visit takes ~30 sec to wake)

**Custom domain not working?**
- SSL certificates can take up to 24 hours
- Check DNS propagation: https://dnschecker.org

**Photos not uploading?**
- Check Cloudinary dashboard for storage limits
- Verify `.env` file has correct credentials

**Need to redeploy manually?**
- Go to Render dashboard → donnelly-adventures → Deploy → "Deploy latest commit"

## Credentials Summary

| Service | Login |
|---------|-------|
| Render | GitHub OAuth |
| GitHub | brandondonnelly33 |
| Namecheap | Your account |
| Cloudinary | Your account |

## Created
- **Date**: January 17, 2026
- **By**: Brandon + Claude (Atlas)
