import { buildPrompt } from './prompts'
import usePrefsStore from '../store/usePrefsStore'
import { showToast } from '../components/Toast/ToastContainer'

const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
]

async function callGemini(apiKey, model, systemPrompt, userText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userText }] }],
    }),
  })
  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${errBody.slice(0, 120)}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

async function callGeminiWithCascade(apiKey, systemPrompt, userText) {
  let lastError = null
  for (const model of GEMINI_MODELS) {
    try {
      const result = await callGemini(apiKey, model, systemPrompt, userText)
      console.log(`[AI Rewriter] Used model: ${model}`)
      return result
    } catch (e) {
      lastError = e
      const msg = e.message?.toLowerCase() || ''
      if (msg.includes('429') || msg.includes('quota') || msg.includes('rate') || msg.includes('resource_exhausted')) {
        console.warn(`[AI Rewriter] ${model} rate-limited, cascading...`)
        continue
      }
      throw e
    }
  }
  throw lastError
}

export async function rewriteText(styleId, text) {
  const apiKey = usePrefsStore.getState().geminiApiKey
  if (!apiKey) {
    showToast('Set your Gemini API key in Settings first', 'error')
    return null
  }
  if (!text?.trim()) {
    showToast('Select some text first', 'error')
    return null
  }

  const { system, user } = buildPrompt(styleId, text)
  return callGeminiWithCascade(apiKey, system, user)
}
