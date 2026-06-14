import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { tokens } from '@/lib/tokens'
import NieuwProjectFormulier from './NieuwProjectFormulier'
import ProjectenLijst from './ProjectenLijst'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, naam, thema, created_at')
    .order('created_at', { ascending: false })

  return (
    <div style={{
      minHeight: '100vh',
      background: tokens.paper,
    }}>
      {/* Header */}
      <header style={{
        borderBottom: `1px solid ${tokens.rule}`,
        padding: '20px 56px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          fontFamily: tokens.serif,
          fontSize: 18,
          fontWeight: 600,
          color: tokens.ink,
          letterSpacing: '-0.01em',
        }}>
          Stakeholder Veldgids
        </div>
        <div style={{
          fontSize: 12,
          color: tokens.inkSubtle,
          fontFamily: tokens.mono,
        }}>
          {user.email}
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '56px 24px' }}>
        {/* Titel */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{
            fontFamily: tokens.serif,
            fontSize: 32,
            fontWeight: 400,
            color: tokens.ink,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}>
            Projecten
          </h1>
          <p style={{ color: tokens.inkMuted, fontSize: 15 }}>
            Elk project is een ecosysteem-mapping voor één klant rond één thema.
          </p>
        </div>

        <NieuwProjectFormulier />

        <ProjectenLijst projects={projects ?? []} />
      </main>
    </div>
  )
}
