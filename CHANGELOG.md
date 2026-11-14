# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.2026-1411] - 2026-11-14

First public release of Webapp, the notes application of the **wwwOS** ecosystem.

### Added

- Markdown editor built on Tiptap with tables, task lists, code blocks, images, highlights, wiki-links and nested sub-notes.
- GitHub-backed storage: notes are read from and committed to a repository you own.
- Dashboard with grid and list layouts, pinned notes, custom colors, icons and emojis.
- Full-text search, command palette, note outline and live writing statistics.
- Dedicated Tasks and Calendar views.
- Focus mode for distraction-free writing.
- Multi-provider AI assistant (Petardo AI): Google Gemini, OpenAI, Anthropic Claude, Groq, DeepSeek, Meta Llama and local/OpenAI-compatible endpoints.
- Optional end-to-end encryption with AES-256-GCM and PBKDF2 key derivation.
- Markdown and ZIP vault export.
- Ten interface languages: Spanish, English, Portuguese, French, Dutch, Italian, German, Japanese, Chinese and Russian.
- Customization: light/dark/system themes, accent color, Google Fonts, note typography colors, icon packs and emoji packs.
- Keyboard shortcuts and a universal command palette.
- Open-source documentation: English and Spanish README, contributing guide, security policy and MIT license.
- GitHub Actions workflow that runs lint, typecheck and build on every push and pull request.
- Third-party license notices for the bundled Toss Face emoji font, which is redistributed under its own license and is not covered by MIT.

### Fixed

- Corrected the Octokit method used for the authenticated user's following list (`listFollowedByAuthenticatedUser`).
- Fixed Tiptap `NodeViewContent` typing for code blocks.
- Added missing translation keys for the note color settings and sidebar labels in all supported locales.
- Removed type errors caused by redundant `view === 'settings'` checks in the sidebar.
- Fixed React hooks lint errors around encryption and export callbacks.
- Removed a non-existent jsDelivr fallback URL from the Toss Face `@font-face` declarations.
- Replaced the invalid `next clean` npm script with a cross-platform Node command.

### Known limitations

- Multi-user GitHub OAuth is not implemented yet: a deployment is connected to one notes repository through server-side environment variables.
- The encryption implementation has not been independently audited.
- The documentation site and public demo are still on the roadmap.

[0.1.2026-1411]: https://github.com/wwweborg/webapp/releases/tag/v0.1.2026-1411
