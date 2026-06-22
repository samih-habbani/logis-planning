export type Trainer = string  // dynamic; 'both' = all trainers
export type Center = 'city_mall' | 'oasis' | 'mirdif'

export interface TrainerRecord {
  id: string
  name: string   // lowercase slug stored in events, e.g. 'ali'
  color: string  // key into COLOR_MAP
  created_at?: string
}

export interface PlanningEvent {
  id: string
  date: string
  trainer: Trainer
  center: Center
  start_time: string
  end_time: string
  curriculum?: string
  lesson?: string
  student_name?: string
  note?: string
  created_at?: string
}

export interface EventFormData {
  trainer: Trainer | null
  center: Center | null
  start_time: string
  end_time: string
  curriculum: string
  lesson: string
  student_name: string
  note: string
}

export const TRAINER_LABELS: Record<string, string> = { both: 'All trainers' }
export const CENTER_LABELS: Record<Center, string> = {
  city_mall: 'City Mall',
  oasis: 'Oasis',
  mirdif: 'Mirdif',
}

export const DAYS_FR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS_FR = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export const H_START = 8
export const H_END = 21
export const SLOT_MINUTES = 30
export const SLOT_PX = 56

export const COLOR_PALETTE = ['sky', 'violet', 'teal', 'amber', 'emerald', 'rose', 'orange', 'pink', 'indigo', 'cyan'] as const
export type TrainerColor = typeof COLOR_PALETTE[number]

export const COLOR_MAP: Record<string, {
  card: string; nameText: string; selRing: string;
  filterHover: string; filterActive: string;
  popupActive: string; dot: string; offText: string
}> = {
  sky:     { card: 'bg-sky-500/10 border border-sky-500/30 text-sky-200',          nameText: 'text-sky-400',    selRing: 'ring-sky-500 bg-sky-500/10 text-sky-300',       filterHover: 'hover:text-sky-300 hover:border-sky-600',       filterActive: 'bg-sky-500/15 text-sky-300 border-sky-500',       popupActive: 'bg-sky-500/15 border-sky-500/50 text-sky-300',       dot: 'bg-sky-400',    offText: 'text-sky-700' },
  violet:  { card: 'bg-violet-500/10 border border-violet-500/30 text-violet-200', nameText: 'text-violet-400', selRing: 'ring-violet-500 bg-violet-500/10 text-violet-300', filterHover: 'hover:text-violet-300 hover:border-violet-600', filterActive: 'bg-violet-500/15 text-violet-300 border-violet-500', popupActive: 'bg-violet-500/15 border-violet-500/50 text-violet-300', dot: 'bg-violet-400', offText: 'text-violet-700' },
  teal:    { card: 'bg-teal-500/10 border border-teal-500/30 text-teal-200',       nameText: 'text-teal-400',   selRing: 'ring-teal-500 bg-teal-500/10 text-teal-300',     filterHover: 'hover:text-teal-300 hover:border-teal-600',     filterActive: 'bg-teal-500/15 text-teal-300 border-teal-500',     popupActive: 'bg-teal-500/15 border-teal-500/50 text-teal-300',     dot: 'bg-teal-400',   offText: 'text-teal-700' },
  amber:   { card: 'bg-amber-500/10 border border-amber-500/30 text-amber-200',   nameText: 'text-amber-400',  selRing: 'ring-amber-500 bg-amber-500/10 text-amber-300',   filterHover: 'hover:text-amber-300 hover:border-amber-600',   filterActive: 'bg-amber-500/15 text-amber-300 border-amber-500',   popupActive: 'bg-amber-500/15 border-amber-500/50 text-amber-300',   dot: 'bg-amber-400',  offText: 'text-amber-700' },
  emerald: { card: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200', nameText: 'text-emerald-400', selRing: 'ring-emerald-500 bg-emerald-500/10 text-emerald-300', filterHover: 'hover:text-emerald-300 hover:border-emerald-600', filterActive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500', popupActive: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300', dot: 'bg-emerald-400', offText: 'text-emerald-700' },
  rose:    { card: 'bg-rose-500/10 border border-rose-500/30 text-rose-200',       nameText: 'text-rose-400',   selRing: 'ring-rose-500 bg-rose-500/10 text-rose-300',     filterHover: 'hover:text-rose-300 hover:border-rose-600',     filterActive: 'bg-rose-500/15 text-rose-300 border-rose-500',     popupActive: 'bg-rose-500/15 border-rose-500/50 text-rose-300',     dot: 'bg-rose-400',   offText: 'text-rose-700' },
  orange:  { card: 'bg-orange-500/10 border border-orange-500/30 text-orange-200', nameText: 'text-orange-400',  selRing: 'ring-orange-500 bg-orange-500/10 text-orange-300', filterHover: 'hover:text-orange-300 hover:border-orange-600', filterActive: 'bg-orange-500/15 text-orange-300 border-orange-500', popupActive: 'bg-orange-500/15 border-orange-500/50 text-orange-300', dot: 'bg-orange-400',  offText: 'text-orange-700' },
  pink:    { card: 'bg-pink-500/10 border border-pink-500/30 text-pink-200',       nameText: 'text-pink-400',   selRing: 'ring-pink-500 bg-pink-500/10 text-pink-300',     filterHover: 'hover:text-pink-300 hover:border-pink-600',     filterActive: 'bg-pink-500/15 text-pink-300 border-pink-500',     popupActive: 'bg-pink-500/15 border-pink-500/50 text-pink-300',     dot: 'bg-pink-400',   offText: 'text-pink-700' },
  indigo:  { card: 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-200', nameText: 'text-indigo-400',  selRing: 'ring-indigo-500 bg-indigo-500/10 text-indigo-300', filterHover: 'hover:text-indigo-300 hover:border-indigo-600', filterActive: 'bg-indigo-500/15 text-indigo-300 border-indigo-500', popupActive: 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300', dot: 'bg-indigo-400',  offText: 'text-indigo-700' },
  cyan:    { card: 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-200',       nameText: 'text-cyan-400',   selRing: 'ring-cyan-500 bg-cyan-500/10 text-cyan-300',     filterHover: 'hover:text-cyan-300 hover:border-cyan-600',     filterActive: 'bg-cyan-500/15 text-cyan-300 border-cyan-500',     popupActive: 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300',     dot: 'bg-cyan-400',   offText: 'text-cyan-700' },
}

export const FALLBACK_COLOR = COLOR_MAP['sky']
