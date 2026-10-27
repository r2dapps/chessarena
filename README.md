# Chess Arena 3D

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Launch%20Arena-38bdf8?style=flat-square)](https://razeltech.github.io/chessarena/)
[![Three.js](https://img.shields.io/badge/WebGL-Three.js%20r186-000000?style=flat-square&logo=three.js)](https://threejs.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Capable-6366f1?style=flat-square)](#progressive-web-application)
[![PeerJS](https://img.shields.io/badge/Networking-PeerJS%20WebRTC-f59e0b?style=flat-square)](https://peerjs.com/)
[![License](https://img.shields.io/badge/License-MIT%20Attribution-10b981?style=flat-square)](./LICENSE)
[![Powered By](https://img.shields.io/badge/Powered%20By-Razel%20Tech-f43f5e?style=flat-square)](https://razeltech.github.io)

**Live Demo:** [https://razeltech.github.io/chessarena/](https://razeltech.github.io/chessarena/)  
**Repository:** [https://github.com/razeltech/chessarena](https://github.com/razeltech/chessarena)

*Created and maintained by [Razel Tech](https://razeltech.github.io)*

---

## Overview

**Chess Arena 3D** is an open-source, zero-backend 3D chess simulator built with Three.js WebGL graphics, procedural AI Web Worker engine, and PeerJS WebRTC peer-to-peer multiplayer. Designed for browser performance, the application functions offline as an installable Progressive Web Application (PWA).

---

## Key Features

- **3D & 2D Top-Down Modes**: Toggle between cinematic 3D perspective with smooth camera orbit controls and a responsive 2D orthographic tournament view.
- **6 High-Contrast Board Themes**:
  - *Walnut & Maple*: Traditional warm acoustic woodgrain with dark walnut and honey maple.
  - *Tournament Emerald & Buff*: FIDE World Championship standard forest green and parchment cream.
  - *Royal Navy & Ice*: Midnight cobalt navy with luminous ice pearl.
  - *Obsidian & Carrara Marble*: High-specular Belgian black marble and pure white Italian Carrara marble.
  - *Crimson Rosewood & Ivory*: Rich antique wine rosewood and soft antique ivory.
  - *Slate & Zinc*: Minimalist industrial neutral slate.
- **Web Worker AI Engine**:
  - Zero UI thread blocking using a dedicated `ai-worker.js`.
  - Minimax algorithm with Alpha-Beta pruning, MVV-LVA move ordering, and Quiescence search.
  - 5 configurable difficulty profiles ranging from Casual Beginner to Deep Master search.
- **P2P Multiplayer**: Real-time room-code based matchmaking over WebRTC data channels via PeerJS with zero game server requirement.
- **Progressive Web Application (PWA)**:
  - Two-tier Service Worker caching: fast shell caching with persistent offline storage for large 3D models (`ChessBoard.glb` and HDR lighting).
  - Installable on desktop (Chrome, Edge) and mobile (Android, iOS Home Screen).

---

## Technical Stack

| Layer | Technologies |
| :--- | :--- |
| **3D Rendering** | Three.js (r186), WebGL, GLTFLoader, RGBELoader |
| **Physics / Move Engine** | Pure JavaScript 64-element `Int8Array` bitwise coordinate engine (`engine.js`) |
| **AI Computation** | Web Workers, Minimax, Alpha-Beta Pruning, Quiescence Search |
| **Networking** | PeerJS (WebRTC DataChannels) |
| **Build & Bundle** | esbuild |
| **Storage / Offline** | Cache API, Service Worker, Web App Manifest |

---

## Local Development

1. Clone repository:
   ```bash
   git clone https://github.com/razeltech/chessarena.git
   cd chessarena
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build production bundle:
   ```bash
   npx esbuild app.src.js --bundle --minify --outfile=app.bundle.js
   ```

4. Serve locally:
   ```bash
   npx serve .
   ```

---

## License & Attribution

Copyright (c) 2026 **[Razel Tech](https://razeltech.github.io)**. All rights reserved.

Licensed under the **MIT License with Mandatory Author Attribution**. Any public deployment, mirror, or distribution must attribute the author as **Razel Tech** and include an active hyperlink to [https://razeltech.github.io](https://razeltech.github.io).
