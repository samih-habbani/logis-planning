'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PlanningEvent, EventFormData } from '@/types/planning'
import { CENTER_LABELS, DAYS_FR, MONTHS_FR, H_START, H_END, SLOT_MINUTES, SLOT_PX } from '@/types/planning'
import { EventModal } from './EventModal'

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

const TRAINER_STYLE = {
  ali:   { card: 'bg-sky-500/10 border border-sky-500/30 text-sky-200',          name: 'text-sky-400' },
  samih: { card: 'bg-violet-500/10 border border-violet-500/30 text-violet-200', name: 'text-violet-400' },
}
const CENTER_BADGE = {
  city_mall: 'bg-amber-500/20 text-amber-300',
  oasis:     'bg-emerald-500/20 text-emerald-300',
  mirdif:    'bg-rose-500/20 text-rose-300',
}

interface DragState {
  dayIdx: number
  startSlot: number
  endSlot: number
}

export function PlanningCalendar() {
  const [events, setEvents] = useState<PlanningEvent[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeMobDay, setActiveMobDay] = useState(() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [nowTop, setNowTop] = useState<number | null>(null)
  const [modal, setModal] = useState<{ open: boolean; date: Date | null; initialStart?: string; initialEnd?: string; event?: PlanningEvent | null }>({ open: false, date: null })

  // Drag-to-select state
  const [drag, setDrag] = useState<DragState | null>(null)
  const isDragging = useRef(false)
  const touchStartY = useRef<number | null>(null)
  const swipeTouchStartX = useRef<number | null>(null)

  const days = Array.from({ length: 7 }, (_, i) => addDays(getMonday(addDays(new Date(), weekOffset * 7)), i))

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/planning?start=${toDateKey(days[0])}&end=${toDateKey(days[6])}`)
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch { setEvents([]) }
    finally { setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  useEffect(() => { fetchEvents() }, [fetchEvents])

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

  // Cancel drag on mouseup anywhere
  useEffect(() => {
    function onMouseUp() {
      if (!isDragging.current || !drag) { isDragging.current = false; return }
      isDragging.current = false
      const s0 = Math.min(drag.startSlot, drag.endSlot)
      const s1 = Math.max(drag.startSlot, drag.endSlot)
      const day = days[drag.dayIdx]
      setDrag(null)
      setModal({
        open: true,
        date: day,
        initialStart: slotToTime(s0),
        initialEnd: slotToTime(s1 + 1),
        event: null,
      })
    }
    window.addEventListener('mouseup', onMouseUp)
    return () => window.removeEventListener('mouseup', onMouseUp)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag])

  async function handleSave(data: EventFormData) {
    if (!modal.date) return
    const body = {
      date: toDateKey(modal.date),
      trainer: data.trainer,
      center: data.center,
      start_time: data.start_time,
      end_time: data.end_time,
      curriculum: data.curriculum || null,
      student_name: data.student_name || null,
      note: data.note || null,
    }
    if (modal.event) {
      await fetch(`/api/planning/${modal.event.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/planning', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setModal({ open: false, date: null })
    fetchEvents()
  }

  async function handleDelete() {
    if (!modal.event) return
    await fetch(`/api/planning/${modal.event.id}`, { method: 'DELETE' })
    setModal({ open: false, date: null })
    fetchEvents()
  }

  // Slot interaction handlers
  function onSlotMouseDown(dayIdx: number, slot: number) {
    isDragging.current = true
    setDrag({ dayIdx, startSlot: slot, endSlot: slot })
  }

  function onSlotMouseEnter(dayIdx: number, slot: number) {
    if (!isDragging.current || !drag || drag.dayIdx !== dayIdx) return
    setDrag(d => d ? { ...d, endSlot: slot } : d)
  }

  // Touch drag for mobile
  function onSlotTouchStart(e: React.TouchEvent, dayIdx: number, slot: number) {
    touchStartY.current = e.touches[0].clientY
    isDragging.current = true
    setDrag({ dayIdx, startSlot: slot, endSlot: slot })
  }

  function onSlotTouchMove(e: React.TouchEvent, dayIdx: number) {
    if (!isDragging.current || !drag) return
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const slotAttr = el?.closest('[data-slot]')?.getAttribute('data-slot')
    if (slotAttr !== null && slotAttr !== undefined) {
      const s = parseInt(slotAttr)
      if (drag.dayIdx === dayIdx) setDrag(d => d ? { ...d, endSlot: s } : d)
    }
  }

  function onSlotTouchEnd(dayIdx: number) {
    if (!isDragging.current || !drag) { isDragging.current = false; return }
    isDragging.current = false
    const s0 = Math.min(drag.startSlot, drag.endSlot)
    const s1 = Math.max(drag.startSlot, drag.endSlot)
    const day = days[drag.dayIdx]
    setDrag(null)
    setModal({ open: true, date: day, initialStart: slotToTime(s0), initialEnd: slotToTime(s1 + 1), event: null })
  }

  function isDragSelected(dayIdx: number, slot: number) {
    if (!drag || drag.dayIdx !== dayIdx) return false
    const s0 = Math.min(drag.startSlot, drag.endSlot)
    const s1 = Math.max(drag.startSlot, drag.endSlot)
    return slot >= s0 && slot <= s1
  }

  const todayStr = toDateKey(new Date())
  const cols = isMobile ? 1 : 7

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Nav */}
      <div className="flex items-center gap-3 flex-wrap mb-4 flex-shrink-0">
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
          <button onClick={() => setWeekOffset(o => o - 1)} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors" aria-label="Semaine précédente">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-white min-w-[190px] text-center px-1 select-none">{weekLabel(days[0])}</span>
          <button onClick={() => setWeekOffset(o => o + 1)} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors" aria-label="Semaine suivante">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => { setWeekOffset(0); setActiveMobDay(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) }}
          className="px-3 py-1.5 text-xs font-medium bg-white text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors"
        >
          Today
        </button>
        <div className="hidden sm:flex items-center gap-4 ml-auto text-xs text-neutral-500 flex-wrap">
          {[['bg-sky-500','Ali'],['bg-violet-500','Samih'],['bg-amber-500/60','City Mall'],['bg-emerald-500/60','Oasis'],['bg-rose-500/60','Mirdif']].map(([bg, label]) => (
            <div key={label} className="flex items-center gap-1.5"><div className={`w-2.5 h-2.5 rounded-sm ${bg}`} />{label}</div>
          ))}
          <span className="text-neutral-700">·</span>
          <span className="text-neutral-600 italic">Drag to select duration</span>
        </div>
      </div>

      {/* Mobile day tabs */}
      {isMobile && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide flex-shrink-0">
          {days.map((d, i) => {
            const isTod = toDateKey(d) === todayStr
            const isAct = activeMobDay === i
            return (
              <button key={i} onClick={() => setActiveMobDay(i)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all ${isAct ? 'bg-white text-neutral-900' : 'text-neutral-500'}`}>
                <span className={`text-[10px] font-semibold uppercase ${isTod && !isAct ? 'text-amber-400' : ''}`}>{DAYS_FR[d.getDay()]}</span>
                <span className={`text-lg font-bold ${isTod && !isAct ? 'text-amber-400' : ''}`}>{d.getDate()}</span>
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
            return (
              <div key={i} className="py-3 text-center border-r border-neutral-800 last:border-r-0">
                <div className={`text-[10px] font-bold uppercase tracking-widest ${isTod ? 'text-amber-400' : 'text-neutral-500'}`}>{DAYS_FR[d.getDay()]}</div>
                <div className={`text-xl font-bold mt-0.5 ${isTod ? 'text-amber-400' : 'text-white'}`}>{d.getDate()}</div>
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
            const dayEvents = events.filter(e => e.date === dateStr)

            return (
              <div key={di} className={`relative border-r border-neutral-800 last:border-r-0 ${isWknd ? 'bg-neutral-950/30' : ''}`}>
                {/* Slot cells */}
                {Array.from({ length: SLOT_COUNT }, (_, s) => {
                  const selected = isDragSelected(di, s)
                  const isHalfHour = (s % 2) === 1
                  return (
                    <div
                      key={s}
                      data-slot={s}
                      style={{ height: SLOT_PX }}
                      className={`border-b cursor-pointer transition-colors relative
                        ${isHalfHour ? 'border-dashed border-neutral-800/40' : 'border-neutral-800/60'}
                        ${selected ? 'bg-white/10' : 'hover:bg-white/[0.025]'}
                      `}
                      onMouseDown={() => onSlotMouseDown(di, s)}
                      onMouseEnter={() => onSlotMouseEnter(di, s)}
                      onTouchStart={e => onSlotTouchStart(e, di, s)}
                      onTouchMove={e => onSlotTouchMove(e, di)}
                      onTouchEnd={() => onSlotTouchEnd(di)}
                    >
                      {/* Plus hint on hover (only when not dragging) */}
                      {!drag && (
                        <span className="hidden group-hover:flex absolute inset-0 items-center justify-center text-neutral-700 text-base select-none pointer-events-none">+</span>
                      )}
                      {/* Drag selection label on first selected slot */}
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
                {dayEvents.map(ev => {
                  const startMin = timeToMin(ev.start_time.slice(0, 5))
                  const endMin = timeToMin(ev.end_time.slice(0, 5))
                  const top = ((startMin - H_START * 60) / SLOT_MINUTES) * SLOT_PX
                  const height = Math.max(((endMin - startMin) / SLOT_MINUTES) * SLOT_PX - 2, 24)
                  const s = TRAINER_STYLE[ev.trainer] ?? TRAINER_STYLE.ali
                  return (
                    <div key={ev.id} style={{ top, height, left: 3, right: 3 }}
                      className={`absolute rounded-lg px-2 py-1 cursor-pointer hover:brightness-110 transition-all z-10 overflow-hidden ${s.card}`}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); setModal({ open: true, date: new Date(ev.date + 'T00:00:00'), event: ev }) }}>
                      <p className={`text-[10px] font-bold uppercase tracking-wide leading-none mb-0.5 ${s.name}`}>
                        {ev.trainer === 'ali' ? 'Ali' : 'Samih'}
                      </p>
                      {ev.student_name && <p className="text-[11px] font-medium truncate leading-tight">{ev.student_name}</p>}
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${CENTER_BADGE[ev.center]}`}>{CENTER_LABELS[ev.center]}</span>
                        {ev.curriculum && <span className="text-[9px] text-neutral-500">{ev.curriculum}</span>}
                      </div>
                    </div>
                  )
                })}

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
        open={modal.open}
        date={modal.date}
        initialStart={modal.initialStart}
        initialEnd={modal.initialEnd}
        event={modal.event}
        onClose={() => setModal({ open: false, date: null })}
        onSave={handleSave}
        onDelete={modal.event ? handleDelete : undefined}
      />
    </div>
  )
}
