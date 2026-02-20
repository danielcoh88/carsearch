import { Car } from './types'

// Local proxy (proxy.js) takes priority — falls back to allorigins if not running
const LOCAL_PROXY = 'http://localhost:3001'
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
]

async function proxyFetch(url: string, signal: AbortSignal, isApi = false): Promise<string> {
  const endpoint = isApi ? `${LOCAL_PROXY}/api` : `${LOCAL_PROXY}/fetch`

  // Try local proxy first
  try {
    const res = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`, { signal })
    if (res.ok) {
      const json = await res.json()
      if (json.contents) return json.contents
    }
  } catch {
    // Local proxy not running — fall back to CORS proxies
  }

  // Fallback to public CORS proxies
  for (const buildUrl of CORS_PROXIES) {
    try {
      const res = await fetch(buildUrl(url), { signal })
      if (!res.ok) continue
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('json')) {
        const json = await res.json()
        if (json.contents) return json.contents
      } else {
        const text = await res.text()
        if (text) return text
      }
    } catch {
      continue
    }
  }

  throw new Error('לא ניתן לגשת לדף — בדוק שהפרוקסי פועל (npm run proxy)')
}

export interface ScrapedCarData {
  title?: string
  make?: string
  model?: string
  year?: number
  price?: number
  km?: number
  hand?: number
  color?: string
  city?: string
  engineSize?: string
  fuelType?: string
  gearType?: string
  imageUrl?: string
}

export function detectSource(url: string): Car['source'] {
  if (url.includes('yad2.co.il')) return 'yad2'
  if (url.includes('win.co.il')) return 'winwin'
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook'
  return 'other'
}

// ─── Yad2 direct API ─────────────────────────────────────────────────────────

function extractYad2ItemId(url: string): string | null {
  // https://www.yad2.co.il/item/ab1cd2ef  →  "ab1cd2ef"
  // https://www.yad2.co.il/vehicles/item/ab1cd2ef
  // https://www.yad2.co.il/realestate/item/ab1cd2ef
  const match = url.match(/yad2\.co\.il\/(?:vehicles\/|realestate\/)?item\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

async function fetchFromYad2Api(itemId: string, signal: AbortSignal): Promise<ScrapedCarData> {
  // Try multiple Yad2 API endpoint patterns
  const apiUrls = [
    `https://gw.yad2.co.il/item/feed/item?itemId=${itemId}`,
    `https://gw.yad2.co.il/feed-search/item/${itemId}`,
    `https://www.yad2.co.il/api/item/${itemId}`,
  ]

  let text = ''
  for (const apiUrl of apiUrls) {
    try {
      text = await proxyFetch(apiUrl, signal, true)
      if (text) break
    } catch {
      continue
    }
  }
  if (!text) throw new Error('תשובה ריקה מהשרת')

  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('התקבל תוכן לא תקין מהשרת')
  }

  // The API wraps data in json.data or json.item
  const item = json?.data?.item || json?.item || json?.data || {}
  const vehicle = item?.vehicle || item?.vehicles?.[0] || item

  const price =
    item?.price?.price ||
    item?.price ||
    vehicle?.price ||
    json?.data?.price?.price

  const images: string[] = []
  const rawImages = item?.images || vehicle?.images || item?.media?.images || []
  if (Array.isArray(rawImages)) {
    for (const img of rawImages) {
      const src = typeof img === 'string' ? img : img?.src || img?.url || img?.cdnUrl
      if (src) images.push(src)
    }
  }

  const result: ScrapedCarData = {}
  if (item.title || vehicle.title) result.title = item.title || vehicle.title
  if (price) result.price = Number(String(price).replace(/[^0-9]/g, ''))
  if (vehicle.km || item.km) result.km = Number(String(vehicle.km || item.km).replace(/[^0-9]/g, ''))
  if (vehicle.hand || item.hand) result.hand = Number(String(vehicle.hand || item.hand).replace(/[^0-9]/g, ''))
  if (vehicle.year || item.year) result.year = Number(String(vehicle.year || item.year).replace(/[^0-9]/g, ''))
  if (vehicle.manufacturer || item.manufacturer) result.make = vehicle.manufacturer || item.manufacturer
  if (vehicle.model || item.model) result.model = vehicle.model || item.model
  if (vehicle.color || item.color) result.color = vehicle.color || item.color
  if (item.city || item.address?.city) result.city = item.city || item.address?.city
  if (vehicle.engineVolume || vehicle.engine_capacity) result.engineSize = String(vehicle.engineVolume || vehicle.engine_capacity)
  if (vehicle.fuelType || vehicle.fuel_type) result.fuelType = vehicle.fuelType || vehicle.fuel_type
  if (vehicle.gearType || vehicle.gear_type) result.gearType = vehicle.gearType || vehicle.gear_type
  if (images[0]) result.imageUrl = images[0]

  return result
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function fetchCarDetails(url: string): Promise<ScrapedCarData> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    // Try Yad2 direct API first (most reliable for yad2.co.il)
    if (url.includes('yad2.co.il')) {
      const itemId = extractYad2ItemId(url)
      if (itemId) {
        try {
          const data = await fetchFromYad2Api(itemId, controller.signal)
          // If we got at least a price or km, consider it a success
          if (data.price || data.km || data.year || data.make) {
            return data
          }
        } catch {
          // Fall through to generic scraping
        }
      }
    }

    // Generic: fetch HTML via proxy and parse
    const html = await proxyFetch(url, controller.signal, false)

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Merge in priority order: OG tags (lowest) → JSON-LD → Next.js data (highest)
    const result: ScrapedCarData = {
      ...extractFromOGTags(doc),
      ...extractFromJsonLd(doc),
      ...extractFromNextData(doc),
    }

    return result
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('הבקשה ארכה יותר מדי זמן. נסה שוב.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

// ─── OG Tags ──────────────────────────────────────────────────────────────────

function extractFromOGTags(doc: Document): Partial<ScrapedCarData> {
  const getMeta = (prop: string) =>
    doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
    doc.querySelector(`meta[name="${prop}"]`)?.getAttribute('content') ||
    ''

  const title = getMeta('og:title') || getMeta('twitter:title') || doc.title || ''
  const description = getMeta('og:description') || getMeta('description') || ''
  const imageUrl = getMeta('og:image') || getMeta('twitter:image') || ''

  const combined = title + ' ' + description

  return {
    title: title || undefined,
    imageUrl: imageUrl || undefined,
    year: extractYearFromText(combined),
    price: extractPriceFromText(combined),
    km: extractKmFromText(combined),
    hand: extractHandFromText(combined),
    city: extractCityFromText(combined),
  }
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function extractFromJsonLd(doc: Document): Partial<ScrapedCarData> {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]')

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '')
      const type = data['@type']
      if (type === 'Vehicle' || type === 'Car' || type === 'Product') {
        const price =
          data.offers?.price ||
          data.offers?.lowPrice ||
          data.price

        return {
          title: data.name || undefined,
          price: price ? Number(price) : undefined,
          imageUrl: Array.isArray(data.image)
            ? data.image[0]
            : data.image || undefined,
          make: data.brand?.name || data.manufacturer || undefined,
          model: data.model || undefined,
          color: data.color || undefined,
          year: data.vehicleModelDate
            ? parseInt(data.vehicleModelDate)
            : undefined,
          km: data.mileageFromOdometer?.value
            ? parseInt(data.mileageFromOdometer.value)
            : undefined,
          engineSize: data.engineDisplacement || undefined,
          fuelType: data.fuelType || undefined,
          gearType: data.vehicleTransmission || undefined,
        }
      }
    } catch {
      continue
    }
  }
  return {}
}

