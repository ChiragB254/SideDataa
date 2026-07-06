# Deploying SideData Technologies — Free Hosting Guide

You already own **sidedataa.com**. Here's the fastest free path to get it live.

---

## Option 1: Vercel (recommended)

Free tier includes: unlimited personal projects, automatic HTTPS, custom domain support, global CDN, auto-deploy on git push.

### Steps

1. **Push this project to GitHub**
   - Create a new repo on github.com (e.g. `sidedata-website`)
   - From this folder, run:
     ```bash
     git init
     git add .
     git commit -m "Initial site"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/sidedata-website.git
     git push -u origin main
     ```

2. **Import into Vercel**
   - Go to https://vercel.com and sign up with your GitHub account (free)
   - Click "Add New Project" → select your `sidedata-website` repo
   - Vercel auto-detects Vite. Leave settings as default:
     - Build command: `npm run build`
     - Output directory: `dist`
   - Click **Deploy**. You'll get a live URL like `sidedata-website.vercel.app` in about a minute.

3. **Connect your domain (sidedataa.com)**
   - In the Vercel project dashboard, go to **Settings → Domains**
   - Add `sidedataa.com` and `www.sidedataa.com`
   - Vercel gives you DNS records to add. Go to wherever you bought the domain (GoDaddy, Namecheap, etc.) and in DNS settings add:
     - Type `A`, Name `@`, Value `76.76.21.21` (Vercel's IP — they'll show you the exact one)
     - Type `CNAME`, Name `www`, Value `cname.vercel-dns.com`
   - DNS changes can take a few minutes to a few hours to propagate. HTTPS is issued automatically once it does.

That's it — every time you push to GitHub, Vercel redeploys automatically.

---

## Option 2: Netlify (equally good, same free tier)

1. Push to GitHub (same as above)
2. Go to https://netlify.com, sign in with GitHub
3. "Add new site" → "Import an existing project" → pick your repo
4. Build command: `npm run build`, Publish directory: `dist`
5. Deploy, then go to **Domain settings** → **Add custom domain** → enter `sidedataa.com`
6. Add the DNS records Netlify shows you at your domain registrar

---

## Option 3: Cloudflare Pages (best if you want Cloudflare's CDN/security too)

1. Push to GitHub
2. Go to https://pages.cloudflare.com, sign in
3. Connect your repo, framework preset: **Vite**
4. Build command: `npm run build`, Build output directory: `dist`
5. Once deployed, add `sidedataa.com` under **Custom domains** — if your domain's nameservers are already on Cloudflare this is instant; otherwise it walks you through it

---

## No GitHub? Fastest possible path (drag and drop)

1. Run `npm run build` locally to generate the `dist/` folder
2. Go to https://app.netlify.com/drop
3. Drag the `dist` folder onto the page — it deploys instantly, no account needed for the first deploy (you'll want an account to add your custom domain though)

---

## Which should you pick?

- **Vercel** — best all-around, best React/Vite support, easiest domain setup. Recommended.
- **Netlify** — just as easy, slightly more generous free-tier bandwidth details.
- **Cloudflare Pages** — best if you're also using Cloudflare for DNS/security (fits well since you do cybersecurity work — good story for your own site too).

All three are genuinely free for a site like this (no credit card required, no traffic limits you'd realistically hit).
