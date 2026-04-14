import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  applySequentialTimesToRows,
  buildDraftDays,
  buildQuestionTrackerRows,
  buildWeeklySummary,
  clearDraftFromStorage,
  createEmptyDraft,
  createEmptyRow,
  getFirstDayTimeTemplate,
  getLessonsByDraft,
  getTopicsForLesson,
  loadDraftFromStorage,
  persistDraftToStorage,
  validateSetupDraft,
} from '../lib/program'
import { AppStep, EducationLevel, type ProgramDraft, type ProgramRow } from '../types'

export function useProgramDraft() {
  const [initialDraftState] = useState<{ draft: ProgramDraft; initialStep: AppStep }>(() => {
    const savedDraft = loadDraftFromStorage()

    return {
      draft: savedDraft ?? createEmptyDraft(),
      initialStep: savedDraft && savedDraft.start && savedDraft.end && savedDraft.days.length
        ? AppStep.Editor
        : AppStep.Setup,
    }
  })

  const [draft, setDraft] = useState<ProgramDraft>(initialDraftState.draft)
  const [setupError, setSetupError] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarViewDate, setCalendarViewDate] = useState(new Date())
  const [calendarRange, setCalendarRange] = useState({ start: '', end: '' })

  const hasPersistedDraft = useRef(false)

  const { educationLevel, classLevel, examTrack, studyField } = draft

  const lessons = useMemo(
    () => getLessonsByDraft({ educationLevel, classLevel, examTrack, studyField }),
    [educationLevel, classLevel, examTrack, studyField],
  )

  const weeklySummary = useMemo(() => buildWeeklySummary(draft.days), [draft.days])

  const questionTrackerRows = useMemo(
    () => (draft.includeQuestionTracker ? buildQuestionTrackerRows(draft.days) : []),
    [draft.includeQuestionTracker, draft.days],
  )

  useEffect(() => {
    if (!hasPersistedDraft.current) {
      hasPersistedDraft.current = true
      return
    }

    persistDraftToStorage(draft)
  }, [draft])

  const hydrateDraft = useCallback((nextDraft: ProgramDraft) => {
    setDraft(nextDraft)
    setSetupError('')
  }, [])

  const openCalendar = useCallback(() => {
    setCalendarRange({ start: draft.start, end: draft.end })
    setCalendarViewDate(draft.start ? new Date(`${draft.start}T00:00:00`) : new Date())
    setCalendarOpen(true)
  }, [draft.end, draft.start])

  const selectCalendarDate = useCallback((value: string) => {
    setCalendarRange((current) => {
      if (!current.start || current.end) {
        return { start: value, end: '' }
      }

      if (value < current.start) {
        return { start: value, end: current.start }
      }

      return { start: current.start, end: value }
    })
  }, [])

  const changeCalendarMonth = useCallback((step: number) => {
    setCalendarViewDate((current) => new Date(current.getFullYear(), current.getMonth() + step, 1))
  }, [])

  const applyDateRange = useCallback(() => {
    if (!calendarRange.start || !calendarRange.end) {
      window.alert('Lütfen başlangıç ve bitiş tarihini seçiniz.')
      return false
    }

    if (calendarRange.start > calendarRange.end) {
      window.alert('Başlangıç tarihi bitiş tarihinden sonra olamaz.')
      return false
    }

    setDraft((current) => ({
      ...current,
      start: calendarRange.start,
      end: calendarRange.end,
    }))
    setCalendarOpen(false)
    return true
  }, [calendarRange.end, calendarRange.start])

  const proceedToEditor = useCallback((skipEducationCheck = false) => {
    const normalizedDraft: ProgramDraft = {
      ...draft,
      classLevel: draft.educationLevel === EducationLevel.Undergraduate ? EducationLevel.Undergraduate : draft.classLevel,
    }

    const validationError = validateSetupDraft(normalizedDraft, skipEducationCheck)
    setSetupError(validationError)

    if (validationError) {
      return false
    }

    setDraft((current) => ({
      ...normalizedDraft,
      days: buildDraftDays(normalizedDraft.start, normalizedDraft.end, current.days),
    }))

    return true
  }, [draft])

  const updateRow = useCallback((dayIndex: number, rowIndex: number, field: keyof ProgramRow, value: string) => {
    setDraft((current) => {
      const nextDays = current.days.map((day, currentDayIndex) => {
        if (currentDayIndex !== dayIndex) {
          return day
        }

        const nextRows = day.rows.map((row, currentRowIndex) => {
          if (currentRowIndex !== rowIndex) {
            return row
          }

          const nextRow = { ...row, [field]: value }

          if (field === 'lesson') {
            const validTopics = getTopicsForLesson(current, value)

            if (!validTopics.includes(nextRow.topic)) {
              nextRow.topic = ''
            }
          }

          if (field === 'method' && value !== 'Soru Çözümü') {
            nextRow.questionCount = ''
          }

          return nextRow
        })

        return {
          ...day,
          rows: field === 'time' && rowIndex === 0 && value
            ? applySequentialTimesToRows(nextRows, value)
            : nextRows,
        }
      })

      if (field === 'time' && rowIndex === 0 && value && dayIndex === 0) {
        const template = nextDays[0].rows.map((row) => row.time)

        return {
          ...current,
          days: nextDays.map((day, index) => (
            index === 0
              ? day
              : {
                  ...day,
                  rows: day.rows.map((row, templateIndex) => ({
                    ...row,
                    time: template[templateIndex] || row.time,
                  })),
                }
          )),
        }
      }

      return { ...current, days: nextDays }
    })
  }, [])

  const addRow = useCallback((dayIndex: number) => {
    setDraft((current) => {
      const nextDays = current.days.map((day, index) => {
        if (index !== dayIndex) {
          return day
        }

        return {
          ...day,
          rows: [...day.rows, createEmptyRow()],
        }
      })

      if (dayIndex === 0) {
        const firstTime = nextDays[0]?.rows[0]?.time

        if (!firstTime) {
          return { ...current, days: nextDays }
        }

        const normalizedFirstDay = {
          ...nextDays[0],
          rows: applySequentialTimesToRows(nextDays[0].rows, firstTime),
        }
        const template = normalizedFirstDay.rows.map((row) => row.time)

        return {
          ...current,
          days: nextDays.map((day, index) => (
            index === 0
              ? normalizedFirstDay
              : {
                  ...day,
                  rows: day.rows.map((row, templateIndex) => ({
                    ...row,
                    time: template[templateIndex] || row.time,
                  })),
                }
          )),
        }
      }

      const template = getFirstDayTimeTemplate(nextDays)
      return {
        ...current,
        days: nextDays.map((day, index) => {
          if (index !== dayIndex) {
            return day
          }

          const lastIndex = day.rows.length - 1

          return {
            ...day,
            rows: day.rows.map((row, rowIndex) => (
              rowIndex === lastIndex && template[lastIndex]
                ? { ...row, time: template[lastIndex] }
                : row
            )),
          }
        }),
      }
    })
  }, [])

  const removeRow = useCallback((dayIndex: number) => {
    setDraft((current) => ({
      ...current,
      days: current.days.map((day, index) => {
        if (index !== dayIndex || day.rows.length <= 1) {
          return day
        }

        return {
          ...day,
          rows: day.rows.slice(0, -1),
        }
      }),
    }))
  }, [])

  const resetDraft = useCallback(() => {
    clearDraftFromStorage()
    setDraft(createEmptyDraft())
    setSetupError('')
  }, [])

  return {
    draft,
    initialStep: initialDraftState.initialStep,
    setDraft,
    setupError,
    lessons,
    weeklySummary,
    questionTrackerRows,
    calendarOpen,
    calendarViewDate,
    calendarRange,
    setCalendarOpen,
    setCalendarRange,
    hydrateDraft,
    openCalendar,
    selectCalendarDate,
    changeCalendarMonth,
    applyDateRange,
    proceedToEditor,
    updateRow,
    addRow,
    removeRow,
    resetDraft,
  }
}
