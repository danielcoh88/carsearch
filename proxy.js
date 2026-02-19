import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())

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

app.listen(PORT, () => {
  console.log(`✅ Proxy server running on http://localhost:${PORT}`)
})
