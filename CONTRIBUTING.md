# Contributing to Webapp

Thanks for taking the time to contribute. Webapp is an open-source project and every improvement matters: code, documentation, translations, design feedback and bug reports.

> ¿Prefieres escribir en español? También puedes abrir issues y pull requests en español. No hay problema.

## Code of conduct

Be kind, constructive and respectful. We welcome people of all backgrounds and experience levels. Harassment, personal attacks and discriminatory language are not acceptable.

## Ways to contribute

- **Report a bug.** Open an issue with steps to reproduce, expected behavior, actual behavior and your environment.
- **Request a feature.** Explain the problem you are trying to solve, not only the solution you have in mind.
- **Improve documentation.** Fix typos, clarify setup steps or add examples.
- **Translate.** The interface currently supports ten languages; corrections and new translations are welcome.
- **Send code.** Bug fixes, accessibility improvements, performance work and small refactors are all useful.

## Before you start

- Check existing issues and pull requests to avoid duplicate work.
- For large changes, open an issue first so we can agree on the approach.
- For security issues, **do not open a public issue**. Follow [SECURITY.md](./SECURITY.md).

## Development setup

### Requirements

- Node.js 20+ or Bun 1.1+
- A GitHub account and a notes repository (it can be private)
- A GitHub token with read/write access to that repository

### Install and run

```bash
git clone https://github.com/wwweborg/webapp.git
cd webapp
bun install          # or npm install
cp .env.example .env.local
bun run dev          # or npm run dev
```

Open <http://localhost:3000>.

### Useful commands

```bash
bun run lint         # ESLint
bun run typecheck    # TypeScript, no emit
bun run build        # production build
bun run start        # run the production build
```

Please run `bun run lint`, `bun run typecheck` and `bun run build` before opening a pull request.

## Branch and commit conventions

- Create a branch from `main` with a descriptive name, for example `fix/github-follow-list` or `feat/command-palette-shortcuts`.
- Use clear commit messages. [Conventional Commits](https://www.conventionalcommits.org/) are preferred:
  - `feat: add calendar week view`
  - `fix: handle empty notes repository`
  - `docs: clarify GitHub token permissions`
  - `refactor: extract note metadata helpers`
- Keep pull requests focused. One topic per PR is easier to review.

## Pull request checklist

- [ ] The change is described clearly.
- [ ] `bun run lint` passes.
- [ ] `bun run typecheck` passes.
- [ ] `bun run build` passes.
- [ ] I tested the change locally.
- [ ] I updated the documentation when needed.
- [ ] I added a changelog entry for user-facing changes.

## Translation notes

- Locale files live in `locales/`.
- Keep the same keys across all languages.
- Do not translate product names such as **Webapp**, **wwwOS**, **Petardo AI**, **Toss Face**, **GitHub**, **Gemini**, **OpenAI** or **Claude**.
- When adding a new key, add it to every locale, even if the value is temporarily in English.

## License of contributions

By submitting a contribution, you agree that it can be distributed under the [MIT License](./LICENSE), the same license as the project.

## Questions

Open an issue with the `question` label or start a discussion. We are happy to help you find a good first task.
