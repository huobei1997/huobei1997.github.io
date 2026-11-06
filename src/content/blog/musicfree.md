---
title: "Getting around regional music restrictions with MusicFree"
summary: "Installing MusicFree on an Apple-silicon Mac, fixing the \"app is damaged\" error, and adding plugin sources."
date: 2025-11-20
tags: ["Tools"]
minutes: 2
cover: /blog/musicfree/cover.jpg
coverAlt: "MusicFree search results"
---

If you work outside mainland China, most of your NetEase Cloud or QQ Music library is greyed out. After trying a few workarounds I settled on **MusicFree**, an open-source player that stores no music of its own and pulls everything through plugins.

## 1. What MusicFree is

- **A shell, not a service.** The app ships with no song data at all.
- **Plugin-based.** JavaScript plugins give it access to the audio APIs of NetEase, QQ, Kugou, Bilibili and others.
- **No ads, no membership tiers.** Fully open source.

## 2. Install

Download from the [project's GitHub releases](https://github.com/maotoumao/MusicFree). On Apple silicon (M1 and later) take the `.arm64.dmg` build.

> **Error · "MusicFree is damaged and can't be opened"**
>
> The app isn't damaged. macOS Gatekeeper blocks it because it carries no Apple developer signature. Clear the quarantine attribute:
>
> ```bash
> sudo xattr -cr /Applications/MusicFree.app
> ```
>
> If you haven't moved it to Applications yet, type the command with a trailing space and drag the app icon into Terminal — the path completes itself. Your password won't echo as you type it.

Open the app again and it starts normally.

## 3. Add a plugin source

Nothing is searchable until a plugin is installed.

1. Open **Plugin management** in the left sidebar.
2. Choose **Install from network**.
3. Paste a plugin-source JSON URL, for example the [maintainer's aggregate source](https://raw.gitcode.com/maotoumao/MusicFreePlugins/raw/master/plugins.json).

Plugin sources come and go; if that URL has stopped working, search for a current one.

## 4. In use

![MusicFree search results across several music platforms](/blog/musicfree/interface.jpg)

- **Playlist import** — paste a NetEase or QQ Music playlist link and it syncs.
- **Lossless download** for most tracks.
- **Lyrics**, including a desktop overlay, plus cover art.

Worth the ten minutes if you listen to music that your region has decided you shouldn't.
