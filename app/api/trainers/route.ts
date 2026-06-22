import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('planning_trainers')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { name, color } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  const slug = name.trim().toLowerCase().replace(/\s+/g, '_')
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('planning_trainers')
    .insert({ name: slug, color: color ?? 'sky' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
