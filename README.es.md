# Webapp

[English](./README.md) · **Español**

<p align="center">
  <img src="./docs/assets/logo.svg" width="88" height="88" alt="Logo de Webapp" />
</p>

<h3 align="center">Escribe con seguridad.</h3>

<p align="center">
  Una aplicación de notas Markdown minimalista y centrada en la privacidad, con sincronización en GitHub, IA multimodelo y cifrado de extremo a extremo.<br />
  Parte del ecosistema <strong>wwwOS</strong>.
</p>

<p align="center">
  <a href="https://github.com/wwweborg/webapp/releases"><img alt="Versión" src="https://img.shields.io/badge/versi%C3%B3n-0.1.2026--1411-006FFF?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="Licencia: MIT" src="https://img.shields.io/badge/licencia-MIT-006FFF?style=flat-square" /></a>
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img alt="TypeScript 5.9" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <a href="./CONTRIBUTING.md"><img alt="PRs bienvenidos" src="https://img.shields.io/badge/PRs-bienvenidos-brightgreen?style=flat-square" /></a>
</p>

<p align="center">
  <img src="./docs/assets/hero.svg" alt="Vista previa de la interfaz de Webapp" width="100%" />
</p>

> [!NOTE]
> Esta es la primera versión pública de Webapp (`0.1.2026-1411`). La aplicación principal es funcional y compila correctamente, pero el sitio de documentación, la demo pública y el flujo OAuth multiusuario siguen en la hoja de ruta. Los comentarios y las contribuciones son muy bienvenidos.

---

## Índice

