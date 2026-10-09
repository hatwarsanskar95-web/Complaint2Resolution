import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { STATUS_LABELS, PRIORITY_LABELS, ComplaintStatus, PriorityLevel } from '@/lib/types'

// ============================================================
// Official Administrative Complaint Report PDF Generator
// Returns a print-ready HTML page with interactive print/download action bar
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

  // 1. Fetch Main Complaint with Explicit Relational Aliases
  const { data: complaint, error: complaintError } = await supabase
    .from('complaints')
    .select('*, departments(name, code), citizen:profiles!citizen_id(full_name, email, phone_number), assigned_officer:profiles!assigned_officer_id(full_name, email)')
    .eq('id', id)
    .single()

  if (complaintError || !complaint) {
    console.error('[PDF] Complaint fetch error:', complaintError?.message, complaintError?.code)
    return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
  }

  // Security Check: Admin, Officer, or Citizen Owner
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isStaffOrAdmin = ['dept_admin', 'super_admin', 'officer'].includes(userProfile?.role || '')
  const isOwner = complaint.citizen_id === user.id

  if (!isStaffOrAdmin && !isOwner) {
    return NextResponse.json({ error: 'Access Denied: Administrative authorization required' }, { status: 403 })
  }

  // 2. Fetch Related Information (AI, Images, History, Resolution, Verifications)
  const [
    { data: ai },
    { data: images },
    { data: history },
    { data: resolutionSubmission },
    { data: resolutionReport },
    { data: aiVerification },
    { data: citizenVerification }
  ] = await Promise.all([
    supabase.from('complaint_ai_analysis').select('*').eq('complaint_id', id).single(),
    supabase.from('complaint_images').select('*').eq('complaint_id', id).order('created_at', { ascending: true }),
    supabase.from('complaint_status_history').select('*, updater:profiles!updated_by(full_name, role)').eq('complaint_id', id).order('created_at', { ascending: true }),
    supabase.from('resolution_submissions').select('*').eq('complaint_id', id).order('submitted_at', { ascending: false }).limit(1).single(),
    supabase.from('resolution_reports').select('*').eq('complaint_id', id).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('ai_verifications').select('*').eq('complaint_id', id).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('citizen_verifications').select('*').eq('complaint_id', id).order('created_at', { ascending: false }).limit(1).single()
  ])

  // Process Images into Original vs Resolution
  const originalPhotos = images?.filter((i) => i.image_type === 'original') || []
  const resolutionPhotos = images?.filter((i) => ['before', 'after', 'dispute'].includes(i.image_type)) || []

  // Labels and Timestamps
  const statusLabel = STATUS_LABELS[complaint.status as ComplaintStatus] ?? complaint.status
  const priorityLabel = PRIORITY_LABELS[complaint.priority as PriorityLevel] ?? complaint.priority
  const generatedAt = new Date().toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
  const submittedAt = complaint.created_at
    ? new Date(complaint.created_at).toLocaleString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : 'Not available'

  const slaDeadline = complaint.sla_deadline
    ? new Date(complaint.sla_deadline).toLocaleString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : 'Not available'

  // Resolution Timestamp
  const resolvedHistory = (history || []).find((h) => ['RESOLVED', 'CLOSED'].includes(h.new_status))
  const resolutionTimestamp = complaint.closed_at
    ? new Date(complaint.closed_at).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : resolvedHistory
    ? new Date(resolvedHistory.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Not available'

  // SLA Outcome
  const isClosedOrResolved = ['RESOLVED', 'CLOSED'].includes(complaint.status)
  let slaOutcomeText = 'In Progress'
  if (isClosedOrResolved) {
    if (complaint.sla_deadline && resolvedHistory) {
      const isBreached = new Date(resolvedHistory.created_at) > new Date(complaint.sla_deadline)
      slaOutcomeText = isBreached ? 'Breached SLA' : 'SLA Met ✓'
    } else {
      slaOutcomeText = 'SLA Met ✓'
    }
  } else if (complaint.sla_deadline && new Date() > new Date(complaint.sla_deadline)) {
    slaOutcomeText = 'Currently Overdue (Breached)'
  } else if (complaint.sla_deadline) {
    slaOutcomeText = 'Active (Within Target SLA)'
  }

  // Assigned Officer & Citizen profiles
  const citizenProfile = complaint.citizen as { full_name?: string; email?: string; phone_number?: string } | null
  const citizenName = citizenProfile?.full_name ?? 'Not available'
  const citizenEmail = citizenProfile?.email ?? 'Not available'

  const officerProfile = complaint.assigned_officer as { full_name?: string; email?: string } | null
  const officerName = officerProfile?.full_name ?? 'Not assigned'

  const deptName = (complaint.departments as { name?: string } | null)?.name ?? 'Not assigned'

  // Assignment Timestamp
  const assignmentEntry = (history || []).find((h) => h.new_status === 'ASSIGNED' || h.new_status === 'IN_PROGRESS')
  const assignmentTimestamp = assignmentEntry
    ? new Date(assignmentEntry.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Not available'

  // Reopening History
  const reopeningEntries = (history || []).filter((h) => h.new_status === 'REOPENED' || h.new_status === 'DISPUTED')

  const recommendedActions: string[] = Array.isArray(ai?.recommended_actions)
    ? ai.recommended_actions
    : []

  const priorityColor =
    complaint.priority === 'CRITICAL' ? '#dc2626' :
    complaint.priority === 'HIGH' ? '#d97706' :
    complaint.priority === 'MEDIUM' ? '#2563eb' : '#16a34a'

  // Format Timeline Rows
  const timelineRows = (history || []).map((h) => {
    const ts = new Date(h.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const label = STATUS_LABELS[h.new_status as ComplaintStatus] ?? h.new_status
    const updatedBy = (h.updater as { full_name?: string })?.full_name ? ` (by ${(h.updater as { full_name?: string }).full_name})` : ''
    return `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:11px;font-family:Courier,monospace">${ts}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:11px;font-weight:700;color:#0f172a">${label}${updatedBy}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:11px;color:#475569">${h.notes ?? '—'}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Official Complaint Inspection Report — ${complaint.permanent_id}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',Arial,sans-serif;font-size:12px;color:#0f172a;background:#f8fafc;padding-bottom:40px}
.action-header{position:sticky;top:0;z-index:999;background:#064e3b;color:#fff;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 20px rgba(0,0,0,0.25)}
.action-title{font-size:14px;font-weight:700;letter-spacing:-0.2px}
.action-buttons{display:flex;gap:10px}
.btn{padding:8px 18px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:all 0.2s}
.btn-primary{background:#10b981;color:#fff;box-shadow:0 2px 8px rgba(16,185,129,0.4)}
.btn-primary:hover{background:#059669}
.btn-secondary{background:rgba(255,255,255,0.15);color:#fff}
.btn-secondary:hover{background:rgba(255,255,255,0.25)}
.page{max-width:920px;margin:24px auto;background:#fff;padding:40px 48px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0}
.header-banner{display:flex;align-items:center;justify-content:space-between;padding:24px;border-radius:12px;background:linear-gradient(135deg,#064e3b 0%,#022c22 100%);color:#fff;margin-bottom:28px}
.header-brand{display:flex;align-items:center;gap:14px}
.header-logo{width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff}
.header-text h1{font-size:18px;font-weight:900;letter-spacing:-0.5px}
.header-text p{font-size:11px;opacity:0.8;margin-top:2px}
.header-meta{text-align:right;font-size:10px;opacity:0.85}
.header-meta strong{display:block;font-size:14px;font-weight:900;opacity:1;margin-bottom:2px}
.sec{margin-bottom:26px}
.sec-hdr{display:flex;align-items:center;gap:10px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#064e3b;padding:9px 14px;background:#ecfdf5;border-radius:8px;border-left:4px solid #10b981;margin-bottom:14px}
.sec-num{width:22px;height:22px;border-radius:50%;background:#064e3b;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.field{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px}
.fl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;margin-bottom:4px}
.fv{font-size:12px;font-weight:600;color:#0f172a;line-height:1.4}
.fv.mono{font-family:'Courier New',monospace;font-weight:700;font-size:13px;color:#064e3b}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;color:#fff}
.desc-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:12px;line-height:1.6;color:#334155;white-space:pre-wrap}
.photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:8px}
.photo-card{border:1px solid #cbd5e1;border-radius:10px;overflow:hidden;background:#fff;text-align:center}
.photo-card img{width:100%;height:160px;object-fit:cover}
.photo-card p{font-size:10px;color:#64748b;padding:6px;font-weight:600}
.action-list{list-style:none;display:flex;flex-direction:column;gap:6px}
.action-list li{display:flex;align-items:flex-start;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;font-size:11px;line-height:1.5;color:#334155}
.action-bullet{width:18px;height:18px;min-width:18px;border-radius:50%;background:#d1fae5;color:#047857;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-top:1px}
table{width:100%;border-collapse:collapse;margin-top:4px}
th{background:#f1f5f9;text-align:left;padding:9px 12px;font-weight:700;color:#334155;border-bottom:2px solid #cbd5e1;font-size:10px;text-transform:uppercase;letter-spacing:0.5px}
.footer{border-top:2px solid #e2e8f0;padding-top:16px;margin-top:32px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#94a3b8}
@media print{
  .action-header{display:none!important}
  body{background:#fff;padding-bottom:0}
  .page{box-shadow:none;border:none;padding:0;margin:0;max-width:100%}
}
</style>
</head>
<body>

<div class="action-header">
  <div class="action-title">
    Municipal Grievance Inspection Report — <strong>${complaint.permanent_id}</strong>
  </div>
  <div class="action-buttons">
    <button class="btn btn-primary" onclick="window.print()">[ View / Save Detailed PDF ]</button>
    <button class="btn btn-secondary" onclick="window.print()">[ Download PDF ]</button>
    <button class="btn btn-secondary" onclick="window.close()">[ Close ]</button>
  </div>
</div>

<div class="page">
  <!-- Header Banner -->
  <div class="header-banner">
    <div class="header-brand">
      <div class="header-logo">C2R</div>
      <div class="header-text">
        <h1>Complaint2Resolution</h1>
        <p>Government Civic Grievance Audit & Inspection Portal</p>
      </div>
    </div>
    <div class="header-meta">
      <strong>OFFICIAL INSPECTION REPORT</strong>
      <span>Generated: ${generatedAt}</span><br/>
      <span>Ref: ${complaint.permanent_id}</span>
    </div>
  </div>

  <!-- SECTION 1: Complaint Identification -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">1</div>Complaint Identification</div>
    <div class="grid4">
      <div class="field"><div class="fl">Permanent ID</div><div class="fv mono">${complaint.permanent_id}</div></div>
      <div class="field"><div class="fl">Current Status</div><div class="fv">${statusLabel}</div></div>
      <div class="field"><div class="fl">Category / Subcategory</div><div class="fv">${complaint.category} ${complaint.subcategory ? '› ' + complaint.subcategory : ''}</div></div>
      <div class="field"><div class="fl">Priority Level</div><div class="fv"><span class="badge" style="background:${priorityColor}">${priorityLabel}</span></div></div>
    </div>
    <div class="grid2" style="margin-top:10px">
      <div class="field"><div class="fl">Submission Timestamp</div><div class="fv">${submittedAt}</div></div>
      <div class="field"><div class="fl">SLA Target Deadline</div><div class="fv">${slaDeadline}</div></div>
    </div>
  </div>

  <!-- SECTION 2: Citizen Information -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">2</div>Citizen Information</div>
    <div class="grid2" style="margin-bottom:10px">
      <div class="field"><div class="fl">Citizen Name</div><div class="fv">${citizenName}</div></div>
      <div class="field"><div class="fl">Registered Email</div><div class="fv">${citizenEmail}</div></div>
    </div>
    <div class="field">
      <div class="fl">Original Complaint Description</div>
      <div class="desc-box">${complaint.description || 'Not available'}</div>
    </div>
  </div>

  <!-- SECTION 3: Location -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">3</div>Location Details</div>
    <div class="grid2">
      <div class="field"><div class="fl">Address / Landmark</div><div class="fv">${complaint.address || 'Not available'}</div></div>
      <div class="field">
        <div class="fl">GPS Coordinates</div>
        <div class="fv mono">
          ${complaint.latitude != null ? complaint.latitude.toFixed(6) + '° N' : 'Not available'}, 
          ${complaint.longitude != null ? complaint.longitude.toFixed(6) + '° E' : 'Not available'}
        </div>
      </div>
    </div>
  </div>

  <!-- SECTION 4: Original Evidence -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">4</div>Original Evidence Photos</div>
    ${originalPhotos.length > 0 ? `
    <div class="photo-grid">
      ${originalPhotos.map((img, idx) => `
        <div class="photo-card">
          <img src="${img.image_url}" alt="Citizen Evidence Photo ${idx + 1}"/>
          <p>Citizen Photo ${idx + 1}</p>
        </div>
      `).join('')}
    </div>
    ` : `<div class="field"><div class="fl">Evidence Photos</div><div class="fv" style="color:#94a3b8">No original photographic evidence uploaded.</div></div>`}
  </div>

  <!-- SECTION 5: AI Analysis -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">5</div>AI Automated Triage & Analysis</div>
    ${ai ? `
    <div class="grid4" style="margin-bottom:10px">
      <div class="field"><div class="fl">Detected Category</div><div class="fv">${ai.category ?? complaint.category}</div></div>
      <div class="field"><div class="fl">Recommended Dept</div><div class="fv">${ai.department_recommendation ?? 'Not available'}</div></div>
      <div class="field"><div class="fl">Priority Assessment</div><div class="fv">${ai.priority_recommendation ?? complaint.priority}</div></div>
      <div class="field"><div class="fl">AI Confidence</div><div class="fv">${ai.confidence != null ? Math.round(ai.confidence * 100) + '%' : 'Not available'}</div></div>
    </div>
    <div class="field" style="margin-bottom:10px">
      <div class="fl">AI Analysis Summary</div>
      <div class="desc-box">${ai.summary ?? 'Not available'}</div>
    </div>
    ${recommendedActions.length > 0 ? `
    <div>
      <div class="fl" style="margin-bottom:6px">Recommended Action Protocol</div>
      <ul class="action-list">
        ${recommendedActions.map((a, i) => `<li><div class="action-bullet">${i + 1}</div><span>${a}</span></li>`).join('')}
      </ul>
    </div>
    ` : ''}
    ` : `<div class="field"><div class="fl">AI Analysis</div><div class="fv" style="color:#94a3b8">AI analysis not available for this complaint.</div></div>`}
  </div>

  <!-- SECTION 6: Department & Assignment -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">6</div>Department & Officer Assignment</div>
    <div class="grid4">
      <div class="field"><div class="fl">Assigned Department</div><div class="fv">${deptName}</div></div>
      <div class="field"><div class="fl">Assigned Officer</div><div class="fv">${officerName}</div></div>
      <div class="field"><div class="fl">Assignment Timestamp</div><div class="fv">${assignmentTimestamp}</div></div>
      <div class="field"><div class="fl">Department Code</div><div class="fv mono">${(complaint.departments as any)?.code ?? 'Not available'}</div></div>
    </div>
  </div>

  <!-- SECTION 7: SLA Information -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">7</div>SLA Metrics & Performance</div>
    <div class="grid4">
      <div class="field"><div class="fl">SLA Target Deadline</div><div class="fv">${slaDeadline}</div></div>
      <div class="field"><div class="fl">Resolution Timestamp</div><div class="fv">${resolutionTimestamp}</div></div>
      <div class="field"><div class="fl">Current SLA Status</div><div class="fv">${slaOutcomeText}</div></div>
      <div class="field"><div class="fl">SLA Met / Breached</div><div class="fv" style="font-weight:700;color:${slaOutcomeText.includes('Breached') ? '#dc2626' : '#10b981'}">${slaOutcomeText}</div></div>
    </div>
  </div>

  <!-- SECTION 8: Officer Work & Resolution -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">8</div>Officer Work & Resolution Proof</div>
    <div class="field" style="margin-bottom:10px">
      <div class="fl">Officer Action Notes / Resolution Description</div>
      <div class="desc-box">${
        resolutionSubmission?.action_taken ||
        resolutionReport?.report_text ||
        'Not available'
      }</div>
    </div>
    ${resolutionPhotos.length > 0 ? `
    <div class="photo-grid">
      ${resolutionPhotos.map((img, idx) => `
        <div class="photo-card">
          <img src="${img.image_url}" alt="Resolution Photo ${idx + 1}"/>
          <p>Resolution Proof ${idx + 1} (${img.image_type.toUpperCase()})</p>
        </div>
      `).join('')}
    </div>
    ` : `<div class="field"><div class="fl">Resolution Proof Photos</div><div class="fv" style="color:#94a3b8">No resolution proof photos submitted yet.</div></div>`}
  </div>

  <!-- SECTION 9: AI Verification -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">9</div>AI Resolution Verification</div>
    <div class="grid2">
      <div class="field">
        <div class="fl">Verification Outcome</div>
        <div class="fv" style="font-weight:700;color:${aiVerification?.verdict === 'RESOLUTION_CONSISTENT' ? '#10b981' : '#d97706'}">
          ${aiVerification?.verdict ?? 'Not available'}
        </div>
      </div>
      <div class="field">
        <div class="fl">Confidence Level</div>
        <div class="fv">${aiVerification?.confidence != null ? Math.round(aiVerification.confidence * 100) + '%' : 'Not available'}</div>
      </div>
    </div>
    <div class="field" style="margin-top:10px">
      <div class="fl">Verification Explanation</div>
      <div class="desc-box">${aiVerification?.explanation || 'Not available'}</div>
    </div>
  </div>

  <!-- SECTION 10: Citizen Verification & Dispute -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">10</div>Citizen Verification & Dispute History</div>
    <div class="grid2">
      <div class="field">
        <div class="fl">Citizen Status / Satisfaction</div>
        <div class="fv">${
          citizenVerification
            ? citizenVerification.is_satisfied ? 'Confirmed Satisfied ✓' : 'Disputed by Citizen ✕'
            : complaint.status === 'CLOSED' ? 'Closed' : complaint.status === 'DISPUTED' || complaint.status === 'REOPENED' ? 'Disputed / Reopened' : 'Awaiting Confirmation'
        }</div>
      </div>
      <div class="field">
        <div class="fl">Verification Timestamp</div>
        <div class="fv">${
          citizenVerification?.created_at
            ? new Date(citizenVerification.created_at).toLocaleString('en-IN')
            : 'Not available'
        }</div>
      </div>
    </div>
    ${reopeningEntries.length > 0 ? `
    <div style="margin-top:10px">
      <div class="fl" style="margin-bottom:6px">Reopening & Dispute Log (${reopeningEntries.length} occurrence)</div>
      <table>
        <thead><tr><th>Timestamp</th><th>Status</th><th>Dispute / Reopening Reason</th></tr></thead>
        <tbody>
          ${reopeningEntries.map((re) => `
            <tr>
              <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px">${new Date(re.created_at).toLocaleString('en-IN')}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:700;color:#dc2626">${re.new_status}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px">${re.notes || 'No notes provided'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
  </div>

  <!-- SECTION 11: Complete Timeline -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">11</div>Complete Audit Timeline</div>
    ${(history || []).length > 0 ? `
    <table>
      <thead><tr><th>Timestamp</th><th>Status Stage</th><th>Action Notes &amp; System Log</th></tr></thead>
      <tbody>${timelineRows}</tbody>
    </table>
    ` : `<div class="field"><div class="fl">Audit Trail</div><div class="fv" style="color:#94a3b8">No timeline entries recorded.</div></div>`}
  </div>

  <!-- SECTION 12: Accountability -->
  <div class="sec">
    <div class="sec-hdr"><div class="sec-num">12</div>Accountability & Performance Overview</div>
    <div class="grid4">
      <div class="field"><div class="fl">Final Lifecycle Status</div><div class="fv">${statusLabel}</div></div>
      <div class="field"><div class="fl">SLA Outcome</div><div class="fv">${slaOutcomeText}</div></div>
      <div class="field"><div class="fl">Department Name</div><div class="fv">${deptName}</div></div>
      <div class="field"><div class="fl">Audit Hash</div><div class="fv mono">${complaint.id.substring(0, 8).toUpperCase()}</div></div>
    </div>
  </div>

  <div class="footer">
    <div><strong>Complaint2Resolution</strong> — Government Civic Grievance System</div>
    <div>Report Ref: ${complaint.permanent_id} · System Generated</div>
    <div>CONFIDENTIAL — FOR ADMINISTRATIVE INSPECTION ONLY</div>
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
