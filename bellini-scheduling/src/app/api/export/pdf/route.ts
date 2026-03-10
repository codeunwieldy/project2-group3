import { NextResponse } from 'next/server'
import { generateWorkloadPDF } from '@/lib/export/pdf'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, title } = body

    const pdfBuffer = await generateWorkloadPDF(data, title ?? 'Workload Report')

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="workload-report.pdf"`,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
