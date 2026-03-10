import { NextResponse } from 'next/server'
import { generateExcel } from '@/lib/export/excel'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sheets, filename } = body

    const buffer = await generateExcel(sheets)

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename ?? 'report'}.xlsx"`,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
