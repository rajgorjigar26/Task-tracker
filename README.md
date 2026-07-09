# Task Matrix

A four-quadrant task tracker (IMP-ST / NIMP-ST / IMP-LT / NIMP-LT) with a home
dashboard, due dates, and custom categories. Data is saved in the browser via
`localStorage`, so it persists between visits on the same device/browser.

## Deploy in 5 minutes (no coding required)

**1. Push this folder to GitHub**
- Create a new repo at https://github.com/new
- Upload every file in this folder (drag-and-drop works on the repo page,
  under "Add file → Upload files")
- Commit

**2. Deploy on Vercel**
- Go to https://vercel.com and sign in with your GitHub account
- Click "Add New… → Project"
- Select this repo → Vercel auto-detects it's a Vite app → click "Deploy"
- Wait ~1 minute — you'll get a live URL like `task-matrix.vercel.app`

(Netlify works the same way if you prefer it: netlify.com → "Add new site →
Import an existing project" → pick the repo → deploy.)

**3. Install it on your Android phone**
- Open your live URL in Chrome
- Tap the ⋮ menu → "Add to Home Screen"
- It now behaves like an installed app, with its own icon

## Running it locally (optional)
```
npm install
npm run dev
```
