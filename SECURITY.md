# Security policy

## Supported versions

Webapp is a young project. Security fixes are applied to the latest release on the `main` branch.

| Version | Supported |
| :--- | :---: |
| `0.1.x` | Yes |
| Older versions | No |

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Use GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/wwweborg/webapp/security) of the repository.
2. Click **Report a vulnerability**.
3. Include a description, reproduction steps, affected version and any relevant logs or proof of concept.

If private reporting is unavailable, contact the maintainers through the organization profile at <https://github.com/wwweborg> and ask for a private channel. Do not include exploit details in a public message.

We will acknowledge the report as soon as possible and keep you updated on the fix. Please give us reasonable time to address the issue before any public disclosure.

## Scope

Security-sensitive areas of the project include:

- GitHub token handling and API routes (`/api/notes`, `/api/user`, `/api/upload`, `/api/github-users`).
- End-to-end encryption, key derivation and vault verification (`lib/crypto.ts`).
- The AI proxy route (`/api/gemini/agent`) and provider API keys.
- Server-side rendering, file uploads and image proxying.
- Any flow that could leak note content, tokens or personal data.

## Security model

- Notes are stored in a GitHub repository controlled by the deployment owner.
- **A deployment is single-tenant.** The server authenticates to GitHub with one token from the environment, so every visitor shares the same notes repository. There is no per-user login yet.
- The `/api/notes` routes are unauthenticated by design in the current version: they trust that the deployment itself is private. **Anyone who can reach the URL can read, write and delete the configured notes.**
- Set `APP_PASSWORD` to put an HTTP Basic authentication gate in front of every route as a stop-gap. Without it, a public deployment exposes the notes repository to the whole internet.
- Search engine indexing is off by default (`ALLOW_INDEXING`). Crawlers execute JavaScript, so an indexed deployment could surface note titles and content in search results.
- The GitHub token is read from server-side environment variables. It must never be exposed to the browser.
- With E2EE enabled, note content is encrypted in the browser with AES-256-GCM before it is sent to the server. The server only receives ciphertext.
- The master password is not stored on the server. If it is lost, encrypted notes cannot be recovered.
- AI provider keys are resolved on the server. The browser sends prompts and context, not the keys.
- Note metadata and settings are stored in the browser's `localStorage`.

## Recommendations for self-hosters

- **Never deploy Webapp publicly with personal notes until per-user authentication exists**, unless you set `APP_PASSWORD` and understand its limitations (a single shared password, no sessions, no audit trail).
- Keep `ALLOW_INDEXING` unset (the default). Only a demo instance with sample notes should enable it.
- Use a **fine-grained GitHub token** limited to the notes repository, with only `Contents: Read and write` permission.
- Keep `.env.local` out of version control. The repository's `.gitignore` already ignores `.env*`.
- Deploy behind HTTPS. HTTP Basic authentication sends the password on every request; without TLS it travels in clear text.
- Keep dependencies up to date.
- Do not use Webapp as the only copy of critical data. The encryption implementation has not been independently audited.
- Rotate tokens and API keys if you suspect they were exposed.

## Out of scope

- Vulnerabilities in third-party services (GitHub, AI providers, hosting platforms) that are not caused by Webapp.
- Issues that require physical access to the user's device.
- Social engineering.
- Denial-of-service attacks against a self-hosted instance.

Thank you for helping keep Webapp and its users safe.
