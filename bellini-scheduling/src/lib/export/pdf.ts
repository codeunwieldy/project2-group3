import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export type PDFColumn = { header: string; dataKey: string }
export type PDFRow = Record<string, string | number | null | undefined>

export function generateWorkloadPDF(
  rows: PDFRow[],
  title = 'Instructor Workload Report'
): Uint8Array {
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(16)
  doc.text(title, 14, 16)
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24)

  const columns: PDFColumn[] = [
    { header: 'Instructor', dataKey: 'instructor_name' },
    { header: 'Semester', dataKey: 'semester_label' },
    { header: 'Sections', dataKey: 'section_count' },
    { header: 'Enrolled', dataKey: 'total_enrollment' },
    { header: 'TA Hours', dataKey: 'total_ta_hours' },
  ]

  autoTable(doc, {
    startY: 30,
    columns,
    body: rows as unknown as Parameters<typeof autoTable>[1]['body'],
    headStyles: { fillColor: [30, 64, 175] },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    styles: { fontSize: 9 },
  })

  return doc.output('arraybuffer') as unknown as Uint8Array
}

export function generateGenericPDF(
  title: string,
  columns: PDFColumn[],
  rows: PDFRow[]
): Uint8Array {
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(16)
  doc.text(title, 14, 16)
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24)

  autoTable(doc, {
    startY: 30,
    columns,
    body: rows as unknown as Parameters<typeof autoTable>[1]['body'],
    headStyles: { fillColor: [30, 64, 175] },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    styles: { fontSize: 9 },
  })

  return doc.output('arraybuffer') as unknown as Uint8Array
}
