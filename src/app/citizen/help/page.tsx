'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle,
  Plus,
  Minus,
  MessageSquare,
  Search,
  Sparkles,
  Shield,
  MapPin,
  Camera,
  CheckCircle2,
  FileText
} from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Reporting',
    question: 'How do I report a complaint?',
    answer: 'Click Report an Issue, upload photos, confirm the issue location on the map, describe the problem, and submit your complaint.'
  },
  {
    id: 'faq-2',
    category: 'Categories',
    question: 'What kind of issues can I report?',
    answer: 'You can report civic issues such as water problems, damaged roads, electrical issues, sanitation problems, drainage issues, and park/public-area problems.'
  },
  {
    id: 'faq-3',
    category: 'AI Routing',
    question: 'Do I need to select a department?',
    answer: 'No. AI understands your complaint and automatically routes it to the appropriate department.'
  },
  {
    id: 'faq-4',
    category: 'Evidence',
    question: 'Why do I need to upload photos?',
    answer: 'Photos provide visual evidence of the issue and help the system and concerned department understand the problem better.'
  },
  {
    id: 'faq-5',
    category: 'Evidence',
    question: 'How many photos should I upload?',
    answer: 'Upload at least 3 photos and up to 5 photos to clearly show the issue and its surroundings.'
  },
  {
    id: 'faq-6',
    category: 'Location',
    question: 'Why does the app need my location?',
    answer: 'Location helps identify exactly where the civic issue exists and helps route the complaint correctly.'
  },
  {
    id: 'faq-7',
    category: 'Location',
    question: 'Can I change the detected location?',
    answer: 'Yes. The app detects your current location automatically, but you can move the map pin and select the actual location of the issue.'
  },
  {
    id: 'faq-8',
    category: 'Tracking',
    question: 'How can I track my complaint?',
    answer: 'Open My Complaints to see your complaint status, timeline, department, SLA progress, and resolution updates.'
  },
  {
    id: 'faq-9',
    category: 'Verification',
    question: 'How will I know my complaint is resolved?',
    answer: "You will see the officer's action, resolution details, and before/after evidence in Resolution Verification."
  },
  {
    id: 'faq-10',
    category: 'Verification',
    question: 'What if the issue is not fixed?',
    answer: 'Select No — Issue Still Exists, upload a current photo, and submit it. The complaint can then go through the dispute and reopen workflow.'
  },
  {
    id: 'faq-11',
    category: 'SLA & Timing',
    question: 'How long does a complaint take to resolve?',
    answer: 'Resolution time depends on the complaint priority and applicable SLA; you can track progress from My Complaints.'
  },
  {
    id: 'faq-12',
    category: 'Privacy',
    question: 'Is my personal information safe?',
    answer: "Your complaint and personal information are protected by the application's authentication and access-control system."
  },
  {
    id: 'faq-13',
    category: 'Location',
    question: 'Can I report an issue at a different location?',
    answer: 'Yes. The detected location is only a starting point; during reporting you can adjust the map pin to the actual location of the issue.'
  },
  {
    id: 'faq-14',
    category: 'Privacy',
    question: 'Who can see my complaint?',
    answer: 'Your complaint is available to you and the authorized department/officers responsible for handling it.'
  }
]

export default function CitizenHelpPage() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  function toggleFaq(id: string) {
    setOpenFaqId((prev) => (prev === id ? null : id))
  }

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#14532d] via-[#166534] to-[#042f2e] text-white p-7 sm:p-9 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
            <HelpCircle size={14} />
            <span>Citizen Knowledge Base</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Help &amp; Frequently Asked Questions
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
            Find immediate answers on how to file grievances, calibrate location pins, track municipal SLA deadlines, and verify field resolutions.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative z-10 mt-6 max-w-md">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3.5 text-emerald-300/70 pointer-events-none" />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-emerald-200/60 text-xs outline-none focus:bg-white/20 focus:border-white/40 transition-all backdrop-blur-md"
            />
          </div>
        </div>

        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <Sparkles size={240} />
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white border border-[#e2e8f0] p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#15803d] flex items-center justify-center shrink-0">
            <Camera size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0f172a]">3–5 Photo Proofs</div>
            <div className="text-[11px] text-[#64748b]">Upload clear evidence</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#e2e8f0] p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0f172a]">Interactive Geotag</div>
            <div className="text-[11px] text-[#64748b]">Adjust pin to exact issue</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#e2e8f0] p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Shield size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0f172a]">AI Smart Routing</div>
            <div className="text-[11px] text-[#64748b]">Automatic department triage</div>
          </div>
        </div>
      </div>

      {/* Accordion FAQ Section */}
      <div className="rounded-3xl bg-white border border-[#e2e8f0] p-6 sm:p-8 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4 mb-2">
          <div>
            <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Click any question to view its detailed solution.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f1f5f9] text-[#475569]">
            {filteredFaqs.length} Questions
          </span>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="text-center py-10 text-[#64748b] text-xs">
            No questions matching &quot;{searchQuery}&quot;. Please try a different search term.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-[#15803d]/40 bg-[#f0fdf4]/50 shadow-sm'
                      : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-[#f8fafc]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-[#0f172a] leading-snug">
                      {faq.question}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isOpen
                          ? 'bg-[#15803d] text-white'
                          : 'bg-[#f1f5f9] text-[#64748b]'
                      }`}
                    >
                      {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#334155] leading-relaxed border-t border-[#15803d]/10">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Assistance Note */}
      <div className="rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0f172a]">Ready to register a grievance?</div>
            <div className="text-[11px] text-[#64748b]">Upload 3–5 photos, confirm the interactive map location, and describe the issue.</div>
          </div>
        </div>
        <a
          href="/citizen/report"
          className="px-5 py-2.5 rounded-full bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0"
        >
          Report an Issue →
        </a>
      </div>
    </div>
  )
}
