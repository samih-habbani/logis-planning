export type Trainer = 'ali' | 'samih' | 'both'
export type Center = 'city_mall' | 'oasis' | 'mirdif'

export interface PlanningEvent {
  id: string
  date: string
  trainer: Trainer
  center: Center
  start_time: string
  end_time: string
  curriculum?: string
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
  student_name: string
  note: string
}

export const TRAINER_LABELS: Record<Trainer, string> = { ali: 'Ali', samih: 'Samih', both: 'Both' }
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
