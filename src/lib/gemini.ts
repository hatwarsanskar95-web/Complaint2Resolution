import { GoogleGenAI } from '@google/genai'

let geminiClientInstance: GoogleGenAI | null = null

export function getGeminiClient(): GoogleGenAI {
  if (typeof window !== 'undefined') {
    throw new Error('CRITICAL SECURITY VIOLATION: getGeminiClient() called on client-side.')
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.startsWith('your-')) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.')
  }

  if (!geminiClientInstance) {
    geminiClientInstance = new GoogleGenAI({ apiKey })
  }

  return geminiClientInstance
}

export const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash'
