# Lorebook

A gamer's library of journals for iPhone. One book per game, dated notes, screenshots, a bookshelf you can restyle,
six library themes, XP & achievements, and a little window that shows the real weather and time of day outside.

Everything is a static web app (no build step, no server, no API keys). Your data never leaves the phone.

## Put it on GitHub (same way as the other apps)

1. Create a new **public** repository, e.g. `lorebook`.
2. Upload **everything inside this folder**, keeping the folder structure:
   `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`, the `js/` folder and the `icons/` folder.
3. Repo **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`** → Save.
4. After a minute your app is at `https://YOUR-USERNAME.github.io/lorebook/`.

## Install on iPhone

1. Open that address in **Safari**.
2. Tap **Share → Add to Home Screen → Add**.
3. Launch it from the Home Screen icon. It runs full-screen and works offline after the first load.

The first launch asks for your location (only to fetch weather & sunrise/sunset from the free Open-Meteo service).
You can skip it, or search for a city instead, and change it any time in Settings.

## Notes

- **Rotation:** iOS ignores orientation locks for web apps, so if the phone is turned sideways Lorebook counter-rotates
  itself and stays exactly as it looks in portrait.
- **Sound:** all effects are synthesised on the device. iOS mutes web audio when the side Ring/Silent switch is on silent.
- **Backups:** Settings → Backup & restore → *Create backup* produces a single `.json` file (notes + pictures + book
  designs + XP). Save it to Files or AirDrop it to yourself. *Restore* can merge into, or replace, the current library.
- **Updating:** upload the new files to the repo. Lorebook checks the network first, so the next open gets the new version.
