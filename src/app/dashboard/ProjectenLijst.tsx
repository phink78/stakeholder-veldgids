'use client'

import Link from 'next/link'
import { tokens } from '@/lib/tokens'

interface Project {
  id: string
  naam: string
  thema: string
  created_at: string
}

export default function ProjectenLijst({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div style={{
        padding: '40px 0',
        color: tokens.inkSubtle,
        fontSize: 15,
        fontFamily: tokens.serif,
        fontStyle: 'italic',
      }}>
        Nog geen projecten. Maak het eerste aan.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/dashboard/${p.id}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            padding: '20px 24px',
            background: tokens.surface,
            border: `1px solid ${tokens.rule}`,
            borderRadius: 6,
            transition: 'border-color 0.15s',
          }}
        >
          <div>
            <div style={{
              fontFamily: tokens.serif,
              fontSize: 17,
              color: tokens.ink,
              fontWeight: 400,
              marginBottom: 4,
            }}>
              {p.naam}
            </div>
            <div style={{
              fontSize: 13,
              color: tokens.inkMuted,
              lineHeight: 1.4,
            }}>
              {p.thema}
            </div>
          </div>
          <div style={{
            fontSize: 11,
            color: tokens.inkSubtle,
            fontFamily: tokens.mono,
            whiteSpace: 'nowrap',
            marginLeft: 24,
          }}>
            {new Date(p.created_at).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </Link>
      ))}
    </div>
  )
}
