'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, MoonStar, UserPlus } from 'lucide-react'
import type { PlanningEvent, EventFormData, Center, TrainerRecord } from '@/types/planning'
import { CENTER_LABELS, COLOR_MAP, FALLBACK_COLOR, DAYS_FR, MONTHS_FR, H_START, H_END, SLOT_MINUTES, SLOT_PX } from '@/types/planning'
import { EventModal } from './EventModal'
import { AddTrainerModal } from './AddTrainerModal'

const SLOT_COUNT = ((H_END - H_START) * 60) / SLOT_MINUTES

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function getMonday(d: Date) {
  const dt = new Date(d)
  const day = dt.getDay()
  dt.setDate(dt.getDate() - (day === 0 ? 6 : day - 1))
  dt.setHours(0, 0, 0, 0)
  return dt
}
function addDays(d: Date, n: number) { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt }
function timeToMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m }
function hhmm(h: number, m: number) { return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` }
function slotToTime(s: number) {
  const totalMin = H_START * 60 + s * SLOT_MINUTES
  return hhmm(Math.floor(totalMin / 60), totalMin % 60)
}
function weekLabel(mon: Date) {
  const sun = addDays(mon, 6)
  if (mon.getMonth() === sun.getMonth())
    return `${mon.getDate()} – ${sun.getDate()} ${MONTHS_FR[mon.getMonth()]} ${mon.getFullYear()}`
  return `${mon.getDate()} ${MONTHS_FR[mon.getMonth()]} – ${sun.getDate()} ${MONTHS_FR[sun.getMonth()]} ${mon.getFullYear()}`
}

function computeEventLayout(events: PlanningEvent[]): Map<string, { col: number; totalCols: number }> {
  const sorted = [...events].sort((a, b) => a.start_time.localeCompare(b.start_time))
  const layout = new Map<string, { col: number; totalCols: number }>()
  const columns: PlanningEvent[][] = []

  for (const ev of sorted) {
    const startMin = timeToMin(ev.start_time.slice(0, 5))
    let placed = false
    for (let c = 0; c < columns.length; c++) {
      const last = columns[c][columns[c].length - 1]
      if (timeToMin(last.end_time.slice(0, 5)) <= startMin) {
        columns[c].push(ev)
        layout.set(ev.id, { col: c, totalCols: 0 })
        placed = true
        break
      }
    }
    if (!placed) {
      columns.push([ev])
      layout.set(ev.id, { col: columns.length - 1, totalCols: 0 })
    }
  }

  // For each event, totalCols = max column index among all overlapping events + 1
  for (const ev of sorted) {
    const s = timeToMin(ev.start_time.slice(0, 5))
    const e = timeToMin(ev.end_time.slice(0, 5))
    let maxCol = layout.get(ev.id)!.col
    for (const other of sorted) {
      if (other.id === ev.id) continue
      const os = timeToMin(other.start_time.slice(0, 5))
      const oe = timeToMin(other.end_time.slice(0, 5))
      if (os < e && oe > s) maxCol = Math.max(maxCol, layout.get(other.id)!.col)
    }
    layout.set(ev.id, { col: layout.get(ev.id)!.col, totalCols: maxCol + 1 })
  }

  return layout
}

const CENTER_BADGE: Record<Center, string> = {
  city_mall: 'bg-amber-500/20 text-amber-300',
  oasis:     'bg-emerald-500/20 text-emerald-300',
  mirdif:    'bg-rose-500/20 text-rose-300',
}
const CENTER_FILTERS: { value: Center | null; label: string; cls: string; activeCls: string }[] = [
  { value: null,        label: 'All centers', cls: 'border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500',       activeCls: 'bg-white text-neutral-900 border-white' },
  { value: 'city_mall', label: 'City Mall',   cls: 'border-neutral-700 text-neutral-400 hover:text-amber-300 hover:border-amber-600',    activeCls: 'bg-amber-500/15 text-amber-300 border-amber-500' },
  { value: 'oasis',     label: 'Oasis',       cls: 'border-neutral-700 text-neutral-400 hover:text-emerald-300 hover:border-emerald-600',activeCls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500' },
  { value: 'mirdif',    label: 'Mirdif',      cls: 'border-neutral-700 text-neutral-400 hover:text-rose-300 hover:border-rose-600',      activeCls: 'bg-rose-500/15 text-rose-300 border-rose-500' },
]

interface DragState { dayIdx: number; startSlot: number; endSlot: number }
interface DayOff { id: string; date: string; trainer: string }

export function PlanningCalendar() {
  const [trainers, setTrainers] = useState<TrainerRecord[]>([])
  const [events, setEvents] = useState<PlanningEvent[]>([])
  const [dayOffs, setDayOffs] = useState<DayOff[]>([])
  const [filterTrainer, setFilterTrainer] = useState<string | null>(null)
  const [filterCenter, setFilterCenter] = useState<Center | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeMobDay, setActiveMobDay] = useState(() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [nowTop, setNowTop] = useState<number | null>(null)
  const [modal, setModal] = useState<{ open: boolean; date: Date | null; initialStart?: string; initialEnd?: string; event?: PlanningEvent | null }>({ open: false, date: null })
  const [addTrainerOpen, setAddTrainerOpen] = useState(false)
  const [dayOffPopup, setDayOffPopup] = useState<string | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const isDragging = useRef(false)
  const swipeTouchStartX = useRef<number | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const days = Array.from({ length: 7 }, (_, i) => addDays(getMonday(addDays(new Date(), weekOffset * 7)), i))

  function getTrainerStyle(trainerName: string) {
    if (trainerName === 'both') return { card: 'bg-neutral-700/30 border border-neutral-600/50 text-neutral-200', nameText: 'text-neutral-400' }
    const rec = trainers.find(t => t.name === trainerName)
    const c = COLOR_MAP[rec?.color ?? ''] ?? FALLBACK_COLOR
    return { card: c.card, nameText: c.nameText }
  }

  function getTrainerColor(trainerName: string) {
    const rec = trainers.find(t => t.name === trainerName)
    return COLOR_MAP[rec?.color ?? ''] ?? FALLBACK_COLOR
  }

  const fetchTrainers = useCallback(async () => {
    try {
      const res = await fetch('/api/trainers')
      const data = await res.json()
      setTrainers(Array.isArray(data) ? data : [])
    } catch { setTrainers([]) }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const start = toDateKey(days[0])
    const end = toDateKey(days[6])
    try {
      const [evRes, doRes] = await Promise.all([
        fetch(`/api/planning?start=${start}&end=${end}`),
        fetch(`/api/day-offs?start=${start}&end=${end}`),
      ])
      const [evData, doData] = await Promise.all([evRes.json(), doRes.json()])
      setEvents(Array.isArray(evData) ? evData : [])
      setDayOffs(Array.isArray(doData) ? doData : [])
    } catch { setEvents([]); setDayOffs([]) }
    finally { setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  useEffect(() => { fetchTrainers() }, [fetchTrainers])
  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    function tick() {
      const now = new Date()
      const min = now.getHours() * 60 + now.getMinutes()
      setNowTop(min >= H_START * 60 && min <= H_END * 60 ? ((min - H_START * 60) / SLOT_MINUTES) * SLOT_PX : null)
    }
    tick(); const t = setInterval(tick, 60_000); return () => clearInterval(t)
  }, [])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setDayOffPopup(null)
    }
    if (dayOffPopup) document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [dayOffPopup])

  useEffect(() => {
    function onMouseUp() {
      if (!isDragging.current || !drag) { isDragging.current = false; return }
      isDragging.current = false
      const s0 = Math.min(drag.startSlot, drag.endSlot)
      const s1 = Math.max(drag.startSlot, drag.endSlot)
      const day = days[drag.dayIdx]
      setDrag(null)
      setModal({ open: true, date: day, initialStart: slotToTime(s0), initialEnd: slotToTime(s1 + 1), event: null })
    }
    window.addEventListener('mouseup', onMouseUp)
    return () => window.removeEventListener('mouseup', onMouseUp)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag])

  async function toggleTrainerDayOff(dateStr: string, trainerName: string) {
    const existing = dayOffs.find(d => d.date === dateStr && d.trainer === trainerName)
    if (existing) {
      await fetch(`/api/day-offs/${existing.id}`, { method: 'DELETE' })
    } else {
      await fetch('/api/day-offs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, trainer: trainerName }),
      })
    }
    fetchAll()
  }

  async function handleSave(data: EventFormData) {
    if (!modal.date) return
    const body = {
      date: toDateKey(modal.date), trainer: data.trainer, center: data.center,
      start_time: data.start_time, end_time: data.end_time,
      curriculum: data.curriculum || null, lesson: data.lesson || null,
      student_name: data.student_name || null, note: data.note || null,
    }
    if (modal.event) {
      await fetch(`/api/planning/${modal.event.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/planning', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setModal({ open: false, date: null })
    fetchAll()
  }

  async function handleDelete() {
    if (!modal.event) return
    await fetch(`/api/planning/${modal.event.id}`, { method: 'DELETE' })
    setModal({ open: false, date: null })
    fetchAll()
  }

  function onSlotMouseDown(dayIdx: number, slot: number) { isDragging.current = true; setDrag({ dayIdx, startSlot: slot, endSlot: slot }) }
  function onSlotMouseEnter(dayIdx: number, slot: number) {
    if (!isDragging.current || !drag || drag.dayIdx !== dayIdx) return
    setDrag(d => d ? { ...d, endSlot: slot } : d)
  }
  function onSlotTouchStart(e: React.TouchEvent, dayIdx: number, slot: number) {
    isDragging.current = true; setDrag({ dayIdx, startSlot: slot, endSlot: slot }); void e
  }
  function onSlotTouchMove(e: React.TouchEvent, dayIdx: number) {
    if (!isDragging.current || !drag) return
    const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)
    const attr = el?.closest('[data-slot]')?.getAttribute('data-slot')
    if (attr != null && drag.dayIdx === dayIdx) setDrag(d => d ? { ...d, endSlot: parseInt(attr) } : d)
  }
  function onSlotTouchEnd(dayIdx: number) {
    if (!isDragging.current || !drag) { isDragging.current = false; return }
    isDragging.current = false
    const s0 = Math.min(drag.startSlot, drag.endSlot)
    const s1 = Math.max(drag.startSlot, drag.endSlot)
    setDrag(null)
    setModal({ open: true, date: days[dayIdx], initialStart: slotToTime(s0), initialEnd: slotToTime(s1 + 1), event: null })
  }
  function isDragSelected(dayIdx: number, slot: number) {
    if (!drag || drag.dayIdx !== dayIdx) return false
    return slot >= Math.min(drag.startSlot, drag.endSlot) && slot <= Math.max(drag.startSlot, drag.endSlot)
  }

  function filteredEvents(dateStr: string) {
    return events.filter(e =>
      e.date === dateStr &&
      (filterTrainer === null || e.trainer === filterTrainer || e.trainer === 'both') &&
      (filterCenter === null || e.center === filterCenter)
    )
  }

  function isTrainerOff(dateStr: string, trainerName: string) {
    return dayOffs.some(o => o.date === dateStr && o.trainer === trainerName)
  }

  const todayStr = toDateKey(new Date())
  const cols = isMobile ? 1 : 7

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Nav */}
      <div className="flex items-center gap-3 flex-wrap mb-3 flex-shrink-0">
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
          <button onClick={() => setWeekOffset(o => o - 1)} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors" aria-label="Previous week">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-white min-w-[190px] text-center px-1 select-none">{weekLabel(days[0])}</span>
          <button onClick={() => setWeekOffset(o => o + 1)} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors" aria-label="Next week">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => { setWeekOffset(0); setActiveMobDay(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) }}
          className="px-3 py-1.5 text-xs font-medium bg-white text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors"
        >
          Today
        </button>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500">
            <MoonStar className="w-3 h-3" /><span>Click day to mark off</span>
          </div>
          <button
            onClick={() => setAddTrainerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 rounded-lg transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add trainer
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-3 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mr-1">Trainer</span>
          {/* All button */}
          <button onClick={() => setFilterTrainer(null)}
            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${filterTrainer === null ? 'bg-white text-neutral-900 border-white' : 'border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'}`}>
            All
          </button>
          {trainers.map(t => {
            const c = COLOR_MAP[t.color] ?? FALLBACK_COLOR
            const isActive = filterTrainer === t.name
            return (
              <button key={t.name} onClick={() => setFilterTrainer(t.name)}
                className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all capitalize ${isActive ? c.filterActive : `border-neutral-700 text-neutral-400 ${c.filterHover}`}`}>
                {t.name}
              </button>
            )
          })}
        </div>
        <div className="w-px h-4 bg-neutral-800 hidden sm:block" />
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mr-1">Center</span>
          {CENTER_FILTERS.map(f => (
            <button key={String(f.value)} onClick={() => setFilterCenter(f.value)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${filterCenter === f.value ? f.activeCls : f.cls}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile day tabs */}
      {isMobile && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide flex-shrink-0">
          {days.map((d, i) => {
            const isTod = toDateKey(d) === todayStr
            const isAct = activeMobDay === i
            const dateStr = toDateKey(d)
            const offs = dayOffs.filter(o => o.date === dateStr)
            return (
              <button key={i} onClick={() => setActiveMobDay(i)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all ${isAct ? 'bg-white text-neutral-900' : 'text-neutral-500'}`}>
                <span className={`text-[10px] font-semibold uppercase ${isTod && !isAct ? 'text-amber-400' : ''}`}>{DAYS_FR[d.getDay()]}</span>
                <span className={`text-lg font-bold ${isTod && !isAct ? 'text-amber-400' : ''}`}>{d.getDate()}</span>
                {offs.length > 0 && <MoonStar className="w-3 h-3 mt-0.5 text-neutral-500" />}
              </button>
            )
          })}
        </div>
      )}

      {/* Grid */}
      <div
        className="flex-1 min-h-0 overflow-auto rounded-xl border border-neutral-800 bg-neutral-900 select-none"
        onTouchStart={e => { swipeTouchStartX.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          if (isDragging.current || !isMobile) return
          const dx = e.changedTouches[0].clientX - (swipeTouchStartX.current ?? 0)
          swipeTouchStartX.current = null
          if (Math.abs(dx) < 50) return
          if (dx < 0) { activeMobDay < 6 ? setActiveMobDay(d => d + 1) : (setWeekOffset(o => o + 1), setActiveMobDay(0)) }
          else { activeMobDay > 0 ? setActiveMobDay(d => d - 1) : (setWeekOffset(o => o - 1), setActiveMobDay(6)) }
        }}
      >
        {/* Header row */}
        <div className="grid sticky top-0 z-20 bg-neutral-900 border-b border-neutral-800"
          style={{ gridTemplateColumns: `52px repeat(${cols}, 1fr)` }}>
          <div className="border-r border-neutral-800" />
          {days.map((d, i) => {
            if (isMobile && i !== activeMobDay) return null
            const isTod = toDateKey(d) === todayStr
            const dateStr = toDateKey(d)
            const offTrainers = trainers.filter(t => isTrainerOff(dateStr, t.name))
            const isPopupOpen = dayOffPopup === dateStr

            return (
              <div key={i} className="relative border-r border-neutral-800 last:border-r-0">
                <div
                  className={`py-2 text-center cursor-pointer transition-colors group ${isPopupOpen ? 'bg-neutral-800' : 'hover:bg-neutral-800/40'}`}
                  onClick={e => { e.stopPropagation(); setDayOffPopup(isPopupOpen ? null : dateStr) }}
                >
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${isTod ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {DAYS_FR[d.getDay()]}
                  </div>
                  <div className={`text-xl font-bold mt-0.5 ${isTod ? 'text-amber-400' : 'text-white'}`}>
                    {d.getDate()}
                  </div>
                  {offTrainers.length > 0 ? (
                    <div className="flex items-center justify-center gap-1 mt-1 flex-wrap px-1">
                      {offTrainers.map(t => {
                        const c = COLOR_MAP[t.color] ?? FALLBACK_COLOR
                        return (
                          <span key={t.name} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${c.popupActive}`}>
                            <MoonStar className="w-2.5 h-2.5" /><span className="capitalize">{t.name}</span>
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="h-5 mt-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] text-neutral-600 flex items-center gap-0.5"><MoonStar className="w-2.5 h-2.5" />day off</span>
                    </div>
                  )}
                </div>

                {/* Day-off popup */}
                {isPopupOpen && (
                  <div ref={popupRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl p-3 w-48"
                    onClick={e => e.stopPropagation()}>
                    <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2">Mark as day off</p>
                    <div className="flex flex-col gap-1.5">
                      {trainers.map(t => {
                        const off = isTrainerOff(dateStr, t.name)
                        const c = COLOR_MAP[t.color] ?? FALLBACK_COLOR
                        return (
                          <button key={t.name} onClick={() => toggleTrainerDayOff(dateStr, t.name)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all border capitalize ${
                              off ? c.popupActive : 'border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'
                            }`}>
                            <span>{t.name}</span>
                            {off ? <MoonStar className="w-3.5 h-3.5" /> : <span className="text-neutral-600 text-[10px]">off</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div className="grid" style={{ gridTemplateColumns: `52px repeat(${cols}, 1fr)` }}>
          {/* Time column */}
          <div className="border-r border-neutral-800">
            {Array.from({ length: SLOT_COUNT }, (_, s) => {
              const totalMin = H_START * 60 + s * SLOT_MINUTES
              const h = Math.floor(totalMin / 60)
              const m = totalMin % 60
              return (
                <div key={s} style={{ height: SLOT_PX }} className="border-b border-neutral-800/50 flex items-start justify-end pr-2 pt-1">
                  {m === 0
                    ? <span className="text-[10px] text-neutral-500 font-medium">{hhmm(h, 0)}</span>
                    : <span className="text-[9px] text-neutral-700">:30</span>
                  }
                </div>
              )
            })}
          </div>

          {/* Day columns */}
          {days.map((day, di) => {
            if (isMobile && di !== activeMobDay) return null
            const dateStr = toDateKey(day)
            const isTod = dateStr === todayStr
            const isWknd = day.getDay() === 0 || day.getDay() === 6
            const allOff = trainers.length > 0 && trainers.every(t => isTrainerOff(dateStr, t.name))
            const filterTrainerOff = filterTrainer !== null && isTrainerOff(dateStr, filterTrainer)
            const dayEvents = filteredEvents(dateStr)
            const blockSlots = allOff || filterTrainerOff

            const filterTrainerColor = filterTrainer ? (COLOR_MAP[(trainers.find(t => t.name === filterTrainer)?.color ?? '')] ?? FALLBACK_COLOR) : null

            return (
              <div key={di} className={`relative border-r border-neutral-800 last:border-r-0 ${isWknd && !blockSlots ? 'bg-neutral-950/30' : ''} ${blockSlots ? 'bg-neutral-950/70' : ''}`}>

                {/* Full day-off overlay */}
                {blockSlots && (
                  <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center gap-2"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,255,255,0.018) 8px,rgba(255,255,255,0.018) 16px)' }}>
                    <MoonStar className={`w-6 h-6 ${filterTrainerOff && !allOff && filterTrainerColor ? filterTrainerColor.offText : 'text-neutral-700'}`} />
                    <span className={`text-[11px] font-semibold uppercase tracking-widest capitalize ${filterTrainerOff && !allOff && filterTrainerColor ? filterTrainerColor.offText : 'text-neutral-700'}`}>
                      {filterTrainerOff && !allOff ? `${filterTrainer} off` : 'Day off'}
                    </span>
                  </div>
                )}

                {/* Slot cells */}
                {Array.from({ length: SLOT_COUNT }, (_, s) => {
                  const selected = isDragSelected(di, s)
                  const isHalfHour = (s % 2) === 1
                  return (
                    <div key={s} data-slot={s} style={{ height: SLOT_PX }}
                      className={`border-b transition-colors relative
                        ${isHalfHour ? 'border-dashed border-neutral-800/40' : 'border-neutral-800/60'}
                        ${blockSlots ? 'cursor-not-allowed' : 'cursor-pointer'}
                        ${selected ? 'bg-white/10' : !blockSlots ? 'hover:bg-white/[0.025]' : ''}
                      `}
                      onMouseDown={() => { if (!blockSlots) onSlotMouseDown(di, s) }}
                      onMouseEnter={() => onSlotMouseEnter(di, s)}
                      onTouchStart={e => { if (!blockSlots) onSlotTouchStart(e, di, s) }}
                      onTouchMove={e => onSlotTouchMove(e, di)}
                      onTouchEnd={() => { if (!blockSlots) onSlotTouchEnd(di) }}
                    >
                      {selected && s === Math.min(drag!.startSlot, drag!.endSlot) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <span className="text-[10px] font-semibold text-white/70 bg-white/10 px-1.5 py-0.5 rounded">
                            {slotToTime(Math.min(drag!.startSlot, drag!.endSlot))} – {slotToTime(Math.max(drag!.startSlot, drag!.endSlot) + 1)}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Events */}
                {(() => {
                  const layout = computeEventLayout(dayEvents)
                  return dayEvents.map(ev => {
                  const startMin = timeToMin(ev.start_time.slice(0, 5))
                  const endMin = timeToMin(ev.end_time.slice(0, 5))
                  const top = ((startMin - H_START * 60) / SLOT_MINUTES) * SLOT_PX
                  const height = Math.max(((endMin - startMin) / SLOT_MINUTES) * SLOT_PX - 2, 24)
                  const st = getTrainerStyle(ev.trainer)
                  const trainerOff = ev.trainer !== 'both' && isTrainerOff(dateStr, ev.trainer)
                  const showOffBadge = trainerOff && filterTrainer === null
                  const displayName = ev.trainer === 'both' ? 'All trainers' : ev.trainer
                  const { col, totalCols } = layout.get(ev.id) ?? { col: 0, totalCols: 1 }
                  const pct = 100 / totalCols
                  const evLeft = `calc(${col * pct}% + 2px)`
                  const evWidth = `calc(${pct}% - 3px)`
                  return (
                    <div key={ev.id} style={{ top, height, left: evLeft, width: evWidth }}
                      className={`absolute rounded-lg px-2 py-1 cursor-pointer hover:brightness-110 transition-all z-20 overflow-hidden ${st.card} ${trainerOff ? 'opacity-40 grayscale-[40%]' : ''}`}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); setModal({ open: true, date: new Date(ev.date + 'T00:00:00'), event: ev }) }}>
                      <div className="flex items-center gap-1 leading-none mb-0.5">
                        <p className={`text-[10px] font-bold uppercase tracking-wide capitalize ${st.nameText}`}>
                          {displayName}
                        </p>
                        {showOffBadge && <MoonStar className="w-2.5 h-2.5 text-neutral-400 shrink-0" />}
                      </div>
                      {ev.student_name && <p className="text-[11px] font-medium truncate leading-tight">{ev.student_name}</p>}
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${CENTER_BADGE[ev.center]}`}>{CENTER_LABELS[ev.center]}</span>
                        {ev.curriculum && <span className="text-[9px] text-neutral-500">{ev.curriculum}</span>}
                        {ev.lesson && <span className="text-[9px] text-neutral-500">L{ev.lesson}</span>}
                      </div>
                    </div>
                  )
                  })
                })()}

                {/* Now line */}
                {isTod && nowTop !== null && (
                  <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
                    <div className="relative h-[2px] bg-amber-400">
                      <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-xs text-neutral-600">Loading...</p>
        </div>
      )}

      <EventModal
        open={modal.open} date={modal.date} initialStart={modal.initialStart} initialEnd={modal.initialEnd}
        event={modal.event} trainers={trainers}
        onClose={() => setModal({ open: false, date: null })}
        onSave={handleSave}
        onDelete={modal.event ? handleDelete : undefined}
      />

      <AddTrainerModal
        open={addTrainerOpen}
        onClose={() => setAddTrainerOpen(false)}
        onAdded={fetchTrainers}
      />
    </div>
  )
}
