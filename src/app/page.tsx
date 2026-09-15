'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Shield,
  Zap,
  Sparkles,
  Layers,
  Network,
  Hourglass,
  Camera,
  CheckCircle2,
  Building2,
  Lock,
  Compass,
  FileText,
  Brain,
  Wrench,
  CheckCheck,
  Check,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem, AnimatedNumber } from '@/components/ui/motion'

import Galaxy from '@/components/ui/Galaxy'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-[#f1f5f9] selection:bg-[hsl(220,90%,56%)] selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b14]/85 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo & Portal Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-transform hover:scale-105">
              <span className="font-extrabold text-white text-base" style={{ fontFamily: 'Outfit, sans-serif' }}>M</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Complaint2Resolution
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  PUBLIC
                </span>
              </div>
              <span className="text-[11px] text-slate-400 tracking-tight block mt-0.5">
                Civic Grievance &amp; Resolution Infrastructure
              </span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-full border border-slate-800/80 text-xs font-medium text-slate-300">
            <a href="#how-it-works" className="px-4 py-1.5 rounded-full hover:text-white hover:bg-slate-800/60 transition-all">
              How It Works
            </a>
            <a href="#features" className="px-4 py-1.5 rounded-full hover:text-white hover:bg-slate-800/60 transition-all">
              Features
            </a>
            <a href="#resolution-flow" className="px-4 py-1.5 rounded-full hover:text-white hover:bg-slate-800/60 transition-all">
              Resolution Flow
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Ambient background glow */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-blue-600/10 blur-[140px] pointer-events-none -z-10 rounded-full" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-indigo-600/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Content */}
          <FadeIn direction="up" distance={16} className="lg:col-span-7 flex flex-col items-start text-left gap-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 text-xs font-medium text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span>AI-POWERED CIVIC ACCOUNTABILITY</span>
            </div>

            {/* Title */}
            <h1
              className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.12] text-white"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Don&apos;t Just Register.
              <br />
              Drive <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Them to Resolution.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
              An AI-powered civic complaint management platform that helps citizens report issues and ensures complaints are routed, tracked, acted upon, and verified until genuine resolution.
            </p>

            {/* Resident Access Guarantee Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-medium">
              <Shield size={14} className="text-blue-400" />
              <span>Direct Resident Access · No staff credentials required</span>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 mt-2 border-t border-slate-800/80 w-full max-w-lg">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <AnimatedNumber value={140000} suffix="+" duration={1.2} />
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Citizens Connected</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  &lt; 36h
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Avg Triage Time</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <AnimatedNumber value={94} suffix=".8%" duration={1} />
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Verified Closure</div>
              </div>
            </div>
          </FadeIn>

          {/* Right Column: Interactive Live Stream Case Card */}
          <FadeIn direction="left" delay={0.15} distance={18} className="lg:col-span-5 relative">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden hover:border-slate-600/80 transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
              {/* Card Header */}
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-red-500 -ml-4" />
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">LIVE CASE STREAM</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-cyan-400">
                  CASE: #CR-88241
                </span>
              </div>

              {/* Image with overlay tags */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950 group">
                <Image
                  src="/images/hero_civic_stream.jpg"
                  alt="Civic Live Case Stream UI"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />

                {/* Overlaid Badges */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-slate-200 backdrop-blur-md">
                    <MapPin size={11} className="text-cyan-400" />
                    <span>GPS Geo-tag: 30.7333° N, 76.7794° E</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600/90 text-white font-semibold backdrop-blur-md">
                    <Clock size={11} />
                    <span>Reported</span>
                  </div>
                </div>
              </div>

              {/* Case Telemetry Details */}
              <div className="p-4 space-y-2.5 text-xs bg-slate-950/90">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Sparkles size={14} className="text-blue-400" />
                    <span className="font-medium">AI Severity Analysis</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                    High Priority: Pothole
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Building2 size={14} className="text-indigo-400" />
                    <span className="font-medium">Autonomous Dispatch</span>
                  </div>
                  <span className="font-mono text-slate-300 text-[11px]">
                    Dept: 01 Roads &amp; Works
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Hourglass size={14} className="text-cyan-400" />
                    <span className="font-medium">Municipal Resolution SLA</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-semibold text-[11px] bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                    22h · 44m · 12s
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Section 1: The 8-Stage Resolution Journey */}
      <section id="how-it-works" className="py-20 px-6 border-t border-slate-800/70 bg-[#060912]">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <FadeIn direction="up" className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[11px] font-bold tracking-widest uppercase text-blue-400">
              LIFECYCLE PROGRESSION
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              The 8-Stage Resolution Journey
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              From first tap to permanent closure, watch how municipal telemetry and dual-tier verification eliminate dropped cases forever.
            </p>
          </FadeIn>

          {/* 8 Stages Grid */}
          <StaggerContainer staggerChildren={0.06} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 01 */}
            <StaggerItem>
              <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400">01</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      Origin
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Compass size={12} />
                    </div>
                    <h3 className="font-bold text-sm text-white">Citizen</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Resident snaps an issue in seconds with automatic precision GPS coordinates and metadata integrity.
                  </p>
                </div>
              </div>
            </StaggerItem>

            {/* Card 02 */}
            <StaggerItem>
              <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400">02</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      Intake
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <FileText size={12} />
                    </div>
                    <h3 className="font-bold text-sm text-white">Complaint</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Cryptographically logged grievance packet generated with instant citizen tracking reference key.
                  </p>
                </div>
              </div>
            </StaggerItem>

            {/* Card 03 */}
            <StaggerItem>
              <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400">03</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      Analysis
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Brain size={12} />
                    </div>
                    <h3 className="font-bold text-sm text-white">AI Understanding</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Neural NLP maps sentiment, extracts hazard markers, flags duplicates, and assigns severity scores.
                  </p>
                </div>
              </div>
            </StaggerItem>

            {/* Card 04 */}
            <StaggerItem>
              <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400">04</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      Routing
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Building2 size={12} />
                    </div>
                    <h3 className="font-bold text-sm text-white">Right Department</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Zero-ping-pong tenancy; automatically dispatches to Roads, Water, Sanitation, or Electrical bureaus.
                  </p>
                </div>
              </div>
            </StaggerItem>

            {/* Card 05 */}
            <StaggerItem>
              <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400">05</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      Field Unit
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Wrench size={12} />
                    </div>
                    <h3 className="font-bold text-sm text-white">Action</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Municipal crew is mobilized with geo-fenced work-orders and real-time citizen status feed updates.
                  </p>
                </div>
              </div>
            </StaggerItem>

            {/* Card 06 */}
            <StaggerItem>
              <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400">06</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      Resolution
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Camera size={12} />
                    </div>
                    <h3 className="font-bold text-sm text-white">Evidence</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Mandatory timestamped post-repair photorecords and engineer telemetry uploaded from the scene.
                  </p>
                </div>
              </div>
            </StaggerItem>

            {/* Card 07 */}
            <StaggerItem>
              <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400">07</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      Dual-Check
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <CheckCheck size={12} />
                    </div>
                    <h3 className="font-bold text-sm text-white">Verification</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Vision models confirm physical repair completion while the resident gets final resolution sign-off.
                  </p>
                </div>
              </div>
            </StaggerItem>

            {/* Card 08 */}
            <StaggerItem>
              <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400">08</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Success
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Check size={12} />
                    </div>
                    <h3 className="font-bold text-sm text-white">Resolution</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Case immutably recorded into the public civic ledger; community impact score credited to user.
                  </p>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Section 2: Architected for Uncompromising Follow-Through */}
      <section id="features" className="py-20 px-6 border-t border-slate-800/70">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <FadeIn direction="up" className="mb-14 space-y-2">
            <span className="text-[11px] font-bold tracking-widest uppercase text-blue-400">
              SYSTEM GUARANTEES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Architected for Uncompromising Follow-Through
            </h2>
          </FadeIn>

          {/* 6 Feature Cards */}
          <StaggerContainer staggerChildren={0.07} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <StaggerItem>
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Brain size={20} />
                </div>
                <h3 className="font-bold text-base text-white">AI Complaint Understanding</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automated NLP categorization, real-time severity detection, duplicate issue grouping, and immediate priority scoring that flags urgent street hazards within seconds.
                </p>
              </div>
            </StaggerItem>

            {/* Feature 2 */}
            <StaggerItem>
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                  <Network size={20} />
                </div>
                <h3 className="font-bold text-base text-white">Smart Department Routing</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Precision algorithmic matching directly into Water, Works, Electrical, and Sanitation pipelines, eliminating departmental disputes and multi-week bureaucratic ping-pong.
                </p>
              </div>
            </StaggerItem>

            {/* Feature 3 */}
            <StaggerItem>
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                  <Hourglass size={20} />
                </div>
                <h3 className="font-bold text-base text-white">SLA Tracking &amp; Escalation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dynamic live countdowns, automated civic supervisory escalation protocols, and transparent response time commitments visible to every neighborhood resident.
                </p>
              </div>
            </StaggerItem>

            {/* Feature 4 */}
            <StaggerItem>
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                  <Camera size={20} />
                </div>
                <h3 className="font-bold text-base text-white">Evidence-Based Resolution</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mandates verifiable photographic proof, high-accuracy GPS timestamps, and officer on-site telemetry before any work-order can be moved to completed status.
                </p>
              </div>
            </StaggerItem>

            {/* Feature 5 */}
            <StaggerItem>
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="font-bold text-base text-white">AI + Citizen Verification</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dual validation requiring machine vision analysis of physical repair photos alongside community resident sign-off before official closure is stamped.
                </p>
              </div>
            </StaggerItem>

            {/* Feature 6 */}
            <StaggerItem>
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <h3 className="font-bold text-base text-white">Department Accountability</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Public performance metrics, historical resolution speeds, and unalterable audit trails ensuring public agencies stay accountable to the public they serve.
                </p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Section 3: Key Stats Bar */}
      <section className="py-14 px-6 border-y border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <AnimatedNumber value={140} suffix="K+" duration={1} />
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-1">Residents Empowered</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across 32 Metropolitan Wards</div>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                &lt; 36h
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-1">Average Triage Time</div>
              <div className="text-[11px] text-slate-400 mt-0.5">From report to department queue</div>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <AnimatedNumber value={94} suffix=".8%" duration={1} />
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-1">Resolution Success</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Citizen-verified closures</div>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                6
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-1">Municipal Divisions</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Synchronized in real-time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Ready to Transform Your Community CTA (With Galaxy Interactive WebGL Animation) */}
      <section id="resolution-flow" className="py-32 px-6 relative overflow-hidden text-center min-h-[580px] flex items-center justify-center border-t border-slate-800/80">
        {/* Galaxy WebGL Background Animation */}
        <div className="absolute inset-0 z-0">
          <Galaxy
            mouseRepulsion={true}
            mouseInteraction={true}
            density={1.5}
            glowIntensity={0.5}
            saturation={0.8}
            hueShift={240}
            speed={1.0}
            starSpeed={0.6}
            transparent={true}
          />
        </div>

        {/* Ambient subtle vignette overlay for text contrast */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#070b14]/40 to-[#070b14]/90 pointer-events-none z-0" />

        <FadeIn direction="up" className="max-w-4xl mx-auto flex flex-col items-center gap-7 sm:gap-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/40 bg-blue-950/80 backdrop-blur-md text-xs sm:text-sm font-semibold text-blue-300 shadow-xl tracking-wide">
            <Sparkles size={14} className="text-blue-400" />
            <span>INSTANT CIVIC IMPACT</span>
          </div>

          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] leading-[1.1]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Ready to Transform Your Community?
          </h2>

          <p className="text-slate-100 text-lg sm:text-xl md:text-2xl max-w-2xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] font-normal">
            Report issues in under 60 seconds and hold municipal services accountable through transparent, verified resolutions.
          </p>

          {/* THE ONLY Get Started Button */}
          <Link
            href="/login"
            id="homepage-get-started-btn"
            className="px-10 py-4 sm:py-4.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base sm:text-lg shadow-[0_0_40px_rgba(37,99,235,0.7)] hover:shadow-[0_0_60px_rgba(37,99,235,0.9)] transition-all duration-200 hover:-translate-y-1 active:translate-y-0.5 active:scale-[0.98] flex items-center gap-3 mt-3 cursor-pointer z-20"
          >
            <span>Get Started</span>
            <ArrowRight size={20} />
          </Link>

          <span className="text-sm sm:text-base text-slate-300 font-medium drop-shadow-sm">
            Open for all residents · 100% free municipal service
          </span>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050810] pt-14 pb-8 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800/70">
          {/* Column 1: Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                M
              </div>
              <span className="font-bold text-sm text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Complaint2Resolution
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Official municipal Civic Gateway providing transparent, immutable tracking and resolution oversight for community grievances and infrastructure accountability.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                CIVIC UTILITY
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                ENCRYPTED END-TO-END
              </span>
            </div>
          </div>

          {/* Column 2: Public Infrastructure */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Public Infrastructure</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Civic Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Lifecycle Progression</a></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">GIS Telemetry &amp; Heatmaps</span></li>
            </ul>
          </div>

          {/* Column 3: Governance & Compliance */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Governance &amp; Compliance</h4>
            <ul className="space-y-2 text-slate-400">
              <li><span className="hover:text-white transition-colors cursor-pointer">Accessibility Standards (WCAG 2.1 AA)</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy &amp; Data Rights</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Civic Disclaimers</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">256-bit TLS Cryptographic Arch</span></li>
            </ul>
          </div>

          {/* Column 4: Citizen Assistance */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Citizen Assistance</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Municipal Support Desk available 24/7 for civic intake assistance and emergency routing.
            </p>
            <div className="space-y-1 text-slate-300 text-xs pt-1">
              <div>Toll-Free Civic Line: <span className="font-mono text-white">(800) 555-0199</span></div>
              <div className="text-slate-400">support@complaint2resolution.gov</div>
              <div className="text-rose-400/90 font-medium pt-1">Disaster / Immediate Threats: Dial 112</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 Municipal Civic Technology Directorate. Complaint2Resolution is a certified civic public service utility. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Lock size={11} className="text-emerald-400" />
              256-Bit TLS Compliant
            </span>
            <span className="flex items-center gap-1">
              <Shield size={11} className="text-blue-400" />
              Municipal Gateway Secure
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
