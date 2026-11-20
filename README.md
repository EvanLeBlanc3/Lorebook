# Lorebook v1.1

A gamer's library of journals for iPhone. One book per game, dated notes, screenshots, a bookshelf you can restyle,
eleven library themes, XP & achievements, and a little window that shows the real weather and time of day outside.

Everything is a static web app (no build step, no server, no API keys). Your data never leaves the phone.

## What's new in 1.1
- **The window matches your room.** Every theme has its own window frame, view, sill ornament and shutters/curtains
  (castle, neon skyline, graveyard & mansion, moonscape, forest, dungeon bars, snowy cabin, galleon at sea, Fuji & torii,
  pyramids, steampunk skyline with a working clock) — all still driven by the real weather and time of day.
- **Five new themes:** Cozy Cabin, Captain's Quarters, Sakura Dojo, Pharaoh's Vault, Steampunk Study (11 in total).
- **Book designer keeps the preview pinned** at the top while the options scroll underneath.
- **Casual shelves:** books lean on each other and lie flat in little stacks. Choose *Tidy*, *Casual* or *Messy*,
  and tap *Reshuffle the mess* for a new arrangement.
- **Search** the shelf by title, platform or text inside your notes, and **sort** it by your own order, recent activity,
  A–Z / Z–A, newest / oldest, most entries, platform, rainbow (cover colour) or height.

## Put it on GitHub (same way as the other apps)
1. Create a new **public** repository, e.g. `lorebook` (or reuse the old one and replace the files).
2. Upload **everything inside this folder**, keeping the folder structure:
   `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`, the `js/` folder and the `icons/` folder.
3. Repo **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`** → Save.
4. After a minute your app is at `https://YOUR-USERNAME.github.io/lorebook/`.

## Install on iPhone
1. Open that address in **Safari**.
2. Tap **Share → Add to Home Screen → Add**.
3. Launch it from the Home Screen icon. It runs full-screen and works offline after the first load.

If you are updating an installed copy, open it once while online (it checks the network first), then close and reopen it.

## Notes
- **Rotation:** iOS ignores orientation locks for web apps, so if the phone is turned sideways Lorebook counter-rotates
  itself and stays exactly as it looks in portrait.
- **Sound:** all effects are synthesised on the device. iOS mutes web audio when the side Ring/Silent switch is on silent.
- **Backups:** Settings → Backup & restore → *Create backup* produces a single `.json` file (notes + pictures + book
  designs + XP). *Restore* can merge into, or replace, the current library.
