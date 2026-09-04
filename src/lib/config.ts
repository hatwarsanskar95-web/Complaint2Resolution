// Centralized Environment & System Configuration

export interface AppConfig {
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
    isConfigured: boolean
  }
  gemini: {
    apiKey?: string
    model: string
    isConfigured: boolean
  }
  app: {
    name: string
    tagline: string
    environment: 'development' | 'production' | 'test'
  }
}

export function getAppConfig(): AppConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const geminiApiKey = process.env.GEMINI_API_KEY || ''

  const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    !supabaseUrl.includes('your-supabase-project-url') &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
  )

  const isGeminiConfigured = Boolean(
    geminiApiKey && !geminiApiKey.includes('your-gemini-api-key')
  )

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: supabaseServiceRoleKey,
      isConfigured: isSupabaseConfigured,
    },
    gemini: {
      apiKey: geminiApiKey,
      model: 'gemini-2.0-flash',
      isConfigured: isGeminiConfigured,
    },
    app: {
      name: 'Complaint2Resolution',
      tagline: "Don't Just Register Complaints. Drive Them to Verified Resolution.",
      environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    },
  }
}

export function assertServerEnv(keys: Array<'GEMINI_API_KEY' | 'SUPABASE_SERVICE_ROLE_KEY' | 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'>) {
  const missing: string[] = []
  for (const key of keys) {
    const val = process.env[key]
    if (!val || val.startsWith('your-')) {
      missing.push(key)
    }
  }
  if (missing.length > 0) {
    console.warn(`[Config Warning] Missing or unconfigured environment variables: ${missing.join(', ')}`)
  }
  return missing.length === 0
}
