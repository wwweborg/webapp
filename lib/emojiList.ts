export interface EmojiItem {
  code: string;       // e.g. "rocket"
  emoji: string;      // e.g. "🚀"
  keywords: string[]; // e.g. ["cohete", "despegue", "space"]
}

export const EMOJI_LIST: EmojiItem[] = [
  { code: 'rocket', emoji: '🚀', keywords: ['cohete', 'despegue', 'lanzamiento', 'space'] },
  { code: 'fire', emoji: '🔥', keywords: ['fuego', 'flama', 'hot', 'tendencia'] },
  { code: 'sparkles', emoji: '✨', keywords: ['destello', 'brillo', 'magia', 'nuevo'] },
  { code: 'star', emoji: '⭐', keywords: ['estrella', 'favorito', 'destacado'] },
  { code: 'heart', emoji: '❤️', keywords: ['corazon', 'amor', 'like'] },
  { code: 'smile', emoji: '😄', keywords: ['sonrisa', 'feliz', 'alegre'] },
  { code: 'face', emoji: '😀', keywords: ['cara', 'rostro', 'smile'] },
  { code: 'laughing', emoji: '😆', keywords: ['risa', 'carcajada'] },
  { code: 'wink', emoji: '😉', keywords: ['guiño', 'secreto'] },
  { code: 'sunglasses', emoji: '😎', keywords: ['genial', 'cool', 'gafas'] },
  { code: 'thinking', emoji: '🤔', keywords: ['pensar', 'duda', 'idea'] },
  { code: 'memo', emoji: '📝', keywords: ['nota', 'escribir', 'apunte'] },
  { code: 'note', emoji: '📄', keywords: ['documento', 'hoja', 'archivo'] },
  { code: 'folder', emoji: '📁', keywords: ['carpeta', 'directorio'] },
  { code: 'check', emoji: '✅', keywords: ['completado', 'listo', 'ok', 'aprobado'] },
  { code: 'cross', emoji: '❌', keywords: ['cancelado', 'error', 'no'] },
  { code: 'target', emoji: '🎯', keywords: ['objetivo', 'meta', 'blanco'] },
  { code: 'zap', emoji: '⚡', keywords: ['rayo', 'rapido', 'energia'] },
  { code: 'calendar', emoji: '📅', keywords: ['calendario', 'fecha', 'agenda'] },
  { code: 'bulb', emoji: '💡', keywords: ['foco', 'idea', 'luz'] },
  { code: 'eyes', emoji: '👀', keywords: ['ojos', 'mirar', 'ojo'] },
  { code: 'party', emoji: '🎉', keywords: ['fiesta', 'celebracion', 'exito'] },
  { code: 'thumbsup', emoji: '👍', keywords: ['like', 'bien', 'aprobado'] },
  { code: 'thumbsdown', emoji: '👎', keywords: ['dislike', 'mal'] },
  { code: 'clap', emoji: '👏', keywords: ['aplauso', 'bravo'] },
  { code: 'crown', emoji: '👑', keywords: ['corona', 'rey', 'lider'] },
  { code: 'gem', emoji: '💎', keywords: ['diamante', 'joya', 'valioso'] },
  { code: 'bug', emoji: '🐛', keywords: ['error', 'bicho', 'falla'] },
  { code: 'gear', emoji: '⚙️', keywords: ['configuracion', 'ajustes', 'motor'] },
  { code: 'lock', emoji: '🔒', keywords: ['candado', 'seguro', 'privado'] },
  { code: 'pin', emoji: '📌', keywords: ['fijar', 'pin', 'chinche'] },
  { code: 'link', emoji: '🔗', keywords: ['enlace', 'vinculo', 'url'] },
  { code: 'warning', emoji: '⚠️', keywords: ['alerta', 'advertencia', 'peligro'] },
  { code: 'wave', emoji: '👋', keywords: ['saludo', 'hola', 'mano'] },
  { code: 'pray', emoji: '🙏', keywords: ['gracias', 'porfavor', 'oracion'] },
  { code: 'muscle', emoji: '💪', keywords: ['fuerza', 'musculo', 'poder'] },
  { code: 'brain', emoji: '🧠', keywords: ['cerebro', 'mente', 'pensamiento'] },
  { code: 'robot', emoji: '🤖', keywords: ['ia', 'bot', 'automatizacion'] },
  { code: 'sun', emoji: '☀️', keywords: ['sol', 'dia', 'luz'] },
  { code: 'moon', emoji: '🌙', keywords: ['luna', 'noche', 'oscuro'] },
  { code: 'coffee', emoji: '☕', keywords: ['cafe', 'desayuno', 'pausa'] },
  { code: 'pizza', emoji: '🍕', keywords: ['comida', 'pizza'] },
  { code: 'music', emoji: '🎵', keywords: ['musica', 'cancion', 'sonido'] },
  { code: 'camera', emoji: '📷', keywords: ['camara', 'foto', 'imagen'] },
  { code: 'book', emoji: '📚', keywords: ['libro', 'lectura', 'estudio'] },
  { code: 'pencil', emoji: '✏️', keywords: ['lapiz', 'dibujar', 'editar'] },
  { code: 'key', emoji: '🔑', keywords: ['llave', 'clave', 'acceso'] },
  { code: 'search', emoji: '🔍', keywords: ['buscar', 'lupa'] },
  { code: 'bell', emoji: '🔔', keywords: ['campana', 'notificacion'] },
  { code: 'gift', emoji: '🎁', keywords: ['regalo', 'premio'] },
  { code: 'trophy', emoji: '🏆', keywords: ['trofeo', 'copa', 'ganador'] },
  { code: 'medal', emoji: '🥇', keywords: ['medalla', 'oro', 'primer-lugar'] },
  { code: 'flag', emoji: '🚩', keywords: ['bandera', 'marca', 'hito'] },
  { code: 'question', emoji: '❓', keywords: ['pregunta', 'duda'] },
  { code: 'exclamation', emoji: '❗', keywords: ['exclamacion', 'importante'] },
  { code: 'time', emoji: '⏰', keywords: ['reloj', 'tiempo', 'hora'] },
  { code: 'chart', emoji: '📊', keywords: ['grafico', 'estadisticas', 'datos'] },
  { code: 'package', emoji: '📦', keywords: ['paquete', 'caja', 'envio'] },
];

export function searchEmojis(query: string): EmojiItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return EMOJI_LIST.slice(0, 10);

  return EMOJI_LIST.filter(item => 
    item.code.toLowerCase().includes(q) ||
    item.keywords.some(k => k.toLowerCase().includes(q))
  ).slice(0, 10);
}
