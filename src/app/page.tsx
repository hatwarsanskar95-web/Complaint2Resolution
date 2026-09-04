import Link from 'next/link'
import { ArrowRight, Shield, Zap, BarChart3, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-[var(--bg-border)]">
        <div className="flex items-center gap-2">
          <Shield className="text-[var(--brand-primary)]" size={22} />
          <span className="font-bold text-lg tracking-tight">Complaint2Resolution</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">
            Citizen Login
          </Link>
          <Link href="/officer/login" className="btn-ghost text-sm px-4 py-2">
            Officer Login
          </Link>
          <Link href="/admin/login" className="btn-primary text-sm px-4 py-2">
            Admin Portal
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--bg-surface)] text-sm text-[var(--text-secondary)]">
          <Zap size={13} className="text-[var(--brand-primary)]" />
          Smart India Hackathon 2026
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight max-w-4xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Don&apos;t Just Register
          <br />
          <span className="gradient-text">Drive Them to Resolution</span>
        </h1>

        <p className="text-[var(--text-secondary)] text-lg max-w-xl leading-relaxed">
          AI-powered civic accountability platform with verified resolution, SLA tracking, and photographic evidence — built for Smart India Hackathon 2026.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary gap-2 px-6 py-3 text-base">
            File a Complaint <ArrowRight size={16} />
          </Link>
          <Link href="/login" className="btn-ghost px-6 py-3 text-base">
            Track My Complaint
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {[
            { icon: <Zap size={14} />, label: 'Gemini AI Analysis' },
            { icon: <BarChart3 size={14} />, label: 'SLA Tracking' },
            { icon: <CheckCircle2 size={14} />, label: 'Photo Verification' },
            { icon: <Shield size={14} />, label: 'Escalation Chain' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--bg-border)] text-xs text-[var(--text-secondary)]">
              <span className="text-[var(--brand-primary)]">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-[var(--text-muted)] text-xs border-t border-[var(--bg-border)]">
        Complaint2Resolution · Smart India Hackathon 2026
      </footer>
    </main>
  )
}
