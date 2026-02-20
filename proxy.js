import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/fetch', async (req, res) => {
  const url = req.query.url
  if (!url) return res.status(400).json({ error: 'missing url' })

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.yad2.co.il/',
      },
    })

    const text = await response.text()
    res.json({ contents: text, status: response.status })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api', async (req, res) => {
  const url = req.query.url
  if (!url) return res.status(400).json({ error: 'missing url' })

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'he-IL,he;q=0.9',
        'Referer': 'https://www.yad2.co.il/',
        'Origin': 'https://www.yad2.co.il',
      },
    })

    const text = await response.text()
    res.json({ contents: text, status: response.status })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Image extraction via Claude Vision API ────────────────────────────────

app.post('/extract-from-image', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'חסר ANTHROPIC_API_KEY — הגדר משתנה סביבה לפני הפעלת הפרוקסי',
    })
  }

  const { image } = req.body
  if (!image) {
    return res.status(400).json({ error: 'חסרה תמונה' })
  }

  // Strip data URL prefix if present
  const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/)
  const mediaType = base64Match ? `image/${base64Match[1]}` : 'image/jpeg'
  const base64Data = base64Match ? base64Match[2] : image

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: `You are analyzing an image of a car listing (likely from an Israeli car website like Yad2).
Extract all car details you can find and return ONLY a valid JSON object with these fields (use null for missing values):

{
  "title": "string or null - the listing title",
  "make": "string or null - car manufacturer (e.g. Toyota, Hyundai)",
  "model": "string or null - car model (e.g. Corolla, i30)",
  "year": "number or null - manufacture year",
  "price": "number or null - price in ILS (just the number, no currency symbols)",
  "km": "number or null - kilometers driven",
  "hand": "number or null - ownership number (יד)",
  "color": "string or null - car color",
  "city": "string or null - city/location",
  "engineSize": "string or null - engine volume/cc",
  "fuelType": "string or null - fuel type",
  "gearType": "string or null - transmission type"
}

Important: Return ONLY the JSON, no markdown, no explanation. Use Hebrew for string values where appropriate.`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Claude API error:', response.status, errBody)
      return res.status(500).json({
        error: `שגיאה מ-Claude API: ${response.status}`,
      })
    }

    const result = await response.json()
    const text = result.content?.[0]?.text || '{}'

    // Parse the JSON from Claude's response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'לא ניתן לקרוא תוצאות מהתמונה' })
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Clean up: remove nulls and convert types
    const cleaned = {}
    if (parsed.title) cleaned.title = parsed.title
    if (parsed.make) cleaned.make = parsed.make
    if (parsed.model) cleaned.model = parsed.model
    if (parsed.year) cleaned.year = Number(parsed.year)
    if (parsed.price) cleaned.price = Number(String(parsed.price).replace(/[^0-9]/g, ''))
    if (parsed.km) cleaned.km = Number(String(parsed.km).replace(/[^0-9]/g, ''))
    if (parsed.hand) cleaned.hand = Number(parsed.hand)
    if (parsed.color) cleaned.color = parsed.color
    if (parsed.city) cleaned.city = parsed.city
    if (parsed.engineSize) cleaned.engineSize = String(parsed.engineSize)
    if (parsed.fuelType) cleaned.fuelType = parsed.fuelType
    if (parsed.gearType) cleaned.gearType = parsed.gearType

    res.json(cleaned)
  } catch (err) {
    console.error('Image extraction error:', err)
    res.status(500).json({ error: err.message || 'שגיאה בעיבוד התמונה' })
  }
})

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`)
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('Note: ANTHROPIC_API_KEY not set — image extraction will not work')
    console.log('Run: ANTHROPIC_API_KEY=your_key npm run proxy')
  }
})
