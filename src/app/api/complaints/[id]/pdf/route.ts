import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'
import { Complaint, ComplaintImage, ComplaintAiAnalysis } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Retrieve complaint data
    const { data: complaint, error: compErr } = await supabase
      .from('complaints')
      .select('*, departments(name, code)')
      .eq('id', id)
      .single()

    if (compErr || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    // Retrieve images and AI analysis
    const [{ data: images }, { data: aiAnalysis }] = await Promise.all([
      supabase.from('complaint_images').select('*').eq('complaint_id', id),
      supabase.from('complaint_ai_analysis').select('*').eq('complaint_id', id).single(),
    ])

    const c = complaint as Complaint
    const imgs = (images ?? []) as ComplaintImage[]
    const ai = aiAnalysis as ComplaintAiAnalysis | null

    const doc = new jsPDF()

    // Fonts & layout setup
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('OFFICIAL COMPLAINT REPORT', 15, 25)

    doc.setFontSize(10)
    doc.setFont('Helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 15, 32)
    doc.line(15, 35, 195, 35)

    // Sections
    let y = 45

    const printField = (label: string, value: string, bold = false) => {
      doc.setFont('Helvetica', 'bold')
      doc.setTextColor(80, 80, 80)
      doc.text(`${label}:`, 15, y)
      doc.setFont('Helvetica', bold ? 'bold' : 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(value || 'N/A', 60, y)
      y += 8
    }

    // --- CORE DETAILS ---
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('1. CORE COMPLAINT INFORMATION', 15, y)
    y += 8
    doc.setFontSize(10)
    printField('Complaint ID', c.permanent_id, true)
    printField('Status', c.status)
    printField('Priority', c.priority)
    printField('Created At', new Date(c.created_at).toLocaleString('en-IN'))
    y += 4

    // --- CITIZEN PROVIDED INFORMATION ---
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('2. CITIZEN PROVIDED INFORMATION', 15, y)
    y += 8
    doc.setFontSize(10)

    // Split description into lines to avoid overflow
    const descLines = doc.splitTextToSize(c.description, 130)
    doc.setFont('Helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text('Description:', 15, y)
    doc.setFont('Helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(descLines, 60, y)
    y += descLines.length * 6 + 4

    printField('Location Address', c.address)
    printField('GPS Coordinates', `${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`)
    y += 4

    // --- AI GENERATED ROUTING & METADATA ---
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('3. AI GENERATED ROUTING & ANALYSIS', 15, y)
    y += 8
    doc.setFontSize(10)
    printField('Category', c.category)
    printField('Subcategory', c.subcategory)
    printField('Assigned Department', (c as { departments?: { name: string } }).departments?.name ?? 'Unassigned')

    if (c.sla_deadline) {
      printField('SLA Duration', `${c.sla_duration_hours} Hours`)
      printField('SLA Deadline', new Date(c.sla_deadline).toLocaleString('en-IN'))
    }

    if (ai) {
      y += 4
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('4. GEMINI AI ACTION BRIEF', 15, y)
      y += 8
      doc.setFontSize(10)
      if (ai.summary) {
        const summaryLines = doc.splitTextToSize(ai.summary, 130)
        doc.setFont('Helvetica', 'bold')
        doc.setTextColor(80, 80, 80)
        doc.text('AI Summary:', 15, y)
        doc.setFont('Helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(summaryLines, 60, y)
        y += summaryLines.length * 6 + 4
      }

      if (ai.recommended_actions && ai.recommended_actions.length > 0) {
        doc.setFont('Helvetica', 'bold')
        doc.setTextColor(80, 80, 80)
        doc.text('Recommended Actions:', 15, y)
        doc.setFont('Helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        let bulletY = y
        ai.recommended_actions.forEach((action) => {
          doc.text(`- ${action}`, 65, bulletY)
          bulletY += 6
        })
        y = bulletY + 6
      }
    }

    // Output PDF as Buffer
    const pdfArrayBuffer = doc.output('arraybuffer')
    return new NextResponse(pdfArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="complaint-${c.permanent_id}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[PDF API]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
