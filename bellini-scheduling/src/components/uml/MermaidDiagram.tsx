'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  chart: string
  id: string
  filename?: string
  contributor?: string
}

let renderCounter = 0

export default function MermaidDiagram({ chart, id, filename, contributor }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function render() {
      setLoading(true)
      setError(null)
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        })

        renderCounter++
        const renderId = `${id}-${renderCounter}`

        const { svg } = await mermaid.render(renderId, chart)
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    render()
    return () => {
      cancelled = true
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [chart, id])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-700 font-medium text-sm">Diagram Error</p>
        <pre className="text-xs text-red-500 mt-1 whitespace-pre-wrap">{error}</pre>
      </div>
    )
  }

  function downloadSVG() {
    if (!containerRef.current) return
    const svgEl = containerRef.current.querySelector('svg')
    if (!svgEl) return

    // Clone so we don't mutate the displayed SVG
    const clone = svgEl.cloneNode(true) as SVGSVGElement

    // Inject contributor label into top-right of the SVG if provided
    if (contributor) {
      const svgWidth = clone.viewBox?.baseVal?.width || clone.clientWidth || 800
      const padding = 12
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      label.setAttribute('x', String(svgWidth - padding))
      label.setAttribute('y', '18')
      label.setAttribute('text-anchor', 'end')
      label.setAttribute('font-size', '11')
      label.setAttribute('font-family', 'ui-sans-serif, sans-serif')
      label.setAttribute('fill', '#1d4ed8')
      label.textContent = `Contributor: ${contributor}`
      clone.insertBefore(label, clone.firstChild)
    }

    const serialized = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([serialized], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative">
      {loading && (
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          Rendering diagram...
        </div>
      )}
      <div className={`relative ${loading ? 'hidden' : ''}`}>
        <div
          ref={containerRef}
          className="overflow-auto p-4 bg-white rounded-xl border border-gray-200"
          style={{ minHeight: '300px' }}
        />
        {contributor && (
          <div className="absolute top-3 right-6 pointer-events-none">
            <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
              Contributor: {contributor}
            </span>
          </div>
        )}
      </div>
      {!loading && !error && filename && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={downloadSVG}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download {filename}.svg
          </button>
        </div>
      )}
    </div>
  )
}
