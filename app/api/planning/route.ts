import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('planning_events')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (start) query = query.gte('date', start)
  if (end) query = query.lte('date', end)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { date, trainer, center, start_time, end_time, curriculum, student_name, note } = body

  if (!date || !trainer || !center || !start_time || !end_time)
    return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('planning_events')
    .insert({ date, trainer, center, start_time, end_time, curriculum, student_name, note })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
