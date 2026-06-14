'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { tokens } from '@/lib/tokens'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [verzonden, setVerzonden] = useState(false)
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState('')

  const supabase = createClient()

  async function verstuurMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFout('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setFout('Er ging iets mis. Controleer het e-mailadres.')
      setLaden(false)
      return
    }

    setVerzonden(true)
    setLaden(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: tokens.paper,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Merk */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <div style={{
            fontFamily: tokens.serif,
            fontSize: 22,
            fontWeight: 600,
            color: tokens.ink,
            letterSpacing: '-0.02em',
          }}>
            Stakeholder Veldgids
          </div>
        </div>

        {verzonden ? (
          <div style={{
            background: tokens.aiSoft,
            border: `1px solid ${tokens.aiAccent}22`,
            borderRadius: 8,
            padding: '24px 28px',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: tokens.serif,
              fontSize: 18,
              color: tokens.ink,
              marginBottom: 12,
            }}>
              Controleer je e-mail
            </div>
            <div style={{ color: tokens.inkMuted, fontSize: 14, lineHeight: 1.6 }}>
              We hebben een inloglink gestuurd naar <strong>{email}</strong>. Klik op de link in de e-mail om in te loggen.
            </div>
          </div>
        ) : (
          <form onSubmit={verstuurMagicLink}>
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                color: tokens.inkMuted,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: tokens.mono,
                marginBottom: 8,
              }}>
                E-mailadres
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jij@organisatie.nl"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${tokens.rule}`,
                  borderRadius: 6,
                  background: tokens.surface,
                  color: tokens.ink,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
              />
            </div>

            {fout && (
              <div style={{
                color: tokens.warn,
                fontSize: 13,
                marginBottom: 16,
                fontFamily: tokens.mono,
              }}>
                {fout}
              </div>
            )}

            <button
              type="submit"
              disabled={laden || !email}
              style={{
                width: '100%',
                padding: '13px 20px',
                background: laden || !email ? tokens.inkSubtle : tokens.accent,
                color: tokens.surface,
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.02em',
                transition: 'background 0.15s',
                cursor: laden || !email ? 'not-allowed' : 'pointer',
              }}
            >
              {laden ? 'Versturen…' : 'Inloglink versturen'}
            </button>

            <div style={{
              marginTop: 16,
              fontSize: 12,
              color: tokens.inkSubtle,
              textAlign: 'center',
              lineHeight: 1.6,
            }}>
              Je ontvangt een e-mail met een inloglink. Geen wachtwoord nodig.
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