- [¿Por qué Webapp?](#por-qué-webapp)
- [Funcionalidades](#funcionalidades)
- [Stack técnico](#stack-técnico)
- [Inicio rápido](#inicio-rápido)
- [Variables de entorno](#variables-de-entorno)
- [Cómo funciona](#cómo-funciona)
- [Proveedores de IA](#proveedores-de-ia)
- [Privacidad y seguridad](#privacidad-y-seguridad)
- [Atajos de teclado](#atajos-de-teclado)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Versionado](#versionado)
- [Hoja de ruta](#hoja-de-ruta)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## ¿Por qué Webapp?

La mayoría de las apps de notas te piden confiar en su nube. Webapp hace lo contrario:

- **Tus notas son archivos Markdown normales.** Viven en un repositorio de GitHub que tú controlas.
- **Sin bases de datos propietarias.** Si dejas de usar Webapp, tus notas siguen siendo legibles en cualquier parte.
- **La privacidad es opcional, pero real.** Puedes cifrar notas individuales o toda tu bóveda con AES-256-GCM.
- **Tu IA, tu proveedor.** Usa Gemini, OpenAI, Claude, Groq, DeepSeek, un servidor local de Ollama o cualquier endpoint compatible con OpenAI.
- **Se siente como una app de escritorio.** Una interfaz tranquila inspirada en macOS, con paleta de comandos, modo enfoque y detalles cuidados.

Webapp es la aplicación de notas de **wwwOS**, un ecosistema de código abierto que se está construyendo alrededor de un lenguaje visual coherente inspirado en macOS.

---

## Funcionalidades

### Escritura y organización

- Editor Markdown construido sobre **Tiptap**, con edición de texto enriquecido y conversión a Markdown.
- Tablas, listas de tareas, bloques de código con resaltado de sintaxis, imágenes, resaltados, wiki-enlaces y subnotas anidadas.
- Comandos con `/`, autocompletado de emojis y autocompletado de `@menciones` de GitHub.
- Panel principal con **vista de cuadrícula y lista**, notas fijadas, colores personalizados, iconos y emojis.
- Búsqueda de texto completo, paleta de comandos, índice de la nota y estadísticas en vivo de palabras, caracteres y tiempo de lectura.
- Vistas dedicadas de **Tareas** y **Calendario**.
- **Modo enfoque** (estilo máquina de escribir) para sesiones sin distracciones.
- **10 idiomas de interfaz**: español, inglés, portugués, francés, neerlandés, italiano, alemán, japonés, chino y ruso.

### Almacenamiento y sincronización

- Cada nota es un archivo `.md` estándar guardado en **tu propio repositorio de GitHub**.
- Las lecturas y escrituras pasan por la API REST de GitHub usando un token del servidor.
- Los commits se crean automáticamente al guardar una nota.
- Los metadatos de las notas (color, icono, fijado, caché local) se quedan en tu navegador.
- Exporta una nota como Markdown o toda la bóveda como archivo ZIP.

### Asistente de IA

- **Petardo AI** puede conversar, mejorar, resumir y generar notas nuevas.
- Funciona con varios proveedores y modelos, incluidos modelos locales.
- Elige proveedor, modelo y URL base desde la interfaz de ajustes.
- Las claves de API se quedan en el servidor, nunca en el bundle del navegador.

### Privacidad y personalización

- **Cifrado de extremo a extremo** opcional con AES-256-GCM.
- Las notas cifradas se guardan como payloads `ENC:v1:...` en tu repositorio de GitHub.
- Temas claro, oscuro y automático; color de acento personalizable.
- Google Fonts para la interfaz y el código; colores y tamaños tipográficos de las notas personalizables.
- Packs de iconos: **Meteor Icons**, **Lucide**, **Material Symbols** y **Heroicons**.
- Packs de emojis: emojis del sistema o **Toss Face**.

---

## Stack técnico

| Capa | Tecnología |
| :--- | :--- |
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Interfaz | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Motion](https://motion.dev/) |
| Lenguaje | [TypeScript 5.9](https://www.typescriptlang.org/) |
| Editor | [Tiptap 3](https://tiptap.dev/) con soporte de Markdown |
| Almacenamiento | API REST de GitHub mediante [Octokit](https://github.com/octokit/octokit.js) |
| IA | [Google Gen AI SDK](https://github.com/googleapis/js-genai) y APIs compatibles con OpenAI |
| Criptografía | Web Crypto API (AES-256-GCM + PBKDF2) |
| Iconos | Iconify, Lucide y Meteor Icons personalizados |

---

## Inicio rápido

### Requisitos

- **Node.js 20+** (o **Bun 1.1+**)
- Una cuenta de GitHub
- Un repositorio de GitHub para tus notas (puede ser privado)
- Opcional: una clave de API de al menos un proveedor de IA

### 1. Clona el repositorio

```bash
git clone https://github.com/wwweborg/webapp.git
cd webapp
```

### 2. Instala las dependencias

Con Bun (recomendado, el repositorio incluye `bun.lock`):

```bash
bun install
```

Con npm:

```bash
npm install
```

### 3. Configura las variables de entorno

```bash
cp .env.example .env.local
```

Abre `.env.local` y rellena al menos los datos de GitHub. Consulta la sección [Variables de entorno](#variables-de-entorno).

### 4. Inicia el servidor de desarrollo

```bash
bun run dev
# o
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 5. Compila para producción

```bash
bun run build
bun run start
```

> El proyecto usa `output: 'standalone'` en `next.config.ts`, así que el servidor de producción también puede ejecutarse con `node .next/standalone/server.js` después de copiar `.next/static` y `public` si despliegas de esa forma.

---

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores que necesites.

### GitHub (obligatorio para las notas)

| Variable | Obligatoria | Descripción |
| :--- | :---: | :--- |
| `GITHUB_TOKEN` | Sí | Personal Access Token con acceso de lectura/escritura al repositorio de **notas**. Se recomienda un token fine-grained con `Contents: Read and write`. |
| `GITHUB_USER` | Sí | Propietario del repositorio de notas (usuario u organización). |
| `GITHUB_REPO` | Sí | Nombre del repositorio de notas. |
| `APP_URL` | No | URL pública del despliegue. Se usa para enlaces autorreferenciales y metadatos. |

> [!IMPORTANT]
> El token lo usa el servidor, no el navegador. Nunca lo expongas con el prefijo `NEXT_PUBLIC_` ni subas `.env.local` al repositorio.

### Proveedores de IA (todos opcionales)

| Variable | Proveedor |
| :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini |
| `OPENAI_API_KEY` | OpenAI / compatible con OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic Claude |
| `GROQ_API_KEY` | Groq Cloud (también se usa para Meta Llama) |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `CUSTOM_AI_BASE_URL` | Endpoint local o personalizado compatible con OpenAI (p. ej. Ollama, LM Studio, vLLM) |
| `CUSTOM_AI_API_KEY` | Clave opcional para el endpoint personalizado |
| `CUSTOM_AI_MODEL` | Modelo predeterminado opcional para el endpoint personalizado |

Solo necesitas configurar los proveedores que quieras usar. La app muestra cuáles están disponibles.

---

## Cómo funciona

Webapp es una aplicación Next.js sin estado. No ejecuta su propia base de datos de notas.

```text
┌──────────────────────────┐
│  Navegador (UI Next.js)  │
│  ajustes + metadatos     │
│  en localStorage         │
└────────────┬─────────────┘
             │  /api/notes
             ▼
┌──────────────────────────┐
│  Servidor Next.js        │
│  Octokit + token         │
└────────────┬─────────────┘
             │  API REST de GitHub
             ▼
┌──────────────────────────┐
│  Tu repositorio de notas │
│  carpeta/nota.md         │
│  carpeta/nota.md         │
└──────────────────────────┘
```

El asistente de IA sigue un camino similar:

```text
Navegador → /api/gemini/agent → API del proveedor de IA
```

Las claves de API se resuelven en el servidor a partir de las variables de entorno. El navegador solo envía el prompt, el proveedor/modelo seleccionado y el contexto de la nota actual.

---

## Proveedores de IA

| Proveedor | Modelo predeterminado | Notas |
| :--- | :--- | :--- |
| Google Gemini | `gemini-2.5-flash` | SDK nativo de Google Gen AI |
| OpenAI | `gpt-4o` | Chat completions compatible con OpenAI |
| Anthropic Claude | `claude-3-7-sonnet-20250219` | API Messages de Anthropic |
| Groq | `llama-3.3-70b-versatile` | Inferencia muy rápida |
| DeepSeek | `deepseek-chat` | API compatible con OpenAI |
| Meta Llama | `llama-3.3-70b-versatile` | A través de Groq o un endpoint compatible |
| Local / Personalizado | `llama3` | Ollama, LM Studio, vLLM, OpenRouter, Together, etc. |

Puedes cambiar el modelo y la URL base desde **Ajustes → IA**.

---

## Privacidad y seguridad

- **Sin base de datos intermedia.** Las notas viajan de tu navegador a tu servidor Next.js y de ahí a GitHub.
- **E2EE opcional.** Cuando se activa, el contenido se cifra en el navegador antes de enviarse a GitHub. El servidor solo ve texto cifrado.
- **Contraseña maestra.** La clave de cifrado se deriva de tu contraseña maestra y no se guarda en el servidor. Si pierdes la contraseña, pierdes el acceso a las notas cifradas.
- **Alcance del token.** Usa un token fine-grained de GitHub limitado al repositorio de notas, no un token clásico con acceso total a la cuenta.
- **Autoalojamiento.** Tú controlas el despliegue y las variables de entorno.
- **Reporta una vulnerabilidad.** Lee [SECURITY.md](./SECURITY.md) antes de divulgar un problema de seguridad públicamente.

> Webapp es un proyecto joven. La implementación de cifrado aún no ha sido auditada de forma independiente. No la uses como única copia de datos críticos.

---

## Atajos de teclado

Webapp incluye una paleta de comandos y varios atajos para navegar y escribir.

- `Ctrl/Cmd + K` — abrir la paleta de comandos
- `Ctrl/Cmd + B` — mostrar u ocultar la barra lateral
- `Ctrl/Cmd + ,` — abrir ajustes
- `Alt + N` — crear una nota nueva
- `Alt + T` — abrir tareas
- `Alt + Z` — activar o desactivar el modo enfoque

Consulta [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md) para la lista completa.

---

## Estructura del proyecto

```text
webapp/
├── app/                  Páginas y rutas API del App Router de Next.js
│   ├── api/              Endpoints de GitHub, IA, subida de archivos y usuario
│   ├── globals.css       Tailwind y tokens globales de diseño
│   ├── layout.tsx        Metadatos y layout raíz
│   └── page.tsx          Aplicación principal de notas
├── components/           Editor, barra lateral, ajustes, IA, tareas y calendario
├── docs/assets/          Capturas y recursos de documentación
├── hooks/                Hooks de React compartidos
├── lib/                  i18n, criptografía, ajustes, servicio de IA e iconos
├── locales/              Traducciones de la interfaz (10 idiomas)
├── public/               Iconos, fuentes y archivos estáticos
├── .env.example          Plantilla de variables de entorno
├── next.config.ts        Configuración de Next.js
└── package.json
```

---

## Versionado

Esta versión se etiqueta como **`v0.1.2026-1411`**.

La cadena `0.1.2026-1411` es válida según [Semantic Versioning 2.0.0](https://semver.org/):

- `0` = major
- `1` = minor
- `2026` = patch
- `1411` = identificador de pre-release

El guion está permitido. Un detalle a tener en cuenta: SemVer interpreta `0.1.2026-1411` como una **pre-release de `0.1.2026`**, así que un futuro `0.1.2026` sin sufijo se consideraría más nuevo. Si alguna vez quieres un sello de fecha/build que no implique pre-release, usa metadatos de build, por ejemplo `0.1.2026+1411`. Por ahora, el proyecto usa la forma con guion que pediste.

---

## Hoja de ruta

Webapp es la primera aplicación del ecosistema **wwwOS**. El trabajo previsto incluye:

- [ ] Publicar el sitio de documentación y una demo pública en vivo.
- [ ] Añadir capturas reales y un vídeo corto del producto a este README.
- [ ] Mejorar el onboarding para quienes se autoalojan por primera vez.
- [ ] Añadir OAuth multiusuario de GitHub para que cada visitante conecte su propio repositorio de notas.
- [ ] Ampliar el sistema de diseño wwwOS y compartirlo con futuras aplicaciones.
- [ ] Añadir tests automatizados y un flujo de CI.
- [ ] Publicar notas de versión y un changelog público.

¿Tienes una idea? Abre un issue o inicia una discusión.

---

## Contribuir

Las contribuciones de cualquier tamaño son bienvenidas: reportes de errores, traducciones, documentación, mejoras de diseño y código.

1. Lee [CONTRIBUTING.md](./CONTRIBUTING.md).
2. Haz un fork del repositorio y crea una rama.
3. Haz tu cambio y ejecuta `bun run lint` y `bun run build`.
4. Abre un pull request con una descripción clara.

Por favor, sé amable y constructivo. Este proyecto sigue una regla simple: discute las ideas abiertamente y revisa el código con respeto.

---

## Licencia

Webapp se distribuye bajo la [Licencia MIT](./LICENSE).

Puedes usarlo, modificarlo y distribuirlo libremente, incluso con fines comerciales, siempre que conserves el aviso de copyright y el texto de la licencia.

---

<p align="center">
  Hecho con cuidado por <a href="https://github.com/wwweborg">wwweborg</a>.<br />
  <a href="https://webapp.microtecn.xyz">Landing page</a> ·
  <a href="https://wadocs.vercel.app">Documentación</a> ·
  <a href="https://github.com/wwweborg/webapp/issues">Issues</a>
</p>
