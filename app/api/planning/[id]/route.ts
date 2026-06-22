import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { date, trainer, center, start_time, end_time, curriculum, lesson, student_name, note } = body

  if (!date || !trainer || !center || !start_time || !end_time)
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('planning_events')
    .update({ date, trainer, center, start_time, end_time, curriculum, lesson, student_name, note })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('planning_events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
