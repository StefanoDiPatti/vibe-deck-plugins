# Vibe Deck plugins

The **market** of [Vibe Deck](https://github.com/StefanoDiPatti/vibe-deck): ready-made packs, widgets and pages anyone can
install on the deck. Browse it on the site: **https://stefanodipatti.github.io/vibe-deck/market.html** (search, categories,
packs first); **Install** opens the control panel of your deck to confirm.

## What can go in the market

Only **JSON plugins**: widgets (`widgets/*.json`), pages (`pages/*.json`), translations (`lang/*.json`), `home.json` and
`plugin.json`. **No code, no commands, no apps**: a plugin from the market can't run programs on your PC. Every package
has a sha256 fingerprint in `index.json` and the deck refuses it if it doesn't match.

A widget that reads from the internet must list the site in `permissions.http` of `plugin.json`; the deck shows it before
installing ("reads from api.example.com"). Only public addresses **without API keys or logins**: services that need them
stay plugins with code, installed by hand.

## Propose a widget

1. Make it in the **[widget editor](https://stefanodipatti.github.io/vibe-deck/create.html)** on the site.
2. At the end write your name or nickname (it becomes the **author** shown in the market) and press **Propose on GitHub**:
   the **Propose a widget** form opens already filled in. Or keep it just for you with **Add to my deck**.
3. Or open a pull request with a folder in `plugins/<id>/`.

Every proposal is checked (same validator as the deck) and approved by hand before it goes in.

## Layout

```
plugins/<id>/plugin.json          id, name, version, author, description, engine, permissions
plugins/<id>/widgets/*.json       JSON widgets (see "JSON widgets" in the Vibe Deck README)
plugins/<id>/lang/en.json         English texts and "$rules"
packs/<id>.json                   a pack: { id, name, description, author, icon, tags, includes: [plugin ids] }
packages/<id>-<version>.vdp.json  generated: the package the deck downloads
index.json                        generated: the list the deck and the site read
```

After changing a plugin:

```bash
node scripts/build.js --dock ../vibe-deck/app          # validate with the deck and regenerate
node scripts/build.js --check --dock ../vibe-deck/app  # what CI runs
node scripts/verify.js --dock ../vibe-deck/app         # live check: every widget shows real data
node scripts/verify.js --dock ../vibe-deck/app --only finanza
```

`verify.js` asks the deck for a preview of every widget with today's data and reports empty values, empty lists,
unresolved placeholders and sites that don't answer (public APIs have rate limits: check one plugin with `--only`).
Widgets with the PC data (`pc` source) are checked on the deck itself.

## Packs

Ready-made groups of plugins, shown first on the site; **Install pack** installs the ones still missing. A pack has a name
different from every plugin, includes at least 2 plugins, and every plugin is in at most one pack.

| Pack | Plugins |
|---|---|
| Music pack | Music charts, Music controls |
| Gamer pack | Steam players, Game deals |
| Developer news pack | Service status, Developer news, Hacker News |
| Finance pack | Finance, Crypto |
| Science and news pack | Space and science, Earthquakes, Curiosities |
| Everyday pack | Weather extra, Quick links, Shortcuts, Voice, System |

## Catalog

| Plugin | Widgets |
|---|---|
| Service status | 18 status dots: Claude, OpenAI, GitHub, Discord, Cloudflare, npm, Vercel, Netlify, Docker, Reddit, Zoom, Dropbox, Figma, Epic Games, Twitch, Linear, Notion, Atlassian |
| Steam players | 10: Counter-Strike 2, Dota 2, PUBG, Apex Legends, GTA V, Rust, Baldur's Gate 3, Helldivers 2, Team Fortress 2, Marvel Rivals |
| Game deals | Steam specials, Epic Games promotions, free games (GamerPower), best deals (CheapShark) |
| Music charts | top songs, albums and podcasts in Italy, top songs in the US, most listened radios |
| Music controls | buttons and voice commands |
| Developer news | Lobsters, dev.to, Show HN, Ask HN, npm downloads (React, Vue, Svelte), latest Node.js, VS Code, Deno, Bun, Godot, Rust, Python, Node.js versions |
| Finance | euro exchange rates, EUR/USD, trending coins, crypto market, Ethereum, Solana, Dogecoin |
| Crypto | Bitcoin, BTC and ETH |
| Space and science | ISS position, space news, next launches, earthquakes in Italy (INGV) |
| Earthquakes | latest earthquakes in the world (USGS) |
| Weather extra | air quality, fine dust, UV index, sunrise and sunset, sea waves, rain in the next hours |
| Curiosities | quote of the day, programmer jokes, dad jokes, useless facts, advice |
| Formula 1 | drivers and constructors standings, next Grand Prix |
| Hacker News | front page |
| Shortcuts | windows, virtual desktops, browser, text, VS Code, YouTube, Teams, Zoom, Meet, File Explorer, screenshots, emoji and clipboard |
| Quick links | AI, Google, social, streaming, game stores, developer sites, shopping, Microsoft 365, maps and travel |
| Voice commands | browser, Windows, YouTube, search on YouTube, search on Wikipedia |
| System | CPU and GPU temperature, download, upload, RAM, video memory |

License: MIT.
