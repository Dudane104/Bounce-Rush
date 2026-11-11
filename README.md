# Bounce Rush V12 — multiplayer quick start

## Why the supplied address is not connecting

On 11 November 2026, an HTTP check of `https://bounce-rush.yyh8n5f654.workers.dev/` returned the V11 game HTML. `/health` returned HTTP 404. This is consistent with a static game upload rather than the supplied room-server deployment. A game page on that address does not by itself provide multiplayer rooms.

V12 includes a combined Cloudflare Worker: it serves the game at `/`, the server check at `/health`, room creation at `/create`, and live WebSocket rooms at `/room/CODE`. Deploy this package to the existing **bounce-rush** Worker. The client already contains your address.

## Easiest route: the dedicated Cloudflare ZIP

1. Unzip **BOUNCE_RUSH_V12_CLOUDFLARE.zip**. Open its `Bounce_Rush_Cloudflare_V12` folder. Its contents must be at your GitHub repository root: `worker.mjs`, `wrangler.toml`, `package.json`, and `public/index.html` plus the included headers/guide. Upload the unpacked contents, not the ZIP itself. The bundled `worker.mjs` contains the shared physics and both game modes, so this small package does not need a separate engine file.
2. In Cloudflare, open your existing **bounce-rush** Worker. Connect that repository using **Settings → Builds**, or import the repository as a Worker if the interface offers that route. Set **root directory to the repository root** and **deploy command to `npx wrangler@latest deploy`**. There is no separate build command. Do not use the static-assets-only upload or a Pages project for this step. Wrangler must deploy the JavaScript and its configuration, not just `index.html`.
3. Deploy. The included `wrangler.toml` configures the `ROOMS` Durable Object binding, `RaceRoom` SQLite migration, and `ASSETS` static binding automatically. Keep these sections. The Worker name is `bounce-rush`, matching your supplied address. Do not change the names of your other game Workers.
4. Open `https://bounce-rush.yyh8n5f654.workers.dev/health` in Safari. It should return JSON containing `"game":"Bounce Rush"`, `"role":"multiplayer-server"`, `"version":12`, and `"rooms":true`. Opening the root address should show the playable V12 game. You can play directly from that Cloudflare page; Netlify is optional. If `/health` is 404, HTML, or an old version, the right backend has not been deployed yet.
5. Open the new game → **Online Race → Check connection**. Once it reports V12, choose **Create Room**. Friends choose **Join Room** using your six-character code. The host chooses **Distance Race** or **Jump & Duck**, everyone selects **Ready**, and the host selects **Start Race**. Enable CPU fill if testing alone.

GitHub on iPad: use Safari's desktop-site mode. If folder upload is unavailable, create the file paths manually with **Add file → Create new file**, including `public/index.html`, and paste each file's contents from Koder. A computer or GitHub Codespaces makes uploading the small project easier. Do not paste the game HTML into the JavaScript Worker editor.

## Terminal / Codespaces alternative

From the unpacked dedicated Cloudflare folder, using current Node.js LTS:

```bash
npm install
npx wrangler login
npx wrangler deploy
```

Follow Cloudflare's login prompts in your own browser. The final deploy must target the `bounce-rush` Worker. The package uses the current Wrangler release on installation; commit the generated package lockfile if you want later installs to resolve identically.

## If you use the full source ZIP instead

Upload the contents of `Bounce_Rush_V12` at the repository root. Set Cloudflare root directory to **`server`** and deploy with **`npx wrangler@latest deploy`**. That configuration bundles `server/worker.mjs` and `server/engine.mjs`, and serves assets from `../client`. The standalone Cloudflare ZIP uses a bundled Worker and `public` instead. Do not mix those two directory layouts.

Your Netlify game can continue to use the same Cloudflare server. Deploy **BOUNCE_RUSH_V12_NETLIFY.zip** for the Netlify client only. Do not replace the full PJC Games Hub with this standalone game's package. With the full repository, Netlify's supplied settings run `python3 build.py` and publish `client`. Editing `client/app.js` requires rebuilding the HTML; deploy the updated backend too whenever the generation version changes.

## What the checks mean

| Check connection result | What to do |
| --- | --- |
| Connected to Bounce Rush V12 | Create a room or join the host's code. |
| Game page / no multiplayer data / HTTP 404 | Deploy the JavaScript Worker and its configuration; uploading HTML alone is insufficient. |
| Server version differs | Deploy V12 backend, refresh every player's game, then create a new room. |
| ROOMS binding missing | Deploy using the supplied `wrangler.toml`, preserving `RaceRoom` and its SQLite migration. |
| Cannot reach server | Check connection, Cloudflare deployment logs, CORS, and the saved Server settings address. The backend sends CORS headers; a static upload may not. |
| Room fails after a healthy check | Check the code, room capacity (four), and whether the race already started. Create a fresh room if necessary. |

The address is built in. V12 resets stale stored addresses to your supplied address once. You can still choose a different address later under Server settings.

## Hosting limits and verification

The code has automated physics, three-obstacle, HTTP routing, connection-error and four-client simulation tests. The supplied live URL was diagnosed, but V12 has not been deployed into your account in this session. A real 2–4 device match must still be checked after deployment, along with iPhone/iPad Safari gestures and frame rate. Local Wrangler integration was not run here.

Both modes use server-controlled state and a shared seeded course. Clients submit input intents, not lives or scores. The server waits for course loading acknowledgements, with a 15-second timeout, before a shared three-second countdown. Disconnection or backgrounding forfeits that run immediately; it cannot pause the others. Rejoin between matches. Rematches return everyone to the room and reset readiness. Rooms expire after six hours; deployments/restarts do not restore an active race.

Active WebSockets and the fixed-step simulation consume applicable Cloudflare usage allowances; the service does not hibernate. Close rooms when finished and check account usage before broad sharing. Do not commit API tokens or passwords to GitHub or put them in the game.

Official setup references checked 11 November 2026:

- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
