---
title: 🎧 解决香港音乐版权限制：MusicFree 配置指南与 Mac 常见报错修复
summary: 记录如何在香港使用开源软件 MusicFree 聚合全网音乐资源，重点记录解决 macOS M 芯片提示“文件已损坏”的终端修复方法。
date: 2025-11-20

# Featured image
# Place an image named `featured.jpg` or `featured.png` in this page's folder and customize its options here.
image:
  caption: 'Screenshot: MusicFree Interface'

authors:
  - admin

tags:
  - Mac
  - Tools
  - Music
  - Open Source

content_meta:
  trending: true
---

来到香港读博后，发现生活上最大的痛点之一就是**音乐版权限制**。习惯用的网易云和 QQ 音乐，大部分歌单都因为地区限制变灰了。

在尝试了各种方案后，我最终锁定了 **MusicFree** 这个开源项目。它不存储音乐，而是通过插件聚合了全网资源。这篇博客主要记录配置过程，以及如何解决 Mac M 芯片上遇到的“文件已损坏”报错。

{{< toc mobile_only=true is_open=true >}}

## 1. 什么是 MusicFree？

MusicFree 本质上是一个**本地播放器空壳**。

* **去中心化**：软件本身没有任何歌曲数据。
* **插件化**：通过导入 JavaScript 插件，它可以从网易云、QQ、酷狗、B站等平台抓取音频接口。
* **无广告**：完全开源免费，没有各种弹窗和会员限制。

## 2. 下载与安装

前往项目的 GitHub Releases 页面下载对应版本的安装包。

* **项目地址**：[MusicFree Desktop](https://github.com/maotoumao/MusicFreeDesktop)
* **Mac 用户**：请下载 `.dmg` 安装包。

> [!WARNING]+ 常见报错：文件已损坏
> 在 macOS（尤其是 M1/M2/M3 芯片）上安装并首次打开时，系统经常会弹出以下拦截提示：
>
> **“MusicFree” is damaged and can’t be opened. You should move it to the Bin.**
>
> 这并不是软件真的坏了，而是 macOS 的 Gatekeeper 机制拦截了没有苹果官方签名的开源软件。

### ✅ 修复方法

我们需要使用终端命令来移除文件的“隔离属性”。请按照以下步骤操作：

1.  打开 **Terminal (终端)**。
2.  输入以下命令（注意 `cr` 后面有一个空格）：
    ```bash
    sudo xattr -cr /Applications/MusicFree.app
    ```
3.  输入电脑密码并回车。

> [!NOTE]
> 如果你没有把软件拖进“应用程序”文件夹，也可以先输入 `sudo xattr -cr `，然后直接把 MusicFree 的图标拖进终端窗口，路径会自动补全。

完成后重新点击 APP，即可正常打开。

## 3. 配置插件源 (核心步骤)

打开软件后，你需要导入插件才能搜索歌曲。

1.  点击左侧侧边栏的 **“插件管理”** (🧩 图标)。
2.  点击 **“从网络安装”**。
3.  复制以下 JSON 链接填入：

> [!TIP]+ 推荐插件源
> 这是一个收录比较全的聚合源（包含网易、腾讯、酷我、咪咕等）：
>
> ```text
> [https://gitlab.com/acoolbook/musicfree/-/raw/main/full.json](https://gitlab.com/acoolbook/musicfree/-/raw/main/full.json)
> ```
>
> 如果上方链接失效，可以使用 GitHub 原始源：
> `https://raw.githubusercontent.com/maotoumao/MusicFreePlugins/master/plugins.json`

点击安装后，你应该能看到各个平台的插件状态变为 **“开启”**。

## 4. 使用体验

配置完成后，点击左侧的 **搜索** 图标，即可聚合搜索全网音乐。

**主要功能推荐：**
* **导入歌单**：支持直接粘贴网易云或 QQ 音乐的歌单链接，同步你的收藏。
* **高音质下载**：大部分歌曲支持无损音质下载。
* **歌词显示**：支持桌面歌词和封面显示。

对于在海外或者特定版权受限地区的同学，这绝对是目前最优雅的解决方案之一。

Happy Listening! 🎵