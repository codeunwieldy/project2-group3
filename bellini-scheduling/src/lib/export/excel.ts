import ExcelJS from 'exceljs'

export type ExcelRow = Record<string, string | number | null | undefined>
export interface ExcelSheetDef {
  name: string
  columns: { header: string; key: string; width?: number }[]
  rows: ExcelRow[]
}

export async function generateExcel(sheets: ExcelSheetDef[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Bellini Scheduling System'
  workbook.created = new Date()

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name)
    ws.columns = sheet.columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 20,
    }))

    // Style header row
    ws.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' },
      }
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
    })

    // Add data rows
    sheet.rows.forEach((row, idx) => {
      const r = ws.addRow(row)
      if (idx % 2 === 1) {
        r.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEFF6FF' },
          }
        })
      }
    })

    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columns.length },
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as unknown as Buffer
}
