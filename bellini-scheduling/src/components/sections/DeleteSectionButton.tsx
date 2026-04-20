'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'

interface Props {
  sectionId: number
  sectionLabel: string
}

export default function DeleteSectionButton({ sectionId, sectionLabel }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/sections/${sectionId}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? `Failed to delete (status ${res.status})`)
        setDeleting(false)
        return
      }
      router.push('/sections')
      router.refresh()
    } catch (err) {
      setError(`Network error: ${(err as Error).message}`)
      setDeleting(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="bg-white border border-red-300 text-red-700 text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
      >
        Delete
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-700">Delete {sectionLabel}?</span>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="text-xs px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
        >
          {deleting && <Spinner size="sm" />}
          Confirm Delete
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
