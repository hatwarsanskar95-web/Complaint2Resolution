import { NextResponse } from 'next/server'
import { getAppConfig } from '@/lib/config'

export async function GET() {
  const config = getAppConfig()

  const health = {
    status: config.supabase.isConfigured && config.gemini.isConfigured ? 'healthy' : 'configuration_pending',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    platform: config.app.name,
    environment: config.app.environment,
    checks: {
      supabaseConfigured: config.supabase.isConfigured,
      geminiConfigured: config.gemini.isConfigured,
      geminiModel: config.gemini.model,
    },
    serviceRoleConfigured: Boolean(config.supabase.serviceRoleKey && !config.supabase.serviceRoleKey.startsWith('your-')),
  }

  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
