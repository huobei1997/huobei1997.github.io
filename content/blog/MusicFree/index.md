---
title: 🎧 Unlocking Music in HK: A Setup Guide for MusicFree on macOS
summary: A comprehensive guide on using the open-source tool MusicFree to aggregate music resources. Covers installation on Apple Silicon and fixing the "App Damaged" Gatekeeper error.
date: 2025-11-20

# Featured image
image:
  caption: 'Screenshot: MusicFree Interface'

authors:
  - admin

tags:
  - Music
  - Tools
  - Open Source
  - Mac

content_meta:
  trending: true
---

Upon arriving in Hong Kong for my PhD, I encountered a significant daily annoyance: **regional restrictions on music streaming**. Most of my playlists on NetEase Cloud Music and QQ Music turned "grey" (unavailable) due to licensing issues.

After experimenting with various VPNs and workarounds, I settled on **MusicFree**, an open-source project. It doesn't host music itself but aggregates resources from multiple platforms via plugins. This post documents the configuration process, specifically for macOS Apple Silicon users.

{{< toc mobile_only=true is_open=true >}}

## 1. What is MusicFree?

MusicFree acts essentially as a **local player shell**.

* **Decentralized**: The software itself contains no song data.
* **Plugin-based**: By importing JavaScript plugins, it fetches audio interfaces from platforms like NetEase, QQ, Kugou, and Bilibili.
* **Ad-Free**: Completely open-source and free, with no pop-ups or membership restrictions.

## 2. Download & Installation

You can download the installer from the project's repository or the mirror link provided below.

* **Project Repo**: [MusicFreeDesktop on GitHub](https://github.com/maotoumao/MusicFreeDesktop)
* **For Mac Users**: If you are using an M-chip (M1/M2/M3/M4), please download the `.arm64.dmg` package.
    * [Download Link (Feishu Mirror)](https://r0rvr854dd1.feishu.cn/drive/folder/GBPgfIRA4luHFKdTmOfcv6H9nXe)

> [!WARNING]+ Common Error: "App is Damaged"
> When installing non-App Store software on macOS (especially Apple Silicon), you will likely encounter this Gatekeeper alert upon first launch:
>
> **“MusicFree” is damaged and can’t be opened. You should move it to the Bin.**
>
> This **does not** mean the file is corrupted. It is simply macOS blocking an unsigned open-source application.

### ✅ The Fix

We need to use a terminal command to remove the file's "quarantine attribute."

1.  Open **Terminal**.
2.  Type the following command (ensure there is a **space** after `cr`):
    ```bash
    sudo xattr -cr /Applications/MusicFree.app
    ```
3.  Enter your system password and hit Enter.

> [!NOTE]
> If you haven't moved the app to the "Applications" folder yet, type `sudo xattr -cr ` (with the space), then drag and drop the MusicFree icon directly into the terminal window to auto-complete the path.

Once done, relaunch the app, and it should open normally.

## 3. Configuring Plugins (Core Step)

Upon first launch, the interface will be empty. You must import plugins to enable search functionality.

1.  Click on **"Plugin Management"** (the puzzle icon 🧩) in the sidebar.
2.  Click **"Install from Network"**.
3.  Copy and paste the following JSON link:

> [!TIP]+ Recommended Plugin Source
> This is a comprehensive aggregation source:
>
> ```text
> [https://raw.gitcode.com/maotoumao/MusicFreePlugins/raw/master/plugins.json](https://raw.gitcode.com/maotoumao/MusicFreePlugins/raw/master/plugins.json)
> ```
>
> *Note: If the link above fails, you can search Google for "MusicFree plugins json".*

After clicking install, you should see the status of various platforms turn to **"On"**.

## 4. Experience

Once configured, click the **Search** icon to aggregate results from all platforms.

**Key Features:**
* **Playlist Import**: Supports pasting links from NetEase or QQ Music to sync your collections.
* **High-Res Audio**: Most tracks support lossless downloads.
* **Lyrics**: Supports desktop lyrics and cover art display.

For students overseas or in copyright-restricted regions, this is arguably the most elegant solution available.

Happy Listening! 🎵