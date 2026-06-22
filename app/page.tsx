import { PlanningCalendar } from '@/components/planning/PlanningCalendar'

export default function Home() {
  return (
    <div className="flex flex-col h-screen p-4 sm:p-6 gap-4">
      {/* Header */}
      <header className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F5451D] flex items-center justify-center">
            <span className="text-white text-xs font-black">L</span>
          </div>
          <span className="font-semibold text-white tracking-tight">Logiscool</span>
          <span className="text-neutral-600">·</span>
          <span className="text-sm text-neutral-400 font-medium">Trainer Schedule</span>
        </div>
      </header>

      {/* Calendar */}
      <div className="flex-1 min-h-0">
        <PlanningCalendar />
      </div>
    </div>
  )
}