// ─── Next.js __NEXT_DATA__ ────────────────────────────────────────────────────

function extractFromNextData(doc: Document): Partial<ScrapedCarData> {
  const script = doc.querySelector('#__NEXT_DATA__')
  if (!script?.textContent) return {}

  try {
    const data = JSON.parse(script.textContent)
    const props = data?.props?.pageProps

    // Try various paths Yad2 might use
    const item =
      props?.item ||
      props?.listing ||
      props?.vehicle ||
      props?.ad ||
      props?.car ||
      {}

    // Yad2 nested structure
    const additionalDetails = item?.additionalDetails || {}
    const params = item?.params || []

    // Helper to find param by key
    const findParam = (key: string) => {
      const p = params.find(
        (x: { key?: string; label?: string }) =>
          x.key === key || x.label?.includes(key)
      )
      return p?.value
    }

    const price =
      item.price ||
      item.currentPrice ||
      props?.price ||
      additionalDetails?.price

    const km =
      item.km ||
      item.kilometers ||
      additionalDetails?.km ||
      findParam('km') ||
      findParam('קילומטראז')

    const hand =
      item.hand ||
      item.ownership ||
      additionalDetails?.hand ||
      findParam('hand') ||
      findParam('יד')

    const year =
      item.year ||
      item.manufacture_year ||
      item.manufactureYear ||
      additionalDetails?.year ||
      findParam('year') ||
      findParam('שנה')

    // Images
    const images = item.images || item.photos || []
    const imageUrl =
      item.mainImageUrl ||
      item.main_image ||
      (Array.isArray(images) && images.length > 0
        ? images[0]?.src || images[0]?.url || images[0]
        : undefined)

    const result: Partial<ScrapedCarData> = {}

    if (item.title || item.header) result.title = item.title || item.header
    if (price) result.price = Number(String(price).replace(/[^0-9]/g, ''))
    if (km) result.km = Number(String(km).replace(/[^0-9]/g, ''))
    if (hand) result.hand = Number(String(hand).replace(/[^0-9]/g, ''))
    if (year) result.year = Number(String(year).replace(/[^0-9]/g, ''))
    if (item.manufacturer || item.make || item.brand)
      result.make = item.manufacturer || item.make || item.brand
    if (item.model) result.model = item.model
    if (item.color) result.color = item.color
    if (item.city || item.area) result.city = item.city || item.area
    if (item.engine_capacity || item.engineSize)
      result.engineSize = item.engine_capacity || item.engineSize
    if (item.fuel_type || item.fuelType)
      result.fuelType = item.fuel_type || item.fuelType
    if (item.gear_type || item.gearType || item.transmission)
      result.gearType = item.gear_type || item.gearType || item.transmission
    if (imageUrl) result.imageUrl = String(imageUrl)

    return result
  } catch {
    return {}
  }
}

