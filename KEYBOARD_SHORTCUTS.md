# Guía de Atajos de Teclado y Comandos (Modo Desarrollador)

> **Nota para macOS:** En Mac, la tecla `Alt` corresponde a `Option (⌥)` y `Ctrl` corresponde a `Cmd (⌘)`.

---

## 1. Navegación Global
| Acción | Atajo Principal | Atajo Alternativo | Descripción |
| :--- | :--- | :--- | :--- |
| **Ir al Panel principal** | `Alt + D` | `Alt + 1` | Abre la vista principal (Dashboard) de notas. |
| **Ir a Todas las tareas** | `Alt + T` | `Alt + 2` | Abre el escáner global de tareas pendientes y completadas. |
| **Ir a Calendario** | `Alt + C` | `Alt + 3` | Abre la vista de calendario mensual/semanal y notas diarias. |
| **Entrar / Salir de Ajustes** | `Ctrl/Cmd + ,` | `Alt + P` | Abre Configuración (o regresa a la vista previa si ya estás en Ajustes). |
| **Ocultar / Mostrar Sidebar** | `Ctrl/Cmd + B` | `Alt + S` | Colapsa o expande la barra lateral izquierda. |

---

## 2. Creación y Búsqueda
| Acción | Atajo Principal | Atajo Alternativo | Descripción |
| :--- | :--- | :--- | :--- |
| **Crear nueva nota** | `Alt + N` | — | Abre el modal para crear una nueva nota `.md` en la ubicación actual. |
| **Crear nueva sección** | `Alt + Shift + N` | — | Abre el modal directamente en modo creación de carpeta/sección. |
| **Buscar notas** | `Ctrl/Cmd + K` | `Alt + F` | Va al Panel principal y enfoca automáticamente el buscador. |

---

## 3. Ordenamiento, Vista y Apariencia
| Acción | Atajo Principal | Atajo Alternativo | Descripción |
| :--- | :--- | :--- | :--- |
| **Ordenar por Última edición** | `Alt + M` | `Alt + O` *(ciclo)* | Ordena las notas por fecha de última modificación. |
| **Ordenar por Fecha de creación** | `Alt + R` | `Alt + O` *(ciclo)* | Ordena las notas por fecha de creación. |
| **Ordenar por Título (A-Z)** | `Alt + A` | `Alt + O` *(ciclo)* | Ordena las notas alfabéticamente. |
| **Ciclar ordenamiento en bucle** | `Alt + O` | — | Alterna entre Última edición → Fecha de creación → Título (A-Z). |
| **Cambiar vista (Cuadrícula ↔ Lista)** | `Alt + V` | `Ctrl/Cmd + Shift + V` | Alterna el diseño del panel principal entre tarjetas (Cuadrícula) y Lista compacta. |
| **Cambiar Tema (Claro → Oscuro → Auto)** | `Alt + L` | `Ctrl/Cmd + Shift + L` | Salta en bucle entre Modo Claro ☀️, Modo Oscuro 🌙 y Automático (Sistema) 💻 con notificación. |

---

## 4. Editor Markdown, Sangría Inteligente y Comandos
| Acción en el Editor | Atajo / Comando | Descripción |
| :--- | :--- | :--- |
| **Guardar nota actual** | `Ctrl/Cmd + S` | Sincroniza y guarda los cambios de la nota en GitHub. |
| **Indentar lista o tarea** | `Tab` | Anida un nivel hacia adentro listas con viñetas, numeradas o tareas `[ ]` (o inserta 2 espacios en código/texto sin perder foco). |
| **Des-indentar lista o tarea** | `Shift + Tab` | Reduce un nivel de sangría en listas o tareas `[ ]` (o retira 2 espacios iniciales). |
| **Continuar casilla de tarea `[ ]`** | `Enter` | En una tarea con texto, crea automáticamente otra casilla `[ ]` abajo. En una casilla vacía, sale de la lista de tareas. |
| **Pegar imagen desde portapapeles** | `Ctrl/Cmd + V` | Sube la imagen automáticamente a `images/` en GitHub y la inserta como `![imagen](/images/...)`. |
| **Menú de comandos rápidos (Slash)** | `/` | Abre el menú flotante en el cursor (`/h1`, `/h2`, `/h3`, `/task`, `/bullet`, `/code`, `/quote`, `/calendario`, `/emoji`, `/icon`). |
| **Autocompletado de Emojis** | `:nombre` | Ejemplo: `:rocket` abre el selector rápido de emojis mientras escribes. |
| **Iconos inline en vivo** | `.pack:icono.` + `Espacio` | Ejemplo: `.meteor:home ` o `.lucide:sparkles ` renderiza el icono vectorial en línea. |
