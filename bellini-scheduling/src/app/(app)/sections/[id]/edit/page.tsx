'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Toaster, toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'
import type { SectionWithTAs } from '@/types/section'

const editSectionSchema = z.object({
  semester_id: z.coerce.number().min(1, 'Semester is required'),
  crn: z.string().min(1, 'CRN is required'),
  section_code: z.string().min(1, 'Section code is required'),
  subject: z.string().min(1, 'Subject is required'),
  course_number: z.string().min(1, 'Course number is required'),
  course_title: z.string().min(1, 'Course title is required'),
  course_level: z.enum(['UG', 'GR']),
  meeting_days: z.string().optional(),
  meeting_times: z.string().optional(),
  instructor_email: z.string().email('Invalid email').optional().or(z.literal('')),
  instructor_name: z.string().optional(),
  room_code: z.string().optional(),
  enrollment: z.coerce.number().int().nonnegative().optional().or(z.literal('')),
})

type EditSectionFormValues = z.infer<typeof editSectionSchema>

interface Semester {
  id: number
  code: string
  term_label: string
}

export default function EditSectionPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()

  const [section, setSection] = useState<SectionWithTAs | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loadingSection, setLoadingSection] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditSectionFormValues>({
    resolver: zodResolver(editSectionSchema) as unknown as Resolver<EditSectionFormValues>,
  })

  // Load section and semesters on mount
  useEffect(() => {
    if (!id) return

    const supabase = createClient()

    const loadData = async () => {
      const [sectionRes, semestersRes] = await Promise.all([
        fetch(`/api/sections/${id}`),
        supabase.from('semesters').select('id, code, term_label').order('id', { ascending: false }),
      ])

      if (!sectionRes.ok) {
        setNotFound(true)
        setLoadingSection(false)
        return
      }

      const sectionData: SectionWithTAs = await sectionRes.json()
      setSemesters(semestersRes.data ?? [])
      setSection(sectionData)

      // Pre-populate form from fetched data
      reset({
        semester_id: sectionData.semester_id,
        crn: sectionData.crn,
        section_code: sectionData.section_code,
        subject: sectionData.courses?.subjects?.code ?? '',
        course_number: sectionData.courses?.course_number ?? '',
        course_title: sectionData.courses?.title ?? '',
        course_level: (sectionData.course_level as 'UG' | 'GR') ?? 'UG',
        meeting_days: sectionData.meeting_days ?? '',
        meeting_times: sectionData.meeting_times ?? '',
        instructor_email: sectionData.instructors?.email ?? '',
        instructor_name: sectionData.instructors?.full_name ?? '',
        room_code: sectionData.rooms?.room_code ?? '',
        enrollment: sectionData.enrollment ?? '',
      })

      setLoadingSection(false)
    }

    loadData()
  }, [id, reset])

  const onSubmit = async (values: EditSectionFormValues) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semester_id: values.semester_id,
          crn: values.crn,
          section_code: values.section_code,
          subject: values.subject,
          course_number: values.course_number,
          course_title: values.course_title,
          course_level: values.course_level,
          meeting_days: values.meeting_days || null,
          meeting_times: values.meeting_times || null,
          instructor_email: values.instructor_email || null,
          instructor_name: values.instructor_name || null,
          room_code: values.room_code || null,
          enrollment:
            values.enrollment !== '' && values.enrollment != null
              ? Number(values.enrollment)
              : null,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to update section')
      }

      toast.success('Section updated successfully')
      router.push(`/sections/${id}`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingSection) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (notFound || !section) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-gray-700">Section not found</p>
        <p className="mt-1 text-sm text-gray-500">The section you are trying to edit does not exist.</p>
        <Link href="/sections" className="mt-6 text-sm text-blue-700 hover:underline">
          &larr; Back to Sections
        </Link>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Section</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            CRN {section.crn} &bull; {section.courses?.subjects?.code}{' '}
            {section.courses?.course_number}
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 bg-white rounded-xl border border-gray-200 p-6"
        >
          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              {...register('semester_id')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select semester...</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.term_label}
                </option>
              ))}
            </select>
            {errors.semester_id && (
              <p className="mt-1 text-xs text-red-600">{errors.semester_id.message}</p>
            )}
          </div>

          {/* CRN + Section Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CRN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('crn')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.crn && <p className="mt-1 text-xs text-red-600">{errors.crn.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('section_code')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.section_code && (
                <p className="mt-1 text-xs text-red-600">{errors.section_code.message}</p>
              )}
            </div>
          </div>

          {/* Subject + Course Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('subject')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.subject && (
                <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('course_number')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.course_number && (
                <p className="mt-1 text-xs text-red-600">{errors.course_number.message}</p>
              )}
            </div>
          </div>

          {/* Course Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('course_title')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.course_title && (
              <p className="mt-1 text-xs text-red-600">{errors.course_title.message}</p>
            )}
          </div>

          {/* Course Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Level</label>
            <select
              {...register('course_level')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="UG">Undergraduate (UG)</option>
              <option value="GR">Graduate (GR)</option>
            </select>
          </div>

          {/* Meeting Days + Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Days</label>
              <input
                type="text"
                {...register('meeting_days')}
                placeholder="e.g. MWF or TR"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Times</label>
              <input
                type="text"
                {...register('meeting_times')}
                placeholder="e.g. 09:00-10:15"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Instructor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Email</label>
              <input
                type="email"
                {...register('instructor_email')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.instructor_email && (
                <p className="mt-1 text-xs text-red-600">{errors.instructor_email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Name</label>
              <input
                type="text"
                {...register('instructor_name')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Room + Enrollment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Code</label>
              <input
                type="text"
                {...register('room_code')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment</label>
              <input
                type="number"
                {...register('enrollment')}
                min={0}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.enrollment && (
                <p className="mt-1 text-xs text-red-600">{errors.enrollment.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href={`/sections/${id}`}
              className="text-sm text-gray-600 hover:underline"
            >
              &larr; Back to Section
            </Link>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push(`/sections/${id}`)}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting && <Spinner size="sm" />}
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
