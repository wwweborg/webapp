# Webapp

**English** · [Español](./README.es.md)

<p align="center">
  <img src="./docs/assets/logo.svg" width="88" height="88" alt="Webapp logo" />
</p>

<h3 align="center">Write with confidence.</h3>

<p align="center">
  A minimalist, privacy-first Markdown notes app with GitHub sync, multi-model AI and end-to-end encryption.<br />
  Part of the <strong>wwwOS</strong> ecosystem.
</p>

<p align="center">
  <a href="https://github.com/wwweborg/webapp/releases"><img alt="Version" src="https://img.shields.io/badge/version-0.1.2026--1411-006FFF?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-006FFF?style=flat-square" /></a>
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img alt="TypeScript 5.9" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <a href="./CONTRIBUTING.md"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" /></a>
  <a href="https://github.com/wwweborg/webapp/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/wwweborg/webapp?style=flat-square&color=006FFF" /></a>
  <a href="https://github.com/wwweborg/webapp/discussions"><img alt="GitHub Discussions" src="https://img.shields.io/github/discussions/wwweborg/webapp?style=flat-square&color=006FFF" /></a>
  <a href="https://github.com/wwweborg/webapp/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/wwweborg/webapp?style=flat-square&color=006FFF" /></a>
</p>

<p align="center">
  <img src="./docs/assets/hero.svg" alt="Webapp interface preview" width="100%" />
</p>

> [!NOTE]
> This is the first release of Webapp (`0.1.2026-1411`). The core app is functional and builds successfully, but the documentation site, public demo and multi-user OAuth flow are still on the roadmap. Feedback and contributions are very welcome.

---

## Table of contents

