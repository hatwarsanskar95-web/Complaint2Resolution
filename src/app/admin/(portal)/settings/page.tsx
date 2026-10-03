import { getAdminContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  Settings,
  User,
  Bell,
  Lock,
  Cpu,
  Info,
  Mail,
} from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

export default async function AdminSettingsPage() {
  const adminCtx = await getAdminContext()
  if (!adminCtx) redirect('/admin/login')

  const adminName = adminCtx.profile?.full_name || 'Admin'
  const adminEmail = adminCtx.email || '—'
  const isSuperAdmin = adminCtx.isSuperAdmin
  const deptName = adminCtx.department?.name || (isSuperAdmin ? 'All Departments' : '—')

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <FadeIn direction="up">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            <Settings className="text-slate-400" size={24} /> System Settings
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Account configuration, system preferences, and platform information.
          </p>
        </div>
      </FadeIn>

      <StaggerContainer staggerChildren={0.07} className="flex flex-col gap-6">
        {/* Account Info */}
        <StaggerItem>
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/40">
              <User size={16} className="text-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Account Information
              </h2>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-4">
              <SettingField label="Full Name" value={adminName} />
              <SettingField label="Email Address" value={adminEmail} icon={<Mail size={13} />} />
              <SettingField
                label="Role"
                value={isSuperAdmin ? 'Super Admin (Central Authority)' : 'Department Admin'}
                badge={isSuperAdmin ? 'super' : 'dept'}
              />
              <SettingField
                label="Assigned Department"
                value={deptName}
              />
            </div>
          </div>
        </StaggerItem>

        {/* Security */}
        <StaggerItem>
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/40">
              <Lock size={16} className="text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Security
              </h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-white">Password</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Managed via Supabase Auth. Reset from the login screen.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-800/60 px-3 py-1 rounded-lg border border-slate-700">
                  ••••••••
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-white">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Handled at the authentication provider level.
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-400 bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-800/40">
                  Provider Managed
                </span>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Notifications */}
        <StaggerItem>
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/40">
              <Bell size={16} className="text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Notification Preferences
              </h2>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <ToggleRow label="Escalation Alerts" description="Notify when a complaint requires escalation" enabled />
              <ToggleRow label="SLA Breach Warnings" description="Alert when SLA deadline is approaching" enabled />
              <ToggleRow label="New Complaint Intake" description="Notify on every new complaint submission" enabled={false} />
              <ToggleRow label="Daily Digest Email" description="Receive a daily summary report" enabled={false} />
            </div>
          </div>
        </StaggerItem>

        {/* System Info */}
        <StaggerItem>
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/40">
              <Cpu size={16} className="text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Platform Information
              </h2>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-4">
              <SettingField label="Platform" value="Complaint2Resolution (C2R)" />
              <SettingField label="Version" value="v1.0.0 — Production" />
              <SettingField label="AI Engine" value="Google Gemini 1.5 Flash" />
              <SettingField label="Database" value="Supabase (PostgreSQL)" />
              <SettingField label="Framework" value="Next.js 15 (App Router)" />
              <SettingField label="Region" value="India (ap-south-1)" />
            </div>
          </div>
        </StaggerItem>

        {/* About */}
        <StaggerItem>
          <div className="glass-card rounded-2xl border border-blue-900/30 bg-blue-950/10 p-6 flex gap-4">
            <Info size={18} className="text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">About Complaint2Resolution</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                C2R is an AI-powered civic grievance redressal platform designed to
                streamline complaint submission, intelligent department routing, SLA
                tracking, and transparent resolution. Built for citizens, managed by
                government administrators, and powered by machine intelligence.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                People Speak. Problems Solve. · India 🇮🇳
              </p>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  )
}

function SettingField({
  label,
  value,
  icon,
  badge,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  badge?: 'super' | 'dept'
}) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="flex items-center gap-2 mt-0.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        <p className="text-sm font-semibold text-white truncate">{value}</p>
        {badge === 'super' && (
          <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40 ml-auto shrink-0">
            SUPER ADMIN
          </span>
        )}
        {badge === 'dept' && (
          <span className="text-[10px] font-bold text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/40 ml-auto shrink-0">
            DEPT ADMIN
          </span>
        )}
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  enabled,
}: {
  label: string
  description: string
  enabled: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <div
        className={`w-10 h-5 rounded-full relative transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-slate-700'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
            enabled ? 'left-5' : 'left-0.5'
          }`}
        />
      </div>
    </div>
  )
}
