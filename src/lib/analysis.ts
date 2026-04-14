import { formatDateOnlyTR } from './date'
import { STUDY_METHODS, getTopicsByStudent } from './program'
import type {
  LessonProgressEntry,
  ManagedStudent,
  ProgramRecord,
  TopicProgressOverride,
} from '../types'

export const ANALYSIS_PROGRESS_METHOD_TARGET = 3

export const getTopicOverrideKey = (lesson: string, topic: string) => `${lesson}||${topic}`

const collectRowsFromPrograms = (programs: ProgramRecord[]) => {
  const rows: Array<{
    lesson: string
    topic: string
    method: string
    questionCount: number
    createdAt: string
  }> = []

  programs.forEach((program) => {
    const days = Array.isArray(program.draft_json?.days) ? program.draft_json.days : []

    days.forEach((day) => {
      day.rows.forEach((row) => {
        if (!row.lesson || !row.topic) {
          return
        }

        rows.push({
          lesson: row.lesson,
          topic: row.topic,
          method: row.method,
          questionCount: Number(row.questionCount || 0),
          createdAt: program.created_at || '',
        })
      })
    })
  })

  return rows
}

export const buildDetailedTopicProgress = (
  student: ManagedStudent | null,
  programs: ProgramRecord[],
  overrides: Record<string, TopicProgressOverride>,
) => {
  const syllabus = getTopicsByStudent(student)
  const rows = collectRowsFromPrograms(programs)
  const lessonMap: Record<string, LessonProgressEntry> = {}

  Object.entries(syllabus).forEach(([lesson, topics]) => {
    lessonMap[lesson] = {
      lesson,
      topics: topics.map((topic) => ({
        topic,
        methods: Object.fromEntries(STUDY_METHODS.map((method) => [method, 0])),
        questionTotal: 0,
        studyCount: 0,
        lastWorkedAt: '',
        progressRate: 0,
        isCompleted: false,
      })),
      lessonRate: 0,
      completedTopicCount: 0,
      totalQuestionCount: 0,
    }
  })

  const ensureTopicEntry = (lesson: string, topic: string) => {
    lessonMap[lesson] ??= {
      lesson,
      topics: [],
      lessonRate: 0,
      completedTopicCount: 0,
      totalQuestionCount: 0,
    }

    let existing = lessonMap[lesson].topics.find((item) => item.topic === topic)

    if (!existing) {
      existing = {
        topic,
        methods: Object.fromEntries(STUDY_METHODS.map((method) => [method, 0])),
        questionTotal: 0,
        studyCount: 0,
        lastWorkedAt: '',
        progressRate: 0,
        isCompleted: false,
      }

      lessonMap[lesson].topics.push(existing)
    }

    return existing
  }

  rows.forEach((row) => {
    const topicEntry = ensureTopicEntry(row.lesson, row.topic)
    topicEntry.studyCount += 1
    topicEntry.questionTotal += row.questionCount

    if (row.method && Object.hasOwn(topicEntry.methods, row.method)) {
      topicEntry.methods[row.method] += 1
    }

    if (row.createdAt && (!topicEntry.lastWorkedAt || row.createdAt > topicEntry.lastWorkedAt)) {
      topicEntry.lastWorkedAt = row.createdAt
    }
  })

  return Object.values(lessonMap)
    .map((lessonEntry) => {
      lessonEntry.topics = lessonEntry.topics
        .map((topicEntry) => {
          const activeMethods = STUDY_METHODS.filter((method) => topicEntry.methods[method] > 0).length
          const override = overrides[getTopicOverrideKey(lessonEntry.lesson, topicEntry.topic)]

          topicEntry.isCompleted = Boolean(override?.is_completed)
          topicEntry.progressRate = topicEntry.isCompleted
            ? 100
            : Math.round(
                (Math.min(activeMethods, ANALYSIS_PROGRESS_METHOD_TARGET)
                  / ANALYSIS_PROGRESS_METHOD_TARGET)
                  * 100,
              )

          return topicEntry
        })
        .sort((left, right) => {
          if (right.progressRate !== left.progressRate) {
            return right.progressRate - left.progressRate
          }

          return left.topic.localeCompare(right.topic, 'tr')
        })

      lessonEntry.lessonRate = lessonEntry.topics.length
        ? Math.round(
            lessonEntry.topics.reduce((sum, topicEntry) => sum + topicEntry.progressRate, 0)
              / lessonEntry.topics.length,
          )
        : 0
      lessonEntry.completedTopicCount = lessonEntry.topics.filter((topicEntry) => topicEntry.progressRate > 0).length
      lessonEntry.totalQuestionCount = lessonEntry.topics.reduce((sum, topicEntry) => sum + topicEntry.questionTotal, 0)

      return lessonEntry
    })
    .sort((left, right) => {
      if (right.lessonRate !== left.lessonRate) {
        return right.lessonRate - left.lessonRate
      }

      return left.lesson.localeCompare(right.lesson, 'tr')
    })
}

export const buildAnalysisMeta = (student: ManagedStudent, selectedLesson: string) => {
  const levelLabel = student.education_level === 'Lisans'
    ? `${student.exam_track || 'Lisans'} düzeyi`
    : [student.class_level, student.education_level].filter(Boolean).join(' / ') || 'Öğrenci düzeyi'

  return `${student.full_name || 'Öğrenci'} için ${levelLabel} bazında ${
    selectedLesson ? `"${selectedLesson}" dersi` : 'tüm dersler'
  } listeleniyor. Herhangi 3 farklı çalışma yöntemi görüldüğünde konu %100 olur; isterseniz ayrıca elle bitti işaretleyip kaydedebilirsiniz.`
}

export const formatAnalysisDate = (value: string) => formatDateOnlyTR(value) || 'Henüz yok'
