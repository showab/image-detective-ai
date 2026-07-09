import OpenAI from 'openai'

const apiKey = import.meta.env.VITE_OPENAI_API_KEY

export const hasApiKey = !!(apiKey && apiKey.startsWith('sk-'))

export const openai = hasApiKey
  ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  : null

const SYSTEM_PROMPT = `You are an expert visual detective. Identify what's in the given image.

Classify its type as ONE of: "movie", "song", "website", "person", "product", "place", "other", "unknown".

Return ONLY a JSON object (no markdown fences, no prose) with this exact shape:
{
  "type": "movie|song|website|person|product|place|other|unknown",
  "title": "Short name",
  "description": "1-2 sentence description",
  "details": [
    { "label": "Year", "value": "2010" },
    { "label": "Director", "value": "Christopher Nolan" }
  ],
  "sources": [
    { "name": "IMDB", "url": "https://www.imdb.com/title/tt1375666/" },
    { "name": "Netflix", "url": "https://www.netflix.com/title/70131314" }
  ],
  "confidence": "high|medium|low",
  "reasoning": "One short line about the visual clues you used."
}

Rules:
- Give 2-4 real, useful, working links in sources (streaming platforms for movies/shows, Spotify/YouTube for songs, official URL for websites, IMDB/Wikipedia).
- Include rich details (year, artist/director/creator, genre, platform, etc.) as label/value pairs.
- If you truly can't identify, return type="unknown", best-effort description, empty details/sources arrays, confidence="low".
- No text outside the JSON.`

export async function analyzeImage(dataUrl) {
  if (!openai) throw new Error('OpenAI API key not configured. Add VITE_OPENAI_API_KEY to your .env file.')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Identify what is shown in this image and return the JSON.' },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ],
    max_tokens: 800,
    temperature: 0.2,
    response_format: { type: 'json_object' }
  })

  const raw = response.choices[0]?.message?.content || ''
  try {
    return JSON.parse(raw)
  } catch {
    const first = raw.indexOf('{')
    const last = raw.lastIndexOf('}')
    if (first !== -1 && last > first) {
      try { return JSON.parse(raw.substring(first, last + 1)) } catch {}
    }
    return { type: 'unknown', title: 'Could not parse', description: raw, details: [], sources: [], confidence: 'low' }
  }
}
