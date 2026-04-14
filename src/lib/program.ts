import {
  AYT_TOPICS_BY_FIELD,
  CLASS_TOPICS,
  EDUCATION_LEVELS,
  EXAM_TRACK_TOPICS,
} from '../data/legacy'
import { formatCardTitle, getDatesInRange, parseLegacyProgramDayTitle, toInputDate } from './date'
import {
  EducationLevel,
  ExamTrack,
  StudyField,
  type ManagedStudent,
  type ProgramDay,
  type ProgramDraft,
  type ProgramRecord,
  type ProgramRow,
  type QuestionTrackerRow,
  type TopicMap,
} from '../types'

export const STORAGE_KEY = 'haftalik_program_v2'

export const STUDY_METHODS = [
  'Konu Anlatımı',
  'Soru Çözümü',
  'Video İzleme',
  'Tekrar',
  'Deneme',
  'Okuma',
  'Not Tutma',
]

export const TIME_OPTIONS = Array.from({ length: 24 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 45
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const minute = String(totalMinutes % 60).padStart(2, '0')
  return `${hour}:${minute}`
})

export const createEmptyRow = (): ProgramRow => ({
  time: '',
  lesson: '',
  topic: '',
  method: '',
  questionCount: '',
})

export const createEmptyDraft = (): ProgramDraft => ({
  schoolName: '',
  student: '',
  teacher: '',
  includeQuestionTracker: false,
  educationLevel: '',
  classLevel: '',
  examTrack: '',
  studyField: '',
  start: '',
  end: '',
  days: [],
  notes: '',
})

const normalizeRow = (row: Partial<ProgramRow> | null | undefined): ProgramRow => ({
  time: row?.time ?? '',
  lesson: row?.lesson ?? '',
  topic: row?.topic ?? '',
  method: row?.method ?? '',
  questionCount: row?.questionCount ?? '',
})

const normalizeDay = (day: Partial<ProgramDay> | null | undefined): ProgramDay => {
  const normalizedDate = day?.date ?? parseLegacyProgramDayTitle(day?.title ?? '')

  return {
    date: normalizedDate,
    title: normalizedDate
      ? formatCardTitle(new Date(`${normalizedDate}T00:00:00`))
      : day?.title ?? '',
    rows: Array.isArray(day?.rows) && day.rows.length ? day.rows.map(normalizeRow) : [createEmptyRow(), createEmptyRow(), createEmptyRow()],
  }
}

export const normalizeDraft = (draft: Partial<ProgramDraft> | null | undefined): ProgramDraft => ({
  schoolName: draft?.schoolName ?? '',
  student: draft?.student ?? '',
  teacher: draft?.teacher ?? '',
  includeQuestionTracker: Boolean(draft?.includeQuestionTracker),
  educationLevel: draft?.educationLevel ?? '',
  classLevel: draft?.classLevel ?? '',
  examTrack: draft?.examTrack ?? '',
  studyField: draft?.studyField ?? '',
  start: draft?.start ?? '',
  end: draft?.end ?? '',
  days: Array.isArray(draft?.days) ? draft.days.map(normalizeDay) : [],
  notes: draft?.notes ?? '',
})

export const loadDraftFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    return normalizeDraft(JSON.parse(raw) as ProgramDraft)
  } catch {
    return null
  }
}

export const persistDraftToStorage = (draft: ProgramDraft) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export const clearDraftFromStorage = () => {
  localStorage.removeItem(STORAGE_KEY)
}

export const inferEducationLevel = (classLevel: string) => {
  if (EDUCATION_LEVELS[EducationLevel.MiddleSchool].includes(classLevel)) {
    return EducationLevel.MiddleSchool
  }

  if (EDUCATION_LEVELS[EducationLevel.HighSchool].includes(classLevel)) {
    return EducationLevel.HighSchool
  }

  if (classLevel === EducationLevel.Undergraduate) {
    return EducationLevel.Undergraduate
  }

  return ''
}

export const getSelectedClassLevel = (draft: Pick<ProgramDraft, 'educationLevel' | 'classLevel'>) =>
  draft.educationLevel === EducationLevel.Undergraduate ? EducationLevel.Undergraduate : draft.classLevel

const getAytTopicsByField = (studyField: ProgramDraft['studyField']) => {
  if (!studyField) {
    return {}
  }

  return AYT_TOPICS_BY_FIELD[studyField as StudyField] ?? {}
}

const getTopicsByExamTrack = (examTrack: ProgramDraft['examTrack']) => {
  if (!examTrack) {
    return {}
  }

  return EXAM_TRACK_TOPICS[examTrack as ExamTrack] ?? {}
}

export const getTopicsBySelection = (selection: {
  educationLevel: ProgramDraft['educationLevel']
  classLevel: string
  examTrack: ProgramDraft['examTrack']
  studyField: ProgramDraft['studyField']
}) => {
  if (selection.educationLevel === EducationLevel.Undergraduate) {
    return getTopicsByExamTrack(selection.examTrack)
  }

  if (selection.classLevel === '12. Sınıf') {
    if (selection.examTrack === ExamTrack.AYT) {
      return getAytTopicsByField(selection.studyField)
    }

    if (selection.examTrack === ExamTrack.TYTAndAYT) {
      const aytTopics = getAytTopicsByField(selection.studyField)
      const merged: TopicMap = {}

      ;[EXAM_TRACK_TOPICS[ExamTrack.TYT], aytTopics].forEach((topicMap) => {
        Object.entries(topicMap).forEach(([lesson, topics]) => {
          merged[lesson] ??= []

          topics.forEach((topic) => {
            if (!merged[lesson].includes(topic)) {
              merged[lesson].push(topic)
            }
          })
        })
      })

      return merged
    }

    return getTopicsByExamTrack(selection.examTrack)
  }

  return CLASS_TOPICS[selection.classLevel] ?? {}
}

