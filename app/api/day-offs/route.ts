import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const supabase = await createSupabaseServerClient()
  let query = supabase.from('planning_day_offs').select('*').order('date')
  if (start) query = query.gte('date', start)
  if (end) query = query.lte('date', end)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { date, trainer, note } = await req.json()
  if (!date || !trainer) return NextResponse.json({ error: 'Date and trainer are required.' }, { status: 400 })

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('planning_day_offs')
    .insert({ date, trainer, note })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
