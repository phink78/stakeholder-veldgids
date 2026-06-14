'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { tokens } from '@/lib/tokens'
import type { AvgLabel, OrgType, Strategie } from '@/lib/supabase/types'

interface Org {
  id: string
  naam: string
  type: OrgType | null
  eigen_agenda: string | null
  positie_x: number
  positie_y: number
  avg_label: AvgLabel
  strategie: Strategie | null
  focus: boolean
  ai_ingevuld: boolean
}

interface Project {
  id: string
  naam: string
  thema: string
}

interface Props {
  project: Project
  initieleOrgs: Org[]
}

const STRATEGIE_OPTIES: Strategie[] = [
  'Remain on strategy',
  'Last action',
  'Increase action',
  'Start engagement',
]

const AVG_KLEUREN: Record<AvgLabel, { bg: string; text: string }> = {
  publiek: { bg: tokens.avgPubSoft, text: tokens.avgPub },
  intern: { bg: tokens.accentSoft, text: tokens.accent },
  vertrouwelijk: { bg: tokens.warnSoft, text: tokens.warn },
}

export default function ProjectWerkruimte({ project, initieleOrgs }: Props) {
  const [orgs, setOrgs] = useState<Org[]>(initieleOrgs)
  const [geselecteerd, setGeselecteerd] = useState<Org | null>(initieleOrgs[0] ?? null)
  const [nieuwNaam, setNieuwNaam] = useState('')
  const [tab, setTab] = useState<'voorbereiding' | 'matrix' | 'vragen'>('voorbereiding')
  const [aiLaden, setAiLaden] = useState(false)
  const [aiSuggesties, setAiSuggesties] = useState<string[]>([])
  const [opslaan, setOpslaan] = useState(false)
  const bewerkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  // ── Organisatie toevoegen ──────────────────────────────────────────────────
  async function voegOrgToe(naam: string) {
    const trimmed = naam.trim()
    if (!trimmed || orgs.some((o) => o.naam.toLowerCase() === trimmed.toLowerCase())) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('organisations')
      .insert({
        project_id: project.id,
        naam: trimmed,
        positie_x: 0.5,
        positie_y: 0.5,
        avg_label: 'publiek',
        focus: false,
        ai_ingevuld: false,
      })
      .select()
      .single()

    if (!error && data) {
      setOrgs((prev) => [...prev, data as Org])
      setGeselecteerd(data as Org)
    }
    setNieuwNaam('')
  }

  function handleChipInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      voegOrgToe(nieuwNaam)
    }
  }

  // ── Profiel opslaan (debounced) ────────────────────────────────────────────
  function updateGeselecteerd(velden: Partial<Org>) {
    if (!geselecteerd) return
    const bijgewerkt = { ...geselecteerd, ...velden }
    setGeselecteerd(bijgewerkt)
    setOrgs((prev) => prev.map((o) => (o.id === bijgewerkt.id ? bijgewerkt : o)))

    if (bewerkTimer.current) clearTimeout(bewerkTimer.current)
    bewerkTimer.current = setTimeout(async () => {
      setOpslaan(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('organisations').update(velden).eq('id', bijgewerkt.id)
      setOpslaan(false)
    }, 800)
  }

  // ── AI pre-fill ────────────────────────────────────────────────────────────
  async function vulAiIn() {
    if (!geselecteerd) return
    setAiLaden(true)
    setAiSuggesties([])

    try {
      const res = await fetch('/api/prefill-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naam: geselecteerd.naam, thema: project.thema }),
      })
      const data = await res.json()

      if (data.eigen_agenda) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('organisations').update({ eigen_agenda: data.eigen_agenda, type: data.type ?? null, ai_ingevuld: true }).eq('id', geselecteerd.id)

        updateGeselecteerd({ eigen_agenda: data.eigen_agenda, type: data.type ?? null, ai_ingevuld: true })
      }
      if (data.suggesties?.length) {
        setAiSuggesties(data.suggesties)
      }
    } catch {
      // stil falen — geen foutmelding
    }
    setAiLaden(false)
  }

  // ── Org verwijderen ────────────────────────────────────────────────────────
  async function verwijderOrg(id: string) {
    await supabase.from('organisations').delete().eq('id', id)
    const nieuw = orgs.filter((o) => o.id !== id)
    setOrgs(nieuw)
    if (geselecteerd?.id === id) setGeselecteerd(nieuw[0] ?? null)
  }

  // ── Matrix drag ────────────────────────────────────────────────────────────
  function onMatrixDrag(orgId: string, x: number, y: number) {
    updateGeselecteerd({ positie_x: x, positie_y: y })
  }

  return (
    <div style={{ minHeight: '100vh', background: tokens.paper }}>
      {/* Header */}
      <header style={{
        borderBottom: `1px solid ${tokens.rule}`,
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/dashboard" style={{ color: tokens.inkSubtle, fontSize: 13 }}>
            ← Projecten
          </Link>
          <div>
            <span style={{ fontFamily: tokens.serif, fontSize: 17, color: tokens.ink, fontWeight: 400 }}>
              {project.naam}
            </span>
            <span style={{ fontSize: 13, color: tokens.inkMuted, marginLeft: 12 }}>
              {project.thema}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <nav style={{ display: 'flex', gap: 4 }}>
          {(['voorbereiding', 'matrix', 'vragen'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px',
                borderRadius: 5,
                fontSize: 13,
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? tokens.ink : tokens.inkMuted,
                background: tab === t ? tokens.surfaceAlt : 'transparent',
                letterSpacing: '0.01em',
                textTransform: 'capitalize',
              }}
            >
              {t === 'voorbereiding' ? 'Voorbereiding' : t === 'matrix' ? 'Matrix' : 'Vragen'}
            </button>
          ))}
        </nav>

        <div style={{ fontSize: 11, color: tokens.inkSubtle, fontFamily: tokens.mono, opacity: opslaan ? 1 : 0, transition: 'opacity 0.3s' }}>
          opslaan…
        </div>
      </header>

      {/* Voorbereiding-tab */}
      {tab === 'voorbereiding' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: 'calc(100vh - 61px)' }}>
          {/* Linker kolom — org chips */}
          <div style={{
            borderRight: `1px solid ${tokens.rule}`,
            padding: '28px 24px',
            overflowY: 'auto',
          }}>
            <div style={{
              fontSize: 11,
              color: tokens.inkSubtle,
              fontFamily: tokens.mono,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              Organisaties
            </div>

            {/* Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              {orgs.map((org) => (
                <div
                  key={org.id}
                  onClick={() => setGeselecteerd(org)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '9px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: geselecteerd?.id === org.id ? tokens.surfaceAlt : 'transparent',
                    border: `1px solid ${geselecteerd?.id === org.id ? tokens.rule : 'transparent'}`,
                    transition: 'background 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {org.focus && (
                      <span style={{ fontSize: 10, color: tokens.accent }}>★</span>
                    )}
                    <span style={{ fontSize: 14, color: tokens.ink }}>{org.naam}</span>
                    {org.ai_ingevuld && (
                      <span style={{
                        fontSize: 9,
                        color: tokens.aiAccent,
                        fontFamily: tokens.mono,
                        letterSpacing: '0.04em',
                      }}>AI</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); verwijderOrg(org.id) }}
                    style={{ color: tokens.inkSubtle, fontSize: 16, padding: '0 4px', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Toevoegen */}
            <input
              value={nieuwNaam}
              onChange={(e) => setNieuwNaam(e.target.value)}
              onKeyDown={handleChipInput}
              onBlur={() => { if (nieuwNaam.trim()) voegOrgToe(nieuwNaam) }}
              placeholder="Organisatie toevoegen…"
              style={{
                width: '100%',
                padding: '9px 12px',
                border: `1px solid ${tokens.rule}`,
                borderRadius: 6,
                background: tokens.surface,
                color: tokens.ink,
                fontSize: 13,
                outline: 'none',
              }}
            />
            <div style={{ fontSize: 11, color: tokens.inkSubtle, marginTop: 6 }}>
              Enter of komma om toe te voegen
            </div>

            {/* AI-suggesties */}
            {aiSuggesties.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{
                  fontSize: 11,
                  color: tokens.aiAccent,
                  fontFamily: tokens.mono,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}>
                  AI-suggesties
                </div>
                {aiSuggesties.map((s) => (
                  <button
                    key={s}
                    onClick={() => voegOrgToe(s)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      marginBottom: 4,
                      background: tokens.aiSoft,
                      border: `1px solid ${tokens.aiAccent}22`,
                      borderRadius: 6,
                      fontSize: 13,
                      color: tokens.ink,
                      cursor: 'pointer',
                    }}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rechter paneel — profiel */}
          <div style={{ padding: '32px 48px', overflowY: 'auto' }}>
            {geselecteerd ? (
              <OrgProfiel
                org={geselecteerd}
                onChange={updateGeselecteerd}
                onAiVul={vulAiIn}
                aiLaden={aiLaden}
              />
            ) : (
              <div style={{
                marginTop: 80,
                textAlign: 'center',
                color: tokens.inkSubtle,
                fontFamily: tokens.serif,
                fontStyle: 'italic',
                fontSize: 17,
              }}>
                Selecteer een organisatie om het profiel te bewerken.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Matrix-tab */}
      {tab === 'matrix' && (
        <MatrixScherm orgs={orgs} onDrag={onMatrixDrag} />
      )}

      {/* Vragen-tab */}
      {tab === 'vragen' && (
        <VraagTemplates thema={project.thema} />
      )}
    </div>
  )
}

// ── Organisatie-profiel card ─────────────────────────────────────────────────

function OrgProfiel({
  org,
  onChange,
  onAiVul,
  aiLaden,
}: {
  org: Org
  onChange: (velden: Partial<Org>) => void
  onAiVul: () => void
  aiLaden: boolean
}) {
  const avg = AVG_KLEUREN[org.avg_label]

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Naam + AI-knop */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <h2 style={{
          fontFamily: tokens.serif,
          fontSize: 26,
          fontWeight: 400,
          color: tokens.ink,
          letterSpacing: '-0.02em',
        }}>
          {org.naam}
        </h2>
        <button
          onClick={onAiVul}
          disabled={aiLaden}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            background: aiLaden ? tokens.aiSoft : tokens.aiAccent,
            color: aiLaden ? tokens.aiAccent : tokens.surface,
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: tokens.mono,
            letterSpacing: '0.04em',
            cursor: aiLaden ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {aiLaden ? '⟳ AI werkt…' : '✦ AI pre-fill'}
        </button>
      </div>

      {/* Type */}
      <Veld label="Type organisatie">
        <select
          value={org.type ?? ''}
          onChange={(e) => onChange({ type: (e.target.value as OrgType) || null })}
          style={selectStijl}
        >
          <option value="">— selecteer —</option>
          {(['NGO', 'Overheid', 'Bedrijf', 'Media', 'Academisch', 'Anders'] as OrgType[]).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Veld>

      {/* Eigen agenda */}
      <Veld
        label="Eigen agenda"
        badge={org.ai_ingevuld ? 'door AI ingevuld' : undefined}
        badgeKleur={tokens.aiAccent}
      >
        <textarea
          value={org.eigen_agenda ?? ''}
          onChange={(e) => onChange({ eigen_agenda: e.target.value, ai_ingevuld: false })}
          placeholder="Wat is de eigen agenda van deze organisatie rond het thema?"
          rows={5}
          style={{ ...inputStijl, resize: 'vertical', lineHeight: 1.6 }}
        />
      </Veld>

      {/* Strategie */}
      <Veld label="Strategie">
        <select
          value={org.strategie ?? ''}
          onChange={(e) => onChange({ strategie: (e.target.value as Strategie) || null })}
          style={selectStijl}
        >
          <option value="">— nog niet bepaald —</option>
          {STRATEGIE_OPTIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Veld>

      {/* AVG-label */}
      <Veld label="AVG-classificatie">
        <div style={{ display: 'flex', gap: 8 }}>
          {(['publiek', 'intern', 'vertrouwelijk'] as AvgLabel[]).map((l) => (
            <button
              key={l}
              onClick={() => onChange({ avg_label: l })}
              style={{
                padding: '7px 14px',
                borderRadius: 5,
                fontSize: 12,
                fontFamily: tokens.mono,
                fontWeight: 600,
                letterSpacing: '0.04em',
                background: org.avg_label === l ? AVG_KLEUREN[l].bg : 'transparent',
                color: org.avg_label === l ? AVG_KLEUREN[l].text : tokens.inkSubtle,
                border: `1px solid ${org.avg_label === l ? AVG_KLEUREN[l].text + '44' : tokens.rule}`,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: tokens.inkSubtle, marginTop: 8 }}>
          {org.avg_label === 'publiek' && 'Rol-niveau data — lange retentie, geen persoonsgegevens'}
          {org.avg_label === 'intern' && 'Intern B2B-contact — normale retentie, beperkt AVG-risico'}
          {org.avg_label === 'vertrouwelijk' && 'Persoonsgegevens aanwezig — strikte retentie vereist'}
        </div>
      </Veld>

      {/* Focus */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
        <button
          onClick={() => onChange({ focus: !org.focus })}
          style={{
            padding: '8px 16px',
            background: org.focus ? tokens.accentSoft : 'transparent',
            color: org.focus ? tokens.accent : tokens.inkMuted,
            border: `1px solid ${org.focus ? tokens.accent + '44' : tokens.rule}`,
            borderRadius: 5,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {org.focus ? '★ Focus-stakeholder' : '☆ Toevoegen aan top-5'}
        </button>
        <div style={{ fontSize: 12, color: tokens.inkSubtle }}>
          Focus-stakeholders krijgen prioriteit in de matrix en het rapport.
        </div>
      </div>
    </div>
  )
}

// ── Matrix ──────────────────────────────────────────────────────────────────

function MatrixScherm({
  orgs,
  onDrag,
}: {
  orgs: Org[]
  onDrag: (id: string, x: number, y: number) => void
}) {
  const matrixRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  function handleMouseDown(orgId: string) {
    setDraggingId(orgId)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!draggingId || !matrixRef.current) return
    const rect = matrixRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    onDrag(draggingId, x, y)
  }

  function handleMouseUp() {
    setDraggingId(null)
  }

  return (
    <div style={{ padding: '40px 56px', height: 'calc(100vh - 61px)', display: 'flex', flexDirection: 'column' }}>
      {/* Assen-labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={asLabel}>Laag belang</div>
        <div style={asLabel}>Hoog belang</div>
      </div>

      {/* Matrix-canvas */}
      <div
        ref={matrixRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          flex: 1,
          position: 'relative',
          background: tokens.surface,
          border: `1px solid ${tokens.rule}`,
          borderRadius: 8,
          cursor: draggingId ? 'grabbing' : 'default',
          userSelect: 'none',
        }}
      >
        {/* Middellijn */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 1,
          background: tokens.rule,
        }} />
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: 1,
          background: tokens.rule,
        }} />

        {/* Kwadranten-labels */}
        {[
          { label: 'Informeren', top: '8px', left: '8px' },
          { label: 'Managen', top: '8px', right: '8px' },
          { label: 'Monitoren', bottom: '8px', left: '8px' },
          { label: 'Betrekken', bottom: '8px', right: '8px' },
        ].map(({ label, ...pos }) => (
          <div key={label} style={{
            position: 'absolute',
            ...pos,
            fontSize: 11,
            color: tokens.inkSubtle,
            fontFamily: tokens.mono,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {label}
          </div>
        ))}

        {/* Org nodes */}
        {orgs.map((org) => (
          <div
            key={org.id}
            onMouseDown={() => handleMouseDown(org.id)}
            style={{
              position: 'absolute',
              left: `calc(${org.positie_x * 100}% - 20px)`,
              top: `calc(${org.positie_y * 100}% - 20px)`,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: org.focus ? tokens.accent : tokens.surface,
              border: `2px solid ${org.focus ? tokens.accent : tokens.rule}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              boxShadow: draggingId === org.id ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.08)',
              zIndex: draggingId === org.id ? 10 : 1,
              transition: draggingId === org.id ? 'none' : 'box-shadow 0.15s',
            }}
            title={org.naam}
          >
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: org.focus ? tokens.surface : tokens.inkMuted,
              fontFamily: tokens.mono,
            }}>
              {org.naam.slice(0, 2).toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Y-as labels */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <div style={asLabel}>↑ Hoge overlap · Lage overlap ↓</div>
      </div>
    </div>
  )
}

// ── Vraag-templates ──────────────────────────────────────────────────────────

const VRAGEN = [
  {
    id: 'eigen-agenda',
    titel: 'Eigen agenda',
    vraag: 'Wat is jullie eigen agenda rond dit thema — in één zin?',
    toelichting: 'Laat de klant zelf formuleren, niet het vakjargon van de organisatie gebruiken.',
  },
  {
    id: 'verrassende-bondgenoot',
    titel: 'Verrassende bondgenoot',
    vraag: 'Welke organisatie zou jullie meest verrassende bondgenoot kunnen zijn?',
    toelichting: 'Vaak levert dit de Obsidian-laag op: gedeeld belang dat nog niet zichtbaar was.',
  },
  {
    id: 'zelfde-doel',
    titel: 'Zelfde doel, tegengestelde aanpak',
    vraag: 'Welke organisatie heeft hetzelfde doel maar een tegengestelde aanpak?',
    toelichting: 'Toont spanning in het ecosysteem — strategisch relevant voor positionering.',
  },
  {
    id: 'ontbrekende-speler',
    titel: 'Ontbrekende speler',
    vraag: 'Welke speler zit niet aan tafel maar zou er wel moeten zitten?',
    toelichting: 'Identificeert blinde vlekken in het veld.',
  },
  {
    id: 'top-of-mind',
    titel: 'Top-of-mind / footnote-of-mind',
    vraag: 'Voor welke organisatie is dit thema top-of-mind, en voor welke is het footnote-of-mind?',
    toelichting: 'Kalibreert de urgentie in het veld en bepaalt wie proactief te benaderen is.',
  },
]

function VraagTemplates({ thema }: { thema: string }) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{
        fontSize: 12,
        color: tokens.inkSubtle,
        fontFamily: tokens.mono,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        Thema
      </div>
      <div style={{
        fontFamily: tokens.serif,
        fontSize: 20,
        color: tokens.ink,
        marginBottom: 40,
        fontStyle: 'italic',
      }}>
        "{thema}"
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {VRAGEN.map((v, i) => (
          <div key={v.id} style={{
            background: tokens.surface,
            border: `1px solid ${tokens.rule}`,
            borderRadius: 8,
            padding: '24px 28px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 16,
              marginBottom: 12,
            }}>
              <span style={{
                fontSize: 11,
                color: tokens.inkSubtle,
                fontFamily: tokens.mono,
                minWidth: 20,
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{
                fontSize: 11,
                color: tokens.accent,
                fontFamily: tokens.mono,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {v.titel}
              </span>
            </div>
            <div style={{
              fontFamily: tokens.serif,
              fontSize: 18,
              color: tokens.ink,
              marginBottom: 12,
              lineHeight: 1.4,
            }}>
              {v.vraag}
            </div>
            <div style={{ fontSize: 13, color: tokens.inkMuted, lineHeight: 1.6 }}>
              {v.toelichting}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Hulpcomponenten ──────────────────────────────────────────────────────────

function Veld({
  label,
  badge,
  badgeKleur,
  children,
}: {
  label: string
  badge?: string
  badgeKleur?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <label style={{
          fontSize: 11,
          color: tokens.inkMuted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontFamily: tokens.mono,
        }}>
          {label}
        </label>
        {badge && (
          <span style={{
            fontSize: 9,
            color: badgeKleur,
            fontFamily: tokens.mono,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: badgeKleur + '18',
            padding: '2px 6px',
            borderRadius: 3,
          }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
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

const selectStijl: React.CSSProperties = {
  ...inputStijl,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23A39B92' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: 36,
}

const asLabel: React.CSSProperties = {
  fontSize: 11,
  color: tokens.inkSubtle,
  fontFamily: tokens.mono,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}
