# Third-party notices

The source code of Webapp is released under the [MIT License](./LICENSE).
This file documents assets **redistributed inside this repository** that are
covered by their own terms. The MIT license does not apply to them.

---

## Toss Face emoji font

| | |
| :--- | :--- |
| File | [`public/fonts/TossFaceFontMac.ttf`](./public/fonts/TossFaceFontMac.ttf) |
| Version | 1.6 |
| Size | 12.7 MB (12,730,928 bytes) |
| SHA-256 | `ec49cf31bea9c5bc0844bccf0a66435e0c12c62a6c2ee73c754c63273e5b4883` |
| Copyright | © 2022, 2023 Viva Republica (Toss). Reserved Font Name "Tossface". |
| License | [Toss Face License](https://toss.im/tossface/copyright) — custom license, **not** MIT and **not** OFL |
| Full license text | [`public/fonts/TossFace-LICENSE.txt`](./public/fonts/TossFace-LICENSE.txt) |
| Upstream | <https://github.com/toss/tossface> |
| Project site | <https://toss.im/tossface> |

The bundled file is an **unmodified** copy of the official distribution
(verified by SHA-256 against `dist/TossFaceFontMac.ttf` upstream). It is used
as a self-hosted web font for the optional Toss Face emoji pack
(`Settings → Appearance → Emoji`).

Clause 2 of the license allows bundling and redistributing the original font
with other software **as long as the Toss Face copyright notice and the full
license text are included**. Both are included in this repository: the notice
below and the full text in `public/fonts/TossFace-LICENSE.txt`, next to the
font file.

### Required attribution

> 이 페이지에는 토스팀에서 제공한 토스페이스가 적용되어 있습니다.
>
> This application uses Toss Face, provided by the Toss team.

### What the license allows

- Using Toss Face for free, for personal and commercial projects.
- Studying it and redistributing the original, including bundled with other
  software, provided the notice and license text are included.

### What the license does not allow

- Selling Toss Face itself.
- Creating modified or derivative creative works from it.
- Registering trademarks, design rights or other intellectual property over it
  or over works derived from it.
- Submitting it to exhibitions or competitions.
- Converting Toss Face into source code and reproducing, transmitting or
  publicly posting it.
- Using it in ways that harm public morals or infringe the Toss team's rights.

> Toss Face is **not** part of the MIT-licensed source code. If you fork or
> redistribute this project, keep `public/fonts/TossFace-LICENSE.txt` and this
> notice together with the font. If your use case does not fit the terms
> above, remove `public/fonts/TossFaceFontMac.ttf` and the Toss Face references
> in `app/globals.css`; the app falls back to system emojis.

---

## Runtime dependencies

npm and Bun dependencies listed in `package.json` are **not** vendored in this
repository; they are installed from the registry at build time and keep their
own licenses (mostly MIT, ISC and Apache-2.0). Run the following command to
print their license metadata:

```bash
bun pm ls --all
```

The application also loads Google Fonts at runtime through the public Google
Fonts CSS API when that font family is selected in the settings UI. No font
files from Google are redistributed in this repository.