// ─── Hebrew Text Parsers ──────────────────────────────────────────────────────

function extractYearFromText(text: string): number | undefined {
  const match = text.match(/\b(19[89]\d|20[012]\d)\b/)
  return match ? parseInt(match[1]) : undefined
}

function extractPriceFromText(text: string): number | undefined {
  // "78,500 ₪" or "₪78,500" or "78500 ש״ח"
  const patterns = [
    /([\d,]+)\s*₪/,
    /₪\s*([\d,]+)/,
    /([\d,]+)\s*ש[״"]ח/,
    /([\d,]+)\s*שקל/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const num = parseInt(match[1].replace(/,/g, ''))
      if (num > 1000) return num // avoid matching small numbers
    }
  }
  return undefined
}

function extractKmFromText(text: string): number | undefined {
  // "85,000 ק"מ" or "85000 קמ"
  const patterns = [/([\d,]+)\s*ק[״"']מ/, /([\d,]+)\s*קמ\b/]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return parseInt(match[1].replace(/,/g, ''))
  }
  return undefined
}

function extractHandFromText(text: string): number | undefined {
  const digitMatch = text.match(/יד\s*(\d+)/)
  if (digitMatch) return parseInt(digitMatch[1])
  if (text.includes('יד ראשונה') || text.includes('יד1')) return 1
  if (text.includes('יד שנייה') || text.includes('יד2')) return 2
  if (text.includes('יד שלישית') || text.includes('יד3')) return 3
  return undefined
}

function extractCityFromText(text: string): string | undefined {
  // Common Israeli cities
  const cities = [
    'תל אביב',
    'ירושלים',
    'חיפה',
    'ראשון לציון',
    'פתח תקווה',
    'אשדוד',
    'נתניה',
    'באר שבע',
    'חולון',
    'בני ברק',
    'רמת גן',
    'בת ים',
    'רחובות',
    'אשקלון',
    'רמלה',
    'הרצליה',
    'כפר סבא',
    'מודיעין',
    'לוד',
    'נס ציונה',
    'עפולה',
    'טבריה',
    'נצרת',
    'אילת',
  ]
  for (const city of cities) {
    if (text.includes(city)) return city
  }
  return undefined
}

// ─── Image-based extraction (via Claude Vision API) ─────────────────────────

export async function fetchCarDetailsFromImage(base64Data: string): Promise<ScrapedCarData> {
  const res = await fetch(`${LOCAL_PROXY}/extract-from-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Data }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'שגיאה בחיבור לשרת — ודא שהפרוקסי פועל ושהוגדר ANTHROPIC_API_KEY')
  }

  const data = await res.json()
  return data as ScrapedCarData
}
