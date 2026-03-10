'use client'

import { useState } from 'react'

type ExportFormat = 'pdf' | 'excel'

export function useExport() {
  const [exporting, setExporting] = useState(false)

  const exportData = async (
    format: ExportFormat,
    endpoint: string,
    body: Record<string, unknown>,
    filename: string
  ) => {
    setExporting(true)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`Export failed: ${res.statusText}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  const exportPDF = (body: Record<string, unknown>, filename = 'report.pdf') =>
    exportData('pdf', '/api/export/pdf', body, filename)

  const exportExcel = (body: Record<string, unknown>, filename = 'report.xlsx') =>
    exportData('excel', '/api/export/excel', body, filename)

  return { exportPDF, exportExcel, exporting }
}
