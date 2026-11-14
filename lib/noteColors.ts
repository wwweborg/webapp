export interface NoteColorOption {
  id: string;
  name: string;
  lightBg: string;
  lightBorder: string;
  darkBg: string;
  darkBorder: string;
  dotColor: string;
}

export const NOTE_COLORS: NoteColorOption[] = [
  {
    id: 'default',
    name: 'Por defecto',
    lightBg: 'transparent',
    lightBorder: '',
    darkBg: 'transparent',
    darkBorder: '',
    dotColor: '#9CA3AF'
  },
  {
    id: 'coral',
    name: 'Coral',
    lightBg: '#FEE2E2',
    lightBorder: '',
    darkBg: '#3B1818',
    darkBorder: '',
    dotColor: '#EF4444'
  },
  {
    id: 'peach',
    name: 'Durazno',
    lightBg: '#FFEDD5',
    lightBorder: '',
    darkBg: '#3A1C0E',
    darkBorder: '',
    dotColor: '#F97316'
  },
  {
    id: 'sand',
    name: 'Arena cálida',
    lightBg: '#FEF9C3',
    lightBorder: '',
    darkBg: '#372E0C',
    darkBorder: '',
    dotColor: '#EAB308'
  },
  {
    id: 'mint',
    name: 'Menta',
    lightBg: '#DCFCE7',
    lightBorder: '',
    darkBg: '#13351F',
    darkBorder: '',
    dotColor: '#22C55E'
  },
  {
    id: 'aqua',
    name: 'Turquesa',
    lightBg: '#CCFBF1',
    lightBorder: '',
    darkBg: '#0F3330',
    darkBorder: '',
    dotColor: '#14B8A6'
  },
  {
    id: 'sky',
    name: 'Cielo',
    lightBg: '#E0F2FE',
    lightBorder: '',
    darkBg: '#102A3E',
    darkBorder: '',
    dotColor: '#0EA5E9'
  },
  {
    id: 'lavender',
    name: 'Lavanda',
    lightBg: '#F3E8FF',
    lightBorder: '',
    darkBg: '#2C1744',
    darkBorder: '',
    dotColor: '#A855F7'
  },
  {
    id: 'rose',
    name: 'Rosa',
    lightBg: '#FCE7F3',
    lightBorder: '',
    darkBg: '#391629',
    darkBorder: '',
    dotColor: '#EC4899'
  },
  {
    id: 'slate',
    name: 'Pizarra',
    lightBg: '#F1F5F9',
    lightBorder: '',
    darkBg: '#1F1F1F',
    darkBorder: '',
    dotColor: '#64748B'
  }
];

export function getNoteColor(colorId?: string): NoteColorOption {
  if (!colorId) return NOTE_COLORS[0];
  const found = NOTE_COLORS.find(c => c.id === colorId || c.lightBg === colorId || c.darkBg === colorId);
  return found || NOTE_COLORS[0];
}
