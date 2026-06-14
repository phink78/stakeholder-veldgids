import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const { naam, thema } = await req.json()

  if (!naam || !thema) {
    return NextResponse.json({ error: 'naam en thema zijn verplicht' }, { status: 400 })
  }

  const prompt = `Je bent een expert in Nederlandse stakeholder-analyse en ecosysteem-mapping.

Analyseer de organisatie "${naam}" in de context van het thema: "${thema}".

Geef ALLEEN informatie die publiek beschikbaar is. Geen verzonnen feiten.

Beantwoord in JSON met precies deze structuur:
{
  "eigen_agenda": "<2-4 zinnen over de eigen agenda van deze organisatie rond dit thema — concreet, geen jargon>",
  "type": "<één van: NGO, Overheid, Bedrijf, Media, Academisch, Anders>",
  "suggesties": ["<org 1 die ook relevant is>", "<org 2>", "<org 3>"]
}

Regels:
- eigen_agenda: schrijf in de derde persoon ("${naam} richt zich op…"), actief Nederlands
- suggesties: maximaal 3 organisaties die ontbreken maar relevant zijn voor dit thema
- Als je een organisatie niet herkent, geef dan eigen_agenda: null terug
- Geen markdown, geen uitleg buiten de JSON`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const tekst = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extraheer JSON uit de response
    const match = tekst.match(/\{[\s\S]*\}/)
    if (!match) {
      return NextResponse.json({ error: 'Geen bruikbare output van AI' }, { status: 502 })
    }

    const data = JSON.parse(match[0])
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'AI-call mislukt' }, { status: 502 })
  }
}
