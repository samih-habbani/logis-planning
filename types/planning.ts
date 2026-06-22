export type Trainer = 'ali' | 'samih'
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

export const TRAINER_LABELS: Record<Trainer, string> = { ali: 'Ali', samih: 'Samih' }
export const CENTER_LABELS: Record<Center, string> = {
  city_mall: 'City Mall',
  oasis: 'Oasis',
  mirdif: 'Mirdif',
}

export const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
export const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
]

export const H_START = 8
export const H_END = 21
export const SLOT_MINUTES = 30
export const SLOT_PX = 56
