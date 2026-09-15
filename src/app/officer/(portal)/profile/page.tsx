import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Shield, Building2, Mail, Lock } from 'lucide-react'
import { FadeIn } from '@/components/ui/motion'

export default async function OfficerProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/officer/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <FadeIn direction="up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <User className="text-emerald-400" size={24} /> Officer Profile & Account
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Authorized field officer credential context and department binding.
          </p>
        </div>
      </FadeIn>

      <div className="p-6 rounded-2xl bg-[#09120d] border border-slate-800 flex flex-col gap-5 text-xs text-slate-300">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-600/90 text-white font-extrabold text-xl flex items-center justify-center shadow-lg">
            {(profile?.full_name || user.email || 'O').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{profile?.full_name || 'Rajesh Kumar'}</h2>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">Field Operations Officer</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-[#060c09] border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5"><Mail size={14} className="text-emerald-400" /> Email</span>
            <p className="font-semibold text-white text-sm mt-1">{user.email}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#060c09] border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5"><Building2 size={14} className="text-emerald-400" /> Department</span>
            <p className="font-semibold text-white text-sm mt-1">Water Management</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#060c09] border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5"><Shield size={14} className="text-emerald-400" /> Role</span>
            <p className="font-semibold text-white text-sm mt-1">Officer</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#060c09] border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5"><Lock size={14} className="text-emerald-400" /> RLS Enforcement</span>
            <p className="font-semibold text-emerald-400 text-sm mt-1">Active Department Sandbox</p>
          </div>
        </div>
      </div>
    </div>
  )
}
