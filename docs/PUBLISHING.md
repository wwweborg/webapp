# Publishing and discoverability checklist

The goal is that **the repository, the landing page and the documentation site**
are easy to find. The **app deployment** is not: a deployment holds someone's
personal notes, so it stays out of search engines on purpose.

| Surface | Public? | Indexed? |
| :--- | :--- | :--- |
| `github.com/wwweborg/webapp` | Yes, once public | Yes, automatically |
| Landing page (`webapp.microtecn.xyz`) | Yes | Yes |
| Docs site (`wadocs.vercel.app`) | Yes | Yes |
| An app deployment with real notes | No | **No** (`ALLOW_INDEXING` unset) |
| A demo deployment with sample notes | Optional | Yes (`ALLOW_INDEXING=true`) |

Steps marked **[UI]** happen in the GitHub web interface; everything else is in
this repository.

---

## 1. Before making the repository public

Run these from the repository root. All three must pass.

```bash
bun run lint
bun run typecheck
bun run build
```

Check that nothing private is about to be published:

```bash
# Local notes and planning files must not appear here
git ls-files | grep -Ei "notes|draft|internal|\.env$" || echo "clean"

# Scan the tracked files for accidental secrets
git grep -n -I -E "sk_live|sk_test|whsec_|ghp_|github_pat_|AIza[0-9A-Za-z_-]{30,}|BEGIN [A-Z ]*PRIVATE KEY" || echo "no secrets found"

# Confirm the Toss Face font travels with its license
git ls-files public/fonts
```

Expected output: `public/fonts/TossFace-LICENSE.txt` and
`public/fonts/TossFaceFontMac.ttf`. Both must stay together, see
[THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md).

---

## 2. Make the repository public **[UI]**

`Settings` → `General` → scroll to `Danger zone` → `Change repository
visibility` → `Change to public`.

Without this step Google cannot index the repository, GitHub search ignores it
and topics have no effect.

---

## 3. Repository metadata **[UI]**

On the repository home page, click the gear next to **About**.

**Description**

```text
Minimalist, privacy-first Markdown notes app with GitHub sync, multi-model AI and end-to-end encryption. Part of the wwwOS ecosystem.
```

**Website**

```text
https://webapp.microtecn.xyz
```

**Topics** (20, the maximum GitHub allows)

```text
markdown notes note-taking markdown-editor nextjs react typescript tiptap
github github-sync ai gemini openai e2ee encryption privacy self-hosted
open-source macos wwwos
```

**Social preview**

`Settings` → `General` → `Social preview` → upload
[`docs/assets/social-preview.png`](./assets/social-preview.png) (1200×630).

The same image is generated automatically by
[`app/opengraph-image.tsx`](../app/opengraph-image.tsx) when a link to a
deployment is shared.

---

## 4. Community features **[UI]**

`Settings` → `General` → `Features`:

- [x] **Issues** — templates live in `.github/ISSUE_TEMPLATE/` and redirect
  questions to Discussions and vulnerabilities to private advisories.
- [x] **Discussions** — this is the "forum". Recommended categories:
  - `Announcements` (announcement format)
  - `General`
  - `Ideas`
  - `Q&A` (question format)
  - `Show and tell`
  - `Translations`
- [ ] **Wiki** — keep disabled so documentation has one home.
- [ ] **Sponsorships** — optional.

`Settings` → `General` → `Pull requests`: enable **Allow squash merging** only,
which keeps the history linear and readable.

### Seed the forum with three discussions

An empty forum stays empty. Create these on day one:

1. **Welcome to Webapp** (Announcements) — what the project is, what is planned,
   link to the roadmap and to `CONTRIBUTING.md`.
2. **Show your setup** (Show and tell) — invite people to post their notes
   repository structure, theme and shortcuts.
3. **What should we build next?** (Ideas) — collects suggestions before they
   become issues, which keeps the issue tracker clean.

Pin the first one. Reply to every early message: the first ten conversations set
the tone for the next thousand.

---

## 5. First release **[UI]**

If the release does not exist yet:
`Releases` → `Draft a new release` → tag `v0.1.2026-1411` → title
`Webapp 0.1.2026-1411` → paste the `## [0.1.2026-1411]` section of
[CHANGELOG.md](../CHANGELOG.md) → **Set as the latest release**.

---

## 6. How GitHub discovery works

GitHub itself is a search engine with millions of visitors, and it is the
fastest source of early users. Once the repository is public:

- **Repository search** ranks by name, description, topics and README text.
  The topic list above is the highest-leverage field.
- **Google indexes the repository page automatically.** It is usually indexed
  within days of the first push to a public repository, without asking.
- **Stars and recent activity** affect ranking. A release, a filled README and
  a CI badge all signal that the project is alive.
- **Backlinks matter more.** Every link to the repository from the landing page,
  the docs site and your profile helps.

### Keep the app out of the index

The app uses `ALLOW_INDEXING` (off by default):

- `app/layout.tsx` emits `<meta name="robots" content="noindex, nofollow">`.
- `app/robots.ts` serves `Disallow: /` and no sitemap.
- `app/sitemap.ts` returns an empty sitemap.

Leave it like that for any deployment with real notes. Search engines execute
JavaScript, so an indexed deployment could show note titles or content in
results, which is exactly what must not happen.

If you later publish a **demo** with sample notes on a separate domain, set
`ALLOW_INDEXING=true` there only. That demo can then be the page people find
and try, while personal instances stay invisible.

---

## 7. Search Console for the landing page and the docs

Do this for `https://webapp.microtecn.xyz` and for
`https://wadocs.vercel.app`, **not** for the app deployment:

1. Add a **URL prefix** property in
   <https://search.google.com/search-console>.
2. Verify ownership (HTML tag or DNS record).
3. Submit the sitemap of that site.
4. Use **URL Inspection** → *Request indexing* for the most important pages.

The repository needs no Search Console: GitHub already submits and maintains its
own pages.

### Reality check

Ranking for generic terms like *notes app* is a long game and depends mostly on
backlinks and content, not on meta tags. What works in practice:

1. **Content on the docs site** — one page per real question users ask
   ("How do I connect my GitHub repository?", "How does encryption work?").
2. **Backlinks** — the landing page footer (its GitHub link is currently a dead
   `#`), the docs site header, your GitHub profile and organization README.
3. **Specific, long-tail queries** — "markdown notes app github sync
   self-hosted" is winnable; "notes app" is not, yet.

---

## 8. Where to announce it

Ordered by effort-to-impact for an open-source project of this size:

- GitHub itself: topics, a good README, a release, and asking for a star.
- `r/selfhosted` and `r/opensource` — read each community's rules first, and
  post as a person sharing a project, not as an ad.
- Hacker News **Show HN** — needs a real demo or a self-hosting guide.
- Awesome lists — open small pull requests to lists like `awesome-selfhosted`
  and `awesome-markdown` once the project is stable.
- Dev.to or a personal blog post about *why* the notes live in GitHub.

---

## 9. Measure

- **GitHub** → `Insights` → `Traffic`: views, clones, referring sites.
- **Search Console** → *Performance*: impressions, queries, average position.
- **Stars and forks** are vanity metrics; **issues and discussions from new
  people** are the real signal that the project is findable and useful.
