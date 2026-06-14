'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { tokens } from '@/lib/tokens'

export default function NieuwProjectFormulier() {
  const [open, setOpen] = useState(false)
  const [naam, setNaam] = useState('')
  const [thema, setThema] = useState('')
  const [laden, setLaden] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function maakProject(e: React.FormEvent) {
    e.preventDefault()
    if (!naam.trim() || !thema.trim()) return

    setLaden(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const { data, error } = await sb
      .from('projects')
      .insert({ naam: naam.trim(), thema: thema.trim(), user_id: user.id })
      .select('id')
      .single()

    if (!error && data?.id) {
      router.push(`/dashboard/${data.id}`)
    }
    setLaden(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 20px',
          background: tokens.accent,
          color: tokens.surface,
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 40,
          letterSpacing: '0.01em',
        }}
      >
        + Nieuw project
      </button>
    )
  }

  return (
    <form
      onSubmit={maakProject}
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.rule}`,
        borderRadius: 8,
        padding: '28px 32px',
        marginBottom: 40,
        maxWidth: 560,
      }}
    >
      <div style={{
        fontFamily: tokens.serif,
        fontSize: 18,
        color: tokens.ink,
        marginBottom: 24,
      }}>
        Nieuw project
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStijl}>Klantnaam</label>
        <input
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="bijv. Aidsfonds"
          required
          style={inputStijl}
        />
      </div>

      <div style={{ marginBottom: 28 }}>
        <label style={labelStijl}>Thema</label>
        <input
          value={thema}
          onChange={(e) => setThema(e.target.value)}
          placeholder="bijv. HIV-preventie in Nederland richting 2030"
          required
          style={inputStijl}
        />
        <div style={{ fontSize: 12, color: tokens.inkSubtle, marginTop: 6 }}>
          Formuleer als een strategische richting, niet als een onderwerp.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="submit"
          disabled={laden || !naam || !thema}
          style={{
            padding: '11px 24px',
            background: laden ? tokens.inkSubtle : tokens.accent,
            color: tokens.surface,
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: laden ? 'not-allowed' : 'pointer',
          }}
        >
          {laden ? 'Aanmaken…' : 'Project aanmaken'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setNaam(''); setThema('') }}
          style={{
            padding: '11px 20px',
            color: tokens.inkMuted,
            fontSize: 14,
          }}
        >
          Annuleren
        </button>
      </div>
    </form>
  )
}

const labelStijl: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: tokens.inkMuted,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontFamily: tokens.mono,
  marginBottom: 8,
}

const inputStijl: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: `1px solid ${tokens.rule}`,
  borderRadius: 6,
  background: tokens.paper,
  color: tokens.ink,
  fontSize: 15,
  outline: 'none',
}