export const getTopicsByDraft = (draft: Pick<ProgramDraft, 'educationLevel' | 'classLevel' | 'examTrack' | 'studyField'>) =>
  getTopicsBySelection({
    educationLevel: draft.educationLevel,
    classLevel: draft.classLevel,
    examTrack: draft.examTrack,
    studyField: draft.studyField,
  })

export const getTopicsByStudent = (student: ManagedStudent | null) => {
  if (!student) {
    return {}
  }

  return getTopicsBySelection({
    educationLevel: student.education_level,
    classLevel: student.class_level,
    examTrack: student.exam_track,
    studyField: student.study_field,
  })
}

export const getLessonsByDraft = (draft: Pick<ProgramDraft, 'educationLevel' | 'classLevel' | 'examTrack' | 'studyField'>) =>
  Object.keys(getTopicsByDraft(draft))

export const getTopicsForLesson = (
  draft: Pick<ProgramDraft, 'educationLevel' | 'classLevel' | 'examTrack' | 'studyField'>,
  lesson: string,
) => getTopicsByDraft(draft)[lesson] ?? []

export const buildDraftFromProgramRecord = (program: ProgramRecord) => {
  const normalizedDraft = normalizeDraft(program.draft_json ?? createEmptyDraft())

  if (!normalizedDraft.educationLevel && normalizedDraft.classLevel) {
    normalizedDraft.educationLevel = inferEducationLevel(normalizedDraft.classLevel)
  }

  return normalizedDraft
}

export const buildDraftDays = (start: string, end: string, existingDays: ProgramDay[] = []) => {
  const dates = getDatesInRange(start, end)

  return dates.map((date, index) => ({
    date: toInputDate(date),
    title: formatCardTitle(date),
    rows: existingDays[index]?.rows?.length
      ? existingDays[index].rows.map(normalizeRow)
      : [createEmptyRow(), createEmptyRow(), createEmptyRow()],
  }))
}

export const getShiftedTime = (baseTime: string, offset: number) => {
  const baseIndex = TIME_OPTIONS.indexOf(baseTime)

  if (baseIndex < 0) {
    return ''
  }

  return TIME_OPTIONS[baseIndex + offset] ?? ''
}

export const applySequentialTimesToRows = (rows: ProgramRow[], startTime: string) =>
  rows.map((row, index) => ({
    ...row,
    time: getShiftedTime(startTime, index) || row.time,
  }))

export const getFirstDayTimeTemplate = (days: ProgramDay[]) => days[0]?.rows.map((row) => row.time) ?? []

export const buildWeeklySummary = (days: ProgramDay[]) => {
  const counts = new Map<string, number>()

  days.forEach((day) => {
    day.rows.forEach((row) => {
      if (!row.lesson) {
        return
      }

      counts.set(row.lesson, (counts.get(row.lesson) ?? 0) + 1)
    })
  })

  return Array.from(counts.entries()).map(([lesson, count]) => ({ lesson, count }))
}

export const buildQuestionTrackerRows = (days: ProgramDay[]): QuestionTrackerRow[] => {
  const tracker = new Map<string, QuestionTrackerRow>()

  days.forEach((day) => {
    day.rows.forEach((row) => {
      if (row.method !== 'Soru Çözümü' || !row.lesson || !row.topic) {
        return
      }

      const key = `${row.lesson}||${row.topic}`
      const existing = tracker.get(key)
      const nextQuestionCount = Number(row.questionCount || 0)

      if (existing) {
        existing.questionCount = String(Number(existing.questionCount || 0) + nextQuestionCount)
        return
      }

      tracker.set(key, {
        lesson: row.lesson,
        topic: row.topic,
        questionCount: nextQuestionCount ? String(nextQuestionCount) : '',
      })
    })
  })

  return Array.from(tracker.values())
}

export const validateSetupDraft = (draft: ProgramDraft, skipEducationCheck = false) => {
  const selectedProgramLevel = getSelectedClassLevel(draft)

  if (skipEducationCheck) {
    if (!draft.start || !draft.end) {
      return 'Lütfen başlangıç ve bitiş tarihlerini seçin.'
    }
  } else {
    if (!draft.educationLevel || !selectedProgramLevel || !draft.start || !draft.end) {
      return 'Lütfen tüm alanları doldurun.'
    }

    if (draft.educationLevel === EducationLevel.Undergraduate && !draft.examTrack) {
      return 'Lütfen sınav seçimini yapın.'
    }

    if (draft.classLevel === '12. Sınıf' && !draft.examTrack) {
      return 'Lütfen 12. sınıf alanını seçin.'
    }

    if (
      draft.classLevel === '12. Sınıf'
      && (draft.examTrack === ExamTrack.AYT || draft.examTrack === ExamTrack.TYTAndAYT)
      && !draft.studyField
    ) {
      return 'Lütfen alan seçimini yapın.'
    }
  }

  if (draft.start > draft.end) {
    return 'Başlangıç tarihi bitiş tarihinden sonra olamaz.'
  }

  return ''
}

export const sortProgramsByCoveredDates = (programs: ProgramRecord[]) =>
  [...programs].sort((left, right) => {
    const leftStart = String(left.start_date || '')
    const rightStart = String(right.start_date || '')

    if (leftStart !== rightStart) {
      return rightStart.localeCompare(leftStart)
    }

    const leftEnd = String(left.end_date || '')
    const rightEnd = String(right.end_date || '')

    if (leftEnd !== rightEnd) {
      return rightEnd.localeCompare(leftEnd)
    }

    return String(right.created_at || '').localeCompare(String(left.created_at || ''))
  })