- [Why Webapp?](#why-webapp)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [How it works](#how-it-works)
- [AI providers](#ai-providers)
- [Privacy and security](#privacy-and-security)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Project structure](#project-structure)
- [Versioning](#versioning)
- [Roadmap](#roadmap)
- [Community](#community)
- [Contributing](#contributing)
- [Third-party assets](#third-party-assets)
- [License](#license)

---

## Why Webapp?

Most note apps ask you to trust their cloud. Webapp takes the opposite approach:

- **Your notes are plain Markdown files.** They live in a GitHub repository that you own and control.
- **No proprietary database.** If you stop using Webapp, your notes are still readable everywhere.
- **Privacy is optional but real.** You can encrypt individual notes or your entire vault with AES-256-GCM.
- **Your AI, your provider.** Use Gemini, OpenAI, Claude, Groq, DeepSeek, a local Ollama server, or any OpenAI-compatible endpoint.
- **It feels like a desktop app.** A calm, macOS-inspired interface with a command palette, focus mode and thoughtful details.

Webapp is the notes application of **wwwOS**, an open-source ecosystem being built around a consistent, macOS-inspired design language.

---

## Features

### Writing and organizing

- Markdown editor built on **Tiptap**, with rich-text editing and Markdown round-tripping.
- Tables, task lists, code blocks with syntax highlighting, images, highlights, wiki-links and nested sub-notes.
- Slash commands, emoji autocomplete and GitHub `@mention` autocomplete.
- Dashboard with **grid and list layouts**, pinned notes, custom colors, custom icons and emojis.
- Full-text search, command palette, note outline, live word/character/reading-time stats.
- Dedicated **Tasks** and **Calendar** views.
- **Focus mode** (typewriter-style writing) for distraction-free sessions.
- **10 interface languages**: Spanish, English, Portuguese, French, Dutch, Italian, German, Japanese, Chinese and Russian.

### Storage and sync

- Every note is a standard `.md` file stored in **your own GitHub repository**.
- Reads and writes go through the GitHub REST API using a server-side token.
- Commits are created automatically when you save a note.
- Note metadata (color, icon, pin, local cache) stays in your browser.
- Export a single note as Markdown or the whole vault as a ZIP archive.

### AI assistant

- **Petardo AI** can chat, improve, summarize and generate new notes.
- Works with multiple providers and models, including local models.
- Choose provider, model and base URL from the settings UI.
- API keys stay on the server, never in the browser bundle.

### Privacy and customization

- Optional **end-to-end encryption** with AES-256-GCM.
- Encrypted notes are stored as `ENC:v1:...` payloads in your GitHub repo.
- Light, dark and system themes; custom accent color.
- Google Fonts for UI and code; custom note typography colors and sizes.
- Icon packs: **Meteor Icons**, **Lucide**, **Material Symbols** and **Heroicons**.
- Emoji packs: system emojis or **Toss Face** ([license](./THIRD-PARTY-NOTICES.md)).

---

## Tech stack

| Layer | Technology |
| :--- | :--- |
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Motion](https://motion.dev/) |
| Language | [TypeScript 5.9](https://www.typescriptlang.org/) |
| Editor | [Tiptap 3](https://tiptap.dev/) with Markdown support |
| Storage | GitHub REST API via [Octokit](https://github.com/octokit/octokit.js) |
| AI | [Google Gen AI SDK](https://github.com/googleapis/js-genai) and OpenAI-compatible APIs |
| Crypto | Web Crypto API (AES-256-GCM + PBKDF2) |
| Icons | Iconify, Lucide and custom Meteor Icons |

---

## Quick start

### Requirements

- **Node.js 20+** (or **Bun 1.1+**)
- A GitHub account
- A GitHub repository for your notes (it can be private)
- Optional: an API key for at least one AI provider

### 1. Clone the repository

```bash
git clone https://github.com/wwweborg/webapp.git
cd webapp
```

### 2. Install dependencies

With Bun (recommended, the repo ships a `bun.lock`):

```bash
bun install
```

With npm:

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in at least the GitHub settings. See [Environment variables](#environment-variables) for the full list.

### 4. Run the development server

```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Build for production

```bash
bun run build
bun run start
```

> The project uses `output: 'standalone'` in `next.config.ts`, so the production server can also be run with `node .next/standalone/server.js` after copying `.next/static` and `public` if you deploy it that way.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values you need.

### GitHub (required for notes)

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GITHUB_TOKEN` | Yes | Personal Access Token with read/write access to the **notes** repository. A fine-grained token with `Contents: Read and write` is recommended. |
| `GITHUB_USER` | Yes | Owner of the notes repository (user or organization). |
| `GITHUB_REPO` | Yes | Name of the notes repository. |
| `APP_URL` | No | Public URL of the deployment. Used for canonical links and Open Graph metadata. |
| `APP_PASSWORD` | No | Enables an HTTP Basic authentication gate on every route. **Strongly recommended** for any deployment with real notes. Requires HTTPS. |
| `APP_USERNAME` | No | Username for the gate above. Defaults to `webapp`. |
| `ALLOW_INDEXING` | No | Set to `true` only for a public demo with sample notes. A normal deployment stays out of search engines. |

> [!IMPORTANT]
> The token is used by the server, not by the browser. Never expose it with a `NEXT_PUBLIC_` prefix and never commit `.env.local`.

> [!WARNING]
> A deployment is **single-tenant**: every visitor shares the notes repository configured by `GITHUB_TOKEN`, and the `/api/notes` routes have no per-user login yet. Do not publish a deployment with personal notes unless you set `APP_PASSWORD`, and keep `ALLOW_INDEXING` unset so search engines never index a page that renders your notes. See [SECURITY.md](./SECURITY.md).

### AI providers (all optional)

| Variable | Provider |
| :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini |
| `OPENAI_API_KEY` | OpenAI / OpenAI-compatible |
| `ANTHROPIC_API_KEY` | Anthropic Claude |
| `GROQ_API_KEY` | Groq Cloud (also used for Meta Llama) |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `CUSTOM_AI_BASE_URL` | Local or custom OpenAI-compatible endpoint (e.g. Ollama, LM Studio, vLLM) |
| `CUSTOM_AI_API_KEY` | Optional key for the custom endpoint |
| `CUSTOM_AI_MODEL` | Optional default model for the custom endpoint |

You only need to configure the providers you want to use. The app shows which providers are available.

---

## How it works

Webapp is a stateless Next.js application. It does not run its own notes database.

```text
┌──────────────────────────┐
│  Browser (Next.js UI)    │
│  settings + metadata     │
│  in localStorage         │
└────────────┬─────────────┘
             │  /api/notes
             ▼
┌──────────────────────────┐
│  Next.js server          │
│  Octokit + server token  │
└────────────┬─────────────┘
             │  GitHub REST API
             ▼
┌──────────────────────────┐
│  Your notes repository   │
│  folder/note.md          │
│  folder/note.md          │
└──────────────────────────┘
```

The AI assistant follows a similar path:

```text
Browser → /api/gemini/agent → AI provider API
```

API keys are resolved on the server from environment variables. The browser only sends the prompt, the selected provider/model and the current note context.

---

## AI providers

| Provider | Default model | Notes |
| :--- | :--- | :--- |
| Google Gemini | `gemini-2.5-flash` | Native Google Gen AI SDK |
| OpenAI | `gpt-4o` | OpenAI-compatible chat completions |
| Anthropic Claude | `claude-3-7-sonnet-20250219` | Anthropic Messages API |
| Groq | `llama-3.3-70b-versatile` | Very fast inference |
| DeepSeek | `deepseek-chat` | OpenAI-compatible API |
| Meta Llama | `llama-3.3-70b-versatile` | Through Groq or an OpenAI-compatible endpoint |
| Local / Custom | `llama3` | Ollama, LM Studio, vLLM, OpenRouter, Together, etc. |

You can change the model and base URL from **Settings → AI**.

---

## Privacy and security

- **No intermediate database.** Notes travel from your browser to your Next.js server and then to GitHub.
- **Optional E2EE.** When enabled, note content is encrypted in the browser before it is sent to GitHub. The server only sees ciphertext.
- **Master password.** The encryption key is derived from your master password and is not stored on the server. Losing the password means losing access to encrypted notes.
- **Token scope.** Use a fine-grained GitHub token limited to the notes repository, not a classic token with full account access.
- **Self-hosting.** You control the deployment and the environment variables.
- **Private by default.** Search engine indexing is disabled unless `ALLOW_INDEXING=true`, and `APP_PASSWORD` can put a password gate in front of the whole app.
- **Report a vulnerability.** Please read [SECURITY.md](./SECURITY.md) before disclosing security issues publicly.

> Webapp is a young project. A deployment is single-tenant until per-user OAuth exists, so anyone who can reach the URL can access the configured notes unless you set `APP_PASSWORD`. The encryption implementation has not been independently audited yet. Do not use it as the only copy of critical data.

---

## Keyboard shortcuts

Webapp includes a command palette and a set of keyboard shortcuts for navigation and writing.

- `Ctrl/Cmd + K` — open the command palette
- `Ctrl/Cmd + B` — toggle the sidebar
- `Ctrl/Cmd + ,` — open settings
- `Alt + N` — create a new note
- `Alt + T` — open tasks
- `Alt + Z` — toggle focus mode

See [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md) for the full list (currently in Spanish).

---

## Project structure

```text
webapp/
├── app/                  Next.js App Router pages and API routes
│   ├── api/              GitHub, AI, upload and user endpoints
│   ├── globals.css       Tailwind and global design tokens
│   ├── layout.tsx        Root metadata and layout
│   └── page.tsx          Main notes application
├── components/           Editor, sidebar, settings, AI, tasks and calendar UI
├── docs/assets/          Screenshots and documentation assets
├── hooks/                Shared React hooks
├── lib/                  i18n, crypto, settings, AI service and icon helpers
├── locales/              UI translations (10 languages)
├── public/               Icons, fonts and static files
├── .env.example          Environment variable template
├── next.config.ts        Next.js configuration
└── package.json
```

---

## Versioning

This release is tagged as **`v0.1.2026-1411`**.

The version string `0.1.2026-1411` is valid [Semantic Versioning 2.0.0](https://semver.org/):

- `0` = major
- `1` = minor
- `2026` = patch
- `1411` = pre-release identifier

The hyphen is allowed. One detail to keep in mind: SemVer treats `0.1.2026-1411` as a **pre-release of `0.1.2026`**, so a future `0.1.2026` without the suffix would be considered newer. If you ever want a date/build stamp that does not imply a pre-release, use build metadata instead, for example `0.1.2026+1411`. For now, the project uses the hyphenated form.

---

## Roadmap

Webapp is the first app in the **wwwOS** ecosystem. Planned work includes:

- [ ] Publish the documentation site and a live public demo.
- [ ] Add real screenshots and a short product video to this README.
- [ ] Improve onboarding for first-time self-hosters.
- [ ] Add multi-user GitHub OAuth so each visitor can connect their own notes repository.
- [ ] Expand the wwwOS design system and share it across future apps.
- [x] Add a CI workflow that runs lint, typecheck and build on every push.
- [ ] Add automated tests.
- [ ] Publish release notes and a public changelog.

Have an idea? Open an issue or start a discussion.

---

## Community

- **Questions, ideas and setups** → [GitHub Discussions](https://github.com/wwweborg/webapp/discussions).
  Best place for "how do I…", feature brainstorming and showing how you use Webapp.
- **Bugs** → [open an issue](https://github.com/wwweborg/webapp/issues/new/choose).
  The templates ask for the details needed to reproduce it.
- **Security problems** → read [SECURITY.md](./SECURITY.md) first. Never open a public issue.
- **Behaviour** → this project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).

If Webapp is useful to you, a ⭐ on the repository is the cheapest way to help
other people find it.

---

## Contributing

Contributions of all sizes are welcome: bug reports, translations, documentation, design improvements and code.

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md).
2. Fork the repository and create a branch.
3. Make your change and run `bun run lint`, `bun run typecheck` and `bun run build`.
4. Open a pull request with a clear description.

Please be kind and constructive. This project follows a simple rule: discuss ideas openly, review code respectfully.

---

## Third-party assets

The MIT license covers Webapp's source code. One asset bundled in this
repository has its own terms:

- **Toss Face** emoji font (`public/fonts/TossFaceFontMac.ttf`) is
  © 2022, 2023 Viva Republica (Toss), distributed under the
  [Toss Face License](https://toss.im/tossface/copyright). It is **not** MIT
  and **not** OFL. It is redistributed unmodified, together with its copyright
  notice and full license text, as that license requires.

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for details and
[`public/fonts/TossFace-LICENSE.txt`](./public/fonts/TossFace-LICENSE.txt) for
the full text. If you fork this project, keep those files with the font.

---

## License

Webapp is released under the [MIT License](./LICENSE).

You are free to use, modify and distribute it, including for commercial purposes, as long as you keep the copyright notice and license text.

---

<p align="center">
  Built with care by <a href="https://github.com/wwweborg">wwweborg</a>.<br />
  <a href="https://webapp.microtecn.xyz">Landing page</a> ·
  <a href="https://wadocs.vercel.app">Documentation</a> ·
  <a href="https://github.com/wwweborg/webapp/issues">Issues</a>
</p>
