'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  chart: string
  id: string
}

export default function MermaidDiagram({ chart, id }: Props) {
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

        const { svg } = await mermaid.render(id, chart)
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
    return () => { cancelled = true }
  }, [chart, id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Rendering diagram...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-700 font-medium text-sm">Diagram Error</p>
        <pre className="text-xs text-red-500 mt-1 whitespace-pre-wrap">{error}</pre>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto p-4 bg-white rounded-xl border border-gray-200"
      style={{ minHeight: '300px' }}
    />
  )
}
