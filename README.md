# Vibe Deck plugins

The **market** of [Vibe Deck](https://github.com/StefanoDiPatti/vibe-deck): widgets and pages anyone can install from the
control panel of the deck with one tap. Browse it on the site: **https://stefanodipatti.github.io/vibe-deck/#market**

## What can go in the market

Only **JSON plugins**: widgets (`widgets/*.json`), pages (`pages/*.json`), translations (`lang/*.json`), `home.json` and
`plugin.json`. **No code, no commands, no apps**: a plugin from the market can't run programs on your PC. Every package
has a sha256 fingerprint in `index.json` and the deck refuses it if it doesn't match.

A widget that reads from the internet must list the site in `permissions.http` of `plugin.json`; the deck shows it before
installing ("reads from api.example.com"). Only public addresses **without API keys or logins**: services that need them
stay plugins with code, installed by hand.

## Propose a widget

1. Make it in the control panel of your deck: card **Crea un widget**.
2. In **I tuoi widget** press **Proponi al market**: the site opens with your widget ready, and you choose whether to send
   it or keep it for yourself.
3. Or open an issue with the **Propose a widget** form, or a pull request with a folder in `plugins/<id>/`.

Every proposal is checked (same validator as the deck) and approved by hand before it goes in.

## Layout

```
plugins/<id>/plugin.json          id, name, version, author, description, engine, permissions
plugins/<id>/widgets/*.json       JSON widgets (see "JSON widgets" in the Vibe Deck README)
plugins/<id>/lang/en.json         English texts and "$rules"
packages/<id>-<version>.vdp.json  generated: the package the deck downloads
index.json                        generated: the list the deck and the site read
```

After changing a plugin:

```bash
node scripts/build.js --dock ../vibe-deck/app          # validate with the deck and regenerate
node scripts/build.js --check --dock ../vibe-deck/app  # what CI runs
```

License: MIT.
