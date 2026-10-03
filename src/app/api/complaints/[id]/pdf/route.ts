import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { STATUS_LABELS, PRIORITY_LABELS, ComplaintStatus, PriorityLevel } from '@/lib/types'

// ============================================================
// Phase 13 — Official Complaint PDF Generation Service
// Returns a print-ready HTML page that the browser can save as PDF.
// This approach avoids server-side binary PDF rendering issues.
// ============================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: complaint, error } = await supabase
    .from('complaints')
    .select('*, departments(name, code), profiles(full_name, email, phone_number)')
    .eq('id', id)
    .single()

  if (error || !complaint) {
    return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
  }

  const { data: ai } = await supabase
    .from('complaint_ai_analysis')
    .select('*')
    .eq('complaint_id', id)
    .single()

  const { data: images } = await supabase
    .from('complaint_images')
    .select('*')
    .eq('complaint_id', id)
    .order('created_at')

  const { data: history } = await supabase
    .from('complaint_status_history')
    .select('*')
    .eq('complaint_id', id)
    .order('created_at')

  const originalPhoto = images?.find((i) => i.image_type === 'original')
  const statusLabel = STATUS_LABELS[complaint.status as ComplaintStatus] ?? complaint.status
  const priorityLabel = PRIORITY_LABELS[complaint.priority as PriorityLevel] ?? complaint.priority
  const generatedAt = new Date().toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
  const submittedAt = new Date(complaint.created_at).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const slaDeadline = complaint.sla_deadline
    ? new Date(complaint.sla_deadline).toLocaleString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : 'Not assigned'

  const priorityColor =
    complaint.priority === 'CRITICAL' ? '#dc2626' :
    complaint.priority === 'HIGH' ? '#d97706' :
    complaint.priority === 'MEDIUM' ? '#2563eb' : '#16a34a'

  const recommendedActions: string[] = Array.isArray(ai?.recommended_actions)
    ? ai.recommended_actions
    : []

  const deptName = (complaint.departments as { name?: string } | null)?.name ?? 'Pending Assignment'
  const lat = complaint.latitude?.toFixed(6) ?? '—'
  const lng = complaint.longitude?.toFixed(6) ?? '—'

  const timelineRows = (history ?? []).map((h) => {
    const ts = new Date(h.created_at).toLocaleString('en-IN')
    const label = STATUS_LABELS[h.new_status as ComplaintStatus] ?? h.new_status
    return `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top;font-size:11px">${ts}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top;font-size:11px;font-weight:600">${label}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top;font-size:11px">${h.notes ?? '—'}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Official Report — ${complaint.permanent_id}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',Arial,sans-serif;font-size:12px;color:#111827;background:#fff}
.page{max-width:900px;margin:0 auto;padding:36px 40px}
.header-banner{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-radius:12px;background:linear-gradient(135deg,#1e3a5f 0%,#0f2447 100%);color:#fff;margin-bottom:28px}
.header-logo{width:52px;height:52px;border-radius:12px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;letter-spacing:-1px;flex-shrink:0}
.header-brand{display:flex;align-items:center;gap:14px}
.header-text h1{font-size:17px;font-weight:900;letter-spacing:-0.5px}
.header-text p{font-size:10px;opacity:.75;margin-top:2px}
.header-meta{text-align:right;font-size:10px;opacity:.75}
.header-meta strong{display:block;font-size:13px;font-weight:900;opacity:1;margin-bottom:3px}
.report-title{text-align:center;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1e3a5f;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #e5e7eb}
.sec{margin-bottom:24px}
.sec-hdr{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#1e3a5f;padding:8px 12px;background:#eff6ff;border-radius:6px;border-left:4px solid #2563eb;margin-bottom:12px}
.sec-num{width:22px;height:22px;border-radius:50%;background:#2563eb;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.field{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px}
.fl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:#6b7280;margin-bottom:4px}
.fv{font-size:12px;font-weight:600;color:#111827;line-height:1.4}
.fv.mono{font-family:'Courier New',monospace;font-weight:700;font-size:13px;color:#1e3a5f}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;color:#fff;background:${priorityColor}}
.desc-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;font-size:12px;line-height:1.7;color:#374151}
.photo-wrap{text-align:center;margin-top:4px}
.photo-wrap img{max-width:100%;max-height:280px;object-fit:cover;border-radius:10px;border:1px solid #d1d5db}
.photo-cap{font-size:9px;color:#6b7280;margin-top:6px}
.action-list{list-style:none;display:flex;flex-direction:column;gap:6px}
.action-list li{display:flex;align-items:flex-start;gap:8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;font-size:11px;line-height:1.5;color:#374151}
.action-bullet{width:18px;height:18px;min-width:18px;border-radius:50%;background:#dbeafe;color:#1d4ed8;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
table{width:100%;border-collapse:collapse}
th{background:#f1f5f9;text-align:left;padding:8px 10px;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;font-size:11px}
.signoff{border:2px dashed #d1d5db;border-radius:10px;padding:20px 24px}
.sig-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:16px}
.sig-line{border-top:1.5px solid #374151;margin-top:42px;padding-top:6px;font-size:10px;color:#6b7280;text-align:center}
.footer{border-top:1px solid #e5e7eb;padding-top:14px;margin-top:28px;display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#9ca3af}
.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:64px;font-weight:900;color:rgba(30,58,95,0.04);pointer-events:none;letter-spacing:8px;white-space:nowrap;z-index:0}
.no-print-btn{position:fixed;top:20px;right:20px;z-index:999;display:flex;gap:8px}
@media print{
  .no-print-btn{display:none!important}
  .page{padding:16px}
  body{print-color-adjust:exact;-webkit-print-color-adjust:exact}
}
</style>
</head>
<body>
<div class="watermark">COMPLAINT2RESOLUTION</div>
<div class="no-print-btn">
  <button onclick="window.print()" style="padding:10px 22px;background:#1e3a5f;color:#fff;border:none;border-radius:8px;font-family:Inter,sans-serif;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 4px 12px rgba(30,58,95,.3)">⬇ Download / Print PDF</button>
  <button onclick="window.close()" style="padding:10px 16px;background:#e5e7eb;color:#374151;border:none;border-radius:8px;font-family:Inter,sans-serif;font-weight:600;font-size:13px;cursor:pointer">✕ Close</button>
</div>
<div class="page">

  <div class="header-banner">
    <div class="header-brand">
      <div class="header-logo">C2R</div>
      <div class="header-text">
        <h1>Complaint2Resolution</h1>
        <p>Government Civic Grievance Redressal Portal · India</p>
        <p>People Speak. Problems Solve.</p>
      </div>
    </div>
    <div class="header-meta">
      <strong>OFFICIAL COMPLAINT REPORT</strong>
      <span>Generated: ${generatedAt}</span><br/>
      <span>Ref: ${complaint.permanent_id}</span>
    </div>
  </div>

  <div class="report-title">Official Civic Grievance Report</div>

  <!-- SECTION 1 -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">1</div>Core Complaint Identifiers</div>
    <div class="grid4">
      <div class="field"><div class="fl">Permanent ID</div><div class="fv mono">${complaint.permanent_id}</div></div>
      <div class="field"><div class="fl">Current Status</div><div class="fv">${statusLabel}</div></div>
      <div class="field"><div class="fl">Priority Level</div><div class="fv"><span class="badge">${priorityLabel}</span></div></div>
      <div class="field"><div class="fl">Date Submitted</div><div class="fv">${submittedAt}</div></div>
    </div>
    <div class="grid2" style="margin-top:12px">
      <div class="field"><div class="fl">SLA Deadline</div><div class="fv">${slaDeadline}</div></div>
      <div class="field"><div class="fl">Assigned Department</div><div class="fv">${deptName}</div></div>
    </div>
  </div>

  <!-- SECTION 2 -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">2</div>Citizen Provided Information</div>
    <div class="grid2" style="margin-bottom:12px">
      <div class="field"><div class="fl">Address / Location</div><div class="fv">${complaint.address}</div></div>
      <div class="field"><div class="fl">GPS Coordinates</div><div class="fv mono">${lat}, ${lng}</div></div>
    </div>
    <div class="field" style="margin-bottom:12px">
      <div class="fl">Citizen Description</div>
      <div class="desc-box">${complaint.description}</div>
    </div>
    ${originalPhoto
      ? `<div class="photo-wrap">
          <img src="${originalPhoto.image_url}" alt="Citizen submitted photographic evidence"/>
          <div class="photo-cap">Figure 1 — Photographic evidence submitted by citizen at time of complaint registration</div>
        </div>`
      : `<div class="field"><div class="fl">Photo Evidence</div><div class="fv" style="color:#9ca3af">No photo evidence submitted</div></div>`
    }
  </div>

  <!-- SECTION 3 -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">3</div>AI Generated Analysis &amp; Recommendations</div>
    ${ai ? `
    <div class="grid4" style="margin-bottom:12px">
      <div class="field"><div class="fl">Classified Category</div><div class="fv">${ai.category ?? complaint.category}</div></div>
      <div class="field"><div class="fl">Subcategory</div><div class="fv">${ai.subcategory ?? complaint.subcategory}</div></div>
      <div class="field"><div class="fl">Recommended Dept</div><div class="fv">${ai.department_recommendation ?? '—'}</div></div>
      <div class="field"><div class="fl">AI Confidence</div><div class="fv">${ai.confidence != null ? Math.round(ai.confidence * 100) + '%' : '—'}</div></div>
    </div>
    <div class="field" style="margin-bottom:12px">
      <div class="fl">AI Summary</div>
      <div class="desc-box">${ai.summary ?? 'No AI summary generated'}</div>
    </div>
    ${recommendedActions.length > 0 ? `
    <div style="margin-bottom:12px">
      <div class="fl" style="margin-bottom:8px">AI Recommended Action Steps</div>
      <ul class="action-list">
        ${recommendedActions.map((a, i) => `<li><div class="action-bullet">${i + 1}</div><span>${a}</span></li>`).join('')}
      </ul>
    </div>` : ''}
    <div class="grid2">
      <div class="field"><div class="fl">Suggested SLA Duration</div><div class="fv">${ai.suggested_sla_hours ? ai.suggested_sla_hours + ' hours' : '—'}</div></div>
      <div class="field"><div class="fl">Human Review Required</div><div class="fv">${ai.needs_human_review ? 'Yes — Flagged for Supervisor' : 'No — Auto-Routed'}</div></div>
    </div>
    ` : `<div class="field"><div class="fl">AI Analysis</div><div class="fv" style="color:#9ca3af">AI analysis not yet available</div></div>`}
  </div>

  <!-- SECTION 4: Timeline -->
  ${(history ?? []).length > 0 ? `
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">4</div>Complaint Status Timeline &amp; Audit Trail</div>
    <table>
      <thead><tr><th>Timestamp</th><th>Status</th><th>Notes</th></tr></thead>
      <tbody>${timelineRows}</tbody>
    </table>
  </div>` : ''}

  <!-- SECTION 5: Sign-off -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">${(history ?? []).length > 0 ? '5' : '4'}</div>Official Resolution &amp; Verification Sign-Off</div>
    <div class="signoff">
      <div style="font-size:11px;color:#374151">This section is to be completed upon verified resolution of the civic complaint. All parties must sign to confirm resolution acceptance.</div>
      <div class="sig-grid">
        <div><div class="sig-line">Field Officer Signature &amp; Date</div></div>
        <div><div class="sig-line">Department Head Approval &amp; Date</div></div>
        <div><div class="sig-line">Citizen Verification &amp; Date</div></div>
      </div>
      <div style="margin-top:16px;font-size:10px;color:#9ca3af;text-align:center">
        Complaint ID: <strong>${complaint.permanent_id}</strong> ·
        This is a system-generated official document from the Complaint2Resolution portal.
      </div>
    </div>
  </div>

  <div class="footer">
    <div><strong>Complaint2Resolution</strong> — Government Civic Grievance Portal · India</div>
    <div>${complaint.permanent_id} · Generated: ${generatedAt}</div>
    <div>CONFIDENTIAL — FOR OFFICIAL USE ONLY</div>
  </div>
</div>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
