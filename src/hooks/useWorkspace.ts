import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { Session } from '@supabase/supabase-js'

import { buildDetailedTopicProgress, getTopicOverrideKey } from '../lib/analysis'
import { buildDraftFromProgramRecord, sortProgramsByCoveredDates } from '../lib/program'
import {
  createManagedStudentAccount,
  deleteManagedStudentSafely,
  deleteStudyProgram,
  ensureStudentRow,
  getManagedStudentsFromSession,
  getStudentUsernameFromEmail,
  listStudyProgramsForStudent,
  listStudyProgramsForTeacher,
  loadLinkedTeachers,
  loadManagedStudents,
  loadTeacherTopicProgressOverrides,
  saveStudyProgram,
  saveTeacherTopicProgress,
} from '../lib/supabase'
import {
  AppStep,
  EducationLevel,
  SaveFeedbackType,
  UserRole,
  type ManagedStudent,
  type ManagedStudentCreateForm,
  type Profile,
  type ProgramDraft,
  type ProgramRecord,
  type SaveFeedback,
  type TopicProgressOverride,
} from '../types'

const EMPTY_MANAGED_STUDENT_FORM: ManagedStudentCreateForm = {
  fullName: '',
  schoolName: '',
  educationLevel: '',
  classLevel: '',
  examTrack: '',
  studyField: '',
  password: '',
}

const sortStudentsByName = (students: ManagedStudent[]) =>
  [...students].sort((left, right) => (left.full_name || '').localeCompare(right.full_name || '', 'tr'))

const getTeacherStudentsStorageKey = (profileId: string) => (profileId ? `teacher_students_cache_${profileId}` : '')

const readManagedStudentsFromLocalCache = (profileId: string) => {
  const key = getTeacherStudentsStorageKey(profileId)

  if (!key) {
    return []
  }

  try {
    const raw = localStorage.getItem(key)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as ManagedStudent[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const persistManagedStudentsToLocalCache = (profileId: string, students: ManagedStudent[]) => {
  const key = getTeacherStudentsStorageKey(profileId)

  if (!key) {
    return
  }

  localStorage.setItem(key, JSON.stringify(students))
}

interface UseWorkspaceArgs {
  currentProfile: Profile | null
  currentSession: Session | null
  draft: ProgramDraft
  setDraft: Dispatch<SetStateAction<ProgramDraft>>
  hydrateDraft: (draft: ProgramDraft) => void
  setStatusText: Dispatch<SetStateAction<string>>
  setStep: Dispatch<SetStateAction<AppStep>>
}

export function useWorkspace({
  currentProfile,
  currentSession,
  draft,
  setDraft,
  hydrateDraft,
  setStatusText,
  setStep,
}: UseWorkspaceArgs) {
  const [linkedStudents, setLinkedStudents] = useState<ManagedStudent[]>([])
  const [linkedTeachers, setLinkedTeachers] = useState<Profile[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [teacherPrograms, setTeacherPrograms] = useState<ProgramRecord[]>([])
  const [studentPrograms, setStudentPrograms] = useState<ProgramRecord[]>([])

  const [currentEditingProgramId, setCurrentEditingProgramId] = useState('')
  const [topicOverrides, setTopicOverrides] = useState<Record<string, TopicProgressOverride>>({})
  const [analysisSelectedLesson, setAnalysisSelectedLesson] = useState('')
  const [analysisReturnStep, setAnalysisReturnStep] = useState<AppStep>(AppStep.Editor)

  const [managedStudentForm, setManagedStudentForm] = useState<ManagedStudentCreateForm>(EMPTY_MANAGED_STUDENT_FORM)
  const [managedStudentMessage, setManagedStudentMessage] = useState<SaveFeedback | null>(null)
  const [showSelectedStudentPrograms, setShowSelectedStudentPrograms] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null)
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [busyLabel, setBusyLabel] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const selectedStudentIdRef = useRef('')
  const busyCountRef = useRef(0)

  useEffect(() => {
    selectedStudentIdRef.current = selectedStudentId
  }, [selectedStudentId])

  const selectedStudent = useMemo(
    () => linkedStudents.find((item) => item.id === selectedStudentId) ?? null,
    [linkedStudents, selectedStudentId],
  )

  const sortedTeacherPrograms = useMemo(
    () => sortProgramsByCoveredDates(teacherPrograms),
    [teacherPrograms],
  )

  const sortedStudentPrograms = useMemo(
    () => sortProgramsByCoveredDates(studentPrograms),
    [studentPrograms],
  )

  const analysisLessons = useMemo(
    () => buildDetailedTopicProgress(selectedStudent, teacherPrograms, topicOverrides),
    [selectedStudent, teacherPrograms, topicOverrides],
  )

  const analysisEmptyMessage = !selectedStudent
    ? 'Analizi görmek için önce kayıtlı bir öğrenci seçin.'
    : teacherPrograms.length
      ? 'Filtreye uygun konu bulunamadı.'
      : `${selectedStudent.full_name || 'Öğrenci'} için henüz kayıtlı program yok. İlk kayıttan sonra ders ders ilerleme burada görünecek.`

  const clearProgramFeedback = useCallback(() => {
    setSaveFeedback(null)
  }, [])

  const runWorkspaceTask = useCallback(async <T,>(label: string, task: () => Promise<T>) => {
    busyCountRef.current += 1
    setBusyLabel(label)
    setIsBusy(true)

    try {
      return await task()
    } finally {
      busyCountRef.current = Math.max(0, busyCountRef.current - 1)

      if (busyCountRef.current === 0) {
        setIsBusy(false)
        setBusyLabel('')
      }
    }
  }, [])

  const openProgramRecord = useCallback((program: ProgramRecord, keepProgramId: boolean) => {
    if (!program.draft_json) {
      return
    }

    hydrateDraft(buildDraftFromProgramRecord(program))
    setCurrentEditingProgramId(keepProgramId ? program.id : '')
    setSaveFeedback(null)
    setStep(AppStep.Editor)
  }, [hydrateDraft, setStep])

  const syncTeacherSelection = useCallback(async (
    studentId: string,
    students: ManagedStudent[],
    session: Session | null,
  ) => {
    setSelectedStudentId(studentId)
    setCurrentEditingProgramId('')
    setTopicOverrides({})
    setAnalysisSelectedLesson('')
    setShowSelectedStudentPrograms(false)
    setSaveFeedback(null)

    const student = students.find((item) => item.id === studentId) ?? null

    if (!student) {
      setTeacherPrograms([])
      return
    }

    setDraft((current) => ({
      ...current,
      student: student.full_name || '',
      educationLevel: student.education_level || '',
      classLevel: student.education_level === EducationLevel.Undergraduate ? '' : student.class_level || '',
      examTrack: student.exam_track || '',
      studyField: student.study_field || '',
    }))

    if (!session) {
      setTeacherPrograms([])
      return
    }

    const [programs, overrides] = await runWorkspaceTask('Ogrenci verileri yukleniyor...', async () => Promise.all([
      listStudyProgramsForTeacher(student.id, session),
      loadTeacherTopicProgressOverrides(student.id, session),
    ]))

    setTeacherPrograms(programs)
    setTopicOverrides(overrides)
  }, [runWorkspaceTask, setDraft])

  useEffect(() => {
    let isCancelled = false

    const bootstrapWorkspace = async () => {
      if (!currentProfile || !currentSession) {
        setLinkedStudents([])
        setLinkedTeachers([])
        setTeacherPrograms([])
        setStudentPrograms([])
        setSelectedStudentId('')
        setCurrentEditingProgramId('')
        setTopicOverrides({})
        setAnalysisSelectedLesson('')
        setShowSelectedStudentPrograms(false)
        setSaveFeedback(null)
        setManagedStudentMessage(null)
        setStudentsLoading(false)
        return
      }

      if (currentProfile.role === UserRole.Teacher) {
        setDraft((current) => ({
          ...current,
          teacher: current.teacher || currentProfile.full_name || '',
        }))

        setStudentsLoading(true)
        const remoteStudents = await loadManagedStudents(currentProfile.id, currentSession)
        const sessionStudents = getManagedStudentsFromSession(currentSession)
        const cachedStudents = readManagedStudentsFromLocalCache(currentProfile.id)
        const nextStudents = sortStudentsByName(
          remoteStudents ?? (sessionStudents.length ? sessionStudents : cachedStudents),
        )

        if (isCancelled) {
          return
        }

        setLinkedStudents(nextStudents)
        setLinkedTeachers([])
        setStudentPrograms([])
        setStudentsLoading(false)
        persistManagedStudentsToLocalCache(currentProfile.id, nextStudents)

        const nextSelectedId = nextStudents.some((item) => item.id === selectedStudentIdRef.current)
          ? selectedStudentIdRef.current
          : nextStudents[0]?.id ?? ''

        await syncTeacherSelection(nextSelectedId, nextStudents, currentSession)
        return
      }

      setLinkedStudents([])
      setTeacherPrograms([])
      setSelectedStudentId('')
      setStudentsLoading(true)
      setDraft((current) => ({
        ...current,
        student: current.student || currentProfile.full_name || '',
      }))

      const studentRow = await ensureStudentRow(currentProfile.id)
      let nextLinkedTeachers = studentRow ? await loadLinkedTeachers(studentRow.id) : []

      if (!nextLinkedTeachers.length) {
        const metadata = (currentSession.user.user_metadata ?? {}) as Record<string, string>

        if (metadata.teacher_name || metadata.teacher_id) {
          nextLinkedTeachers = [{
            id: metadata.teacher_id || 'teacher-fallback',
            full_name: metadata.teacher_name || 'Öğretmen',
            email: '',
            role: UserRole.Teacher,
          }]
        }
      }

      const programs = await listStudyProgramsForStudent(currentSession)

      if (isCancelled) {
        return
      }

      setLinkedTeachers(nextLinkedTeachers)
      setStudentPrograms(programs)
      setStudentsLoading(false)
    }

    void bootstrapWorkspace()

    return () => {
      isCancelled = true
    }
  }, [currentProfile, currentSession, hydrateDraft, setDraft, setStep, syncTeacherSelection])

  const changeTeacherStudent = useCallback(async (studentId: string) => {
    await syncTeacherSelection(studentId, linkedStudents, currentSession)
  }, [currentSession, linkedStudents, syncTeacherSelection])

  const toggleSelectedStudentPrograms = useCallback(async () => {
    if (!selectedStudent) {
      setManagedStudentMessage({ type: SaveFeedbackType.Error, message: 'Önce kayıtlı bir öğrenci seçiniz.' })
      return
    }

    if (!showSelectedStudentPrograms && currentSession) {
      const programs = await runWorkspaceTask('Programlar yukleniyor...', async () => (
        listStudyProgramsForTeacher(selectedStudent.id, currentSession)
      ))
      setTeacherPrograms(programs)
    }

    setShowSelectedStudentPrograms((current) => !current)
  }, [currentSession, runWorkspaceTask, selectedStudent, showSelectedStudentPrograms])

  const saveProgram = useCallback(async () => {
    setSaveFeedback(null)

    if (!currentProfile || currentProfile.role !== UserRole.Teacher) {
      setSaveFeedback({ type: SaveFeedbackType.Success, message: 'Program taslağı bu cihazda kaydedildi.' })
      setStatusText('Program taslağı kaydedildi.')
      return
    }

    if (!selectedStudent) {
      setSaveFeedback({ type: SaveFeedbackType.Error, message: 'Önce kayıtlı bir öğrenci seçiniz.' })
      setStatusText('Önce kayıtlı bir öğrenci seçiniz.')
      return
    }

    if (!currentSession) {
      setSaveFeedback({ type: SaveFeedbackType.Error, message: 'Program kaydedilemedi: oturum bulunamadı.' })
      setStatusText('Program kaydedilemedi: oturum bulunamadı.')
      return
    }

    try {
      const result = await runWorkspaceTask('Program kaydediliyor...', async () => saveStudyProgram({
        session: currentSession,
        currentEditingProgramId,
        selectedStudent,
        currentProfile,
        draft,
      }))

      setCurrentEditingProgramId(result.program?.id ?? currentEditingProgramId)
      setSaveFeedback({
        type: SaveFeedbackType.Success,
        message: result.mode === 'updated' ? 'Program güncellendi.' : 'Program veritabanına kaydedildi.',
      })
      setStatusText(result.mode === 'updated' ? 'Program güncellendi.' : 'Program veritabanına kaydedildi.')

      const programs = await runWorkspaceTask('Program listesi yenileniyor...', async () => (
        listStudyProgramsForTeacher(selectedStudent.id, currentSession)
      ))
      setTeacherPrograms(programs)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Program kaydedilemedi.'
      setSaveFeedback({ type: SaveFeedbackType.Error, message })
      setStatusText(message)
    }
  }, [currentEditingProgramId, currentProfile, currentSession, draft, runWorkspaceTask, selectedStudent, setStatusText])

  const openAnalysis = useCallback(async (fromStep: AppStep) => {
    if (!currentProfile || currentProfile.role !== UserRole.Teacher) {
      return
    }

    if (!selectedStudent) {
      setStatusText('Analizi görmek için önce kayıtlı bir öğrenci seçin.')
      return
    }

    if (currentSession) {
      const [programs, overrides] = await runWorkspaceTask('Analiz verileri yukleniyor...', async () => Promise.all([
        listStudyProgramsForTeacher(selectedStudent.id, currentSession),
        loadTeacherTopicProgressOverrides(selectedStudent.id, currentSession),
      ]))

      setTeacherPrograms(programs)
      setTopicOverrides(overrides)
    }

    setAnalysisReturnStep(fromStep)
    setStep(AppStep.Analysis)
  }, [currentProfile, currentSession, runWorkspaceTask, selectedStudent, setStatusText, setStep])

  const saveAnalysis = useCallback(async () => {
    if (!selectedStudent || !currentSession) {
      setStatusText('Analiz kaydedilemedi: öğrenci veya oturum bulunamadı.')
      return
    }

    try {
      const overrides = await runWorkspaceTask('Analiz kaydediliyor...', async () => (
        saveTeacherTopicProgress(selectedStudent.id, topicOverrides, currentSession)
      ))
      setTopicOverrides(overrides)
      setStatusText('Analiz kaydedildi.')
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Analiz kaydedilemedi.')
    }
  }, [currentSession, runWorkspaceTask, selectedStudent, setStatusText, topicOverrides])

  const deleteProgram = useCallback(async (programId: string) => {
    if (!currentSession) {
      setStatusText('Program silinemedi: oturum bulunamadı.')
      return
    }

    const confirmed = window.confirm('Bu kayıtlı program silinsin mi? Bu işlem analizleri de günceller.')

    if (!confirmed) {
      return
    }

    try {
      await runWorkspaceTask('Program siliniyor...', async () => {
        await deleteStudyProgram(programId, currentSession)
      })
      setTeacherPrograms((current) => current.filter((item) => item.id !== programId))
      setStudentPrograms((current) => current.filter((item) => item.id !== programId))

      if (currentEditingProgramId === programId) {
        setCurrentEditingProgramId('')
      }

      setStatusText('Program silindi. Analiz güncellendi.')
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Program silinemedi.')
    }
  }, [currentEditingProgramId, currentSession, runWorkspaceTask, setStatusText])

  const createManagedStudent = useCallback(async () => {
    if (!currentProfile || currentProfile.role !== UserRole.Teacher || !currentSession) {
      return
    }

    setManagedStudentMessage(null)

    if (!managedStudentForm.fullName) {
      setManagedStudentMessage({ type: SaveFeedbackType.Error, message: 'Öğrencinin ad soyad bilgisi zorunludur.' })
      return
    }

    if (!managedStudentForm.educationLevel) {
      setManagedStudentMessage({ type: SaveFeedbackType.Error, message: 'Öğrenci için kademe seçiniz.' })
      return
    }

    if (managedStudentForm.educationLevel !== EducationLevel.Undergraduate && !managedStudentForm.classLevel) {
      setManagedStudentMessage({ type: SaveFeedbackType.Error, message: 'Ortaokul ve lise öğrencileri için sınıf seçiniz.' })
      return
    }

    if (managedStudentForm.educationLevel === EducationLevel.Undergraduate && !managedStudentForm.examTrack) {
      setManagedStudentMessage({ type: SaveFeedbackType.Error, message: 'Lisans öğrencisi için sınav seçiniz.' })
      return
    }

    if (!managedStudentForm.password || managedStudentForm.password.length < 6) {
      setManagedStudentMessage({ type: SaveFeedbackType.Error, message: 'Şifre en az 6 karakter olmalıdır.' })
      return
    }

    try {
      const result = await runWorkspaceTask('Ogrenci hesabi olusturuluyor...', async () => createManagedStudentAccount({
        teacherProfileId: currentProfile.id,
        session: currentSession,
        schoolName: managedStudentForm.schoolName,
        fullName: managedStudentForm.fullName,
        educationLevel: managedStudentForm.educationLevel,
        classLevel: managedStudentForm.classLevel,
        examTrack: managedStudentForm.examTrack,
        studyField: managedStudentForm.studyField,
        password: managedStudentForm.password,
      }))

      const refreshedStudents = !result.student && !result.managedStudents.length
        ? await runWorkspaceTask('Ogrenci listesi yenileniyor...', async () => (
          loadManagedStudents(currentProfile.id, currentSession)
        ))
        : null
      const remoteStudents = result.managedStudents.length
        ? result.managedStudents
        : refreshedStudents ?? linkedStudents
      const nextStudents = sortStudentsByName(
        result.student
          ? [...remoteStudents.filter((item) => item.id !== result.student?.id), result.student]
          : remoteStudents,
      )

      setManagedStudentForm(EMPTY_MANAGED_STUDENT_FORM)
      setManagedStudentMessage({
        type: SaveFeedbackType.Success,
        message: `Öğrenci oluşturuldu. Kullanıcı adı: ${result.username}`,
      })
      setLinkedStudents(nextStudents)
      persistManagedStudentsToLocalCache(currentProfile.id, nextStudents)

      if (!selectedStudentIdRef.current && nextStudents[0]) {
        await syncTeacherSelection(nextStudents[0].id, nextStudents, currentSession)
      }
    } catch (error) {
      setManagedStudentMessage({
        type: SaveFeedbackType.Error,
        message: error instanceof Error ? error.message : 'Öğrenci hesabı oluşturulamadı.',
      })
    }
  }, [currentProfile, currentSession, linkedStudents, managedStudentForm, runWorkspaceTask, syncTeacherSelection])

  const deleteSelectedStudent = useCallback(async (studentId?: string) => {
    if (!currentSession || !currentProfile) {
      setManagedStudentMessage({ type: SaveFeedbackType.Error, message: 'Silmek için önce kayıtlı bir öğrenci seçiniz.' })
      return
    }

    const studentToDelete = linkedStudents.find((item) => item.id === (studentId || selectedStudent?.id)) ?? selectedStudent

    if (!studentToDelete) {
      setManagedStudentMessage({ type: SaveFeedbackType.Error, message: 'Silmek için önce kayıtlı bir öğrenci seçiniz.' })
      return
    }

    const confirmed = window.confirm(
      `${studentToDelete.full_name || 'Bu öğrenci'} kalıcı olarak silinsin mi? Bu işlem öğrencinin hesabını, programlarını, analiz kayıtlarını ve tüm bağlı verilerini tamamen kaldırır.`,
    )

    if (!confirmed) {
      return
    }

    try {
      const managedStudents = await runWorkspaceTask('Ogrenci siliniyor...', async () => (
        deleteManagedStudentSafely(studentToDelete.id, currentSession)
      ))
      const nextStudents = sortStudentsByName(
        managedStudents.length
          ? managedStudents
          : linkedStudents.filter((item) => item.id !== studentToDelete.id),
      )
      const nextSelectedId = nextStudents[0]?.id ?? ''

      setManagedStudentMessage({ type: SaveFeedbackType.Success, message: 'Öğrenci kalıcı olarak silindi.' })
      setLinkedStudents(nextStudents)
      setTeacherPrograms([])
      setTopicOverrides({})
      setCurrentEditingProgramId('')
      persistManagedStudentsToLocalCache(currentProfile.id, nextStudents)
      await syncTeacherSelection(nextSelectedId, nextStudents, currentSession)
    } catch (error) {
      setManagedStudentMessage({
        type: SaveFeedbackType.Error,
        message: error instanceof Error ? error.message : 'Öğrenci silinemedi.',
      })
    }
  }, [currentProfile, currentSession, linkedStudents, runWorkspaceTask, selectedStudent, syncTeacherSelection])

  const openTeacherProgram = useCallback((programId: string) => {
    const program = teacherPrograms.find((item) => item.id === programId)

    if (program) {
      openProgramRecord(program, false)
    }
  }, [openProgramRecord, teacherPrograms])

  const editTeacherProgram = useCallback((programId: string) => {
    const program = teacherPrograms.find((item) => item.id === programId)

    if (program) {
      openProgramRecord(program, true)
    }
  }, [openProgramRecord, teacherPrograms])

  const openStudentProgram = useCallback((programId: string) => {
    const program = studentPrograms.find((item) => item.id === programId)

    if (program) {
      openProgramRecord(program, false)
    }
  }, [openProgramRecord, studentPrograms])

  const toggleTopicCompletion = useCallback((lesson: string, topic: string, checked: boolean) => {
    setTopicOverrides((current) => {
      const key = getTopicOverrideKey(lesson, topic)
      const nextOverrides = { ...current }

      if (checked) {
        nextOverrides[key] = {
          lesson,
          topic,
          is_completed: true,
          updated_at: new Date().toISOString(),
        }
      } else {
        delete nextOverrides[key]
      }

      return nextOverrides
    })
  }, [])

  const resetWorkspaceState = useCallback(() => {
    setCurrentEditingProgramId('')
    setTopicOverrides({})
    setAnalysisSelectedLesson('')
    setShowSelectedStudentPrograms(false)
    setSaveFeedback(null)
  }, [])

  const resetManagedStudentForm = useCallback(() => {
    setManagedStudentForm(EMPTY_MANAGED_STUDENT_FORM)
    setManagedStudentMessage(null)
  }, [])

  const loadStudentPrograms = useCallback(async (studentId: string): Promise<ProgramRecord[]> => {
    if (!currentSession) return []
    return listStudyProgramsForTeacher(studentId, currentSession)
  }, [currentSession])

  return {
    linkedStudents,
    studentsLoading,
    linkedTeachers,
    selectedStudentId,
    selectedStudent,
    teacherPrograms,
    studentPrograms,
    sortedTeacherPrograms,
    sortedStudentPrograms,
    currentEditingProgramId,
    analysisLessons,
    analysisSelectedLesson,
    analysisReturnStep,
    analysisEmptyMessage,
    managedStudentForm,
    managedStudentMessage,
    showSelectedStudentPrograms,
    saveFeedback,
    isBusy,
    busyLabel,
    setManagedStudentForm,
    setAnalysisSelectedLesson,
    clearProgramFeedback,
    changeTeacherStudent,
    toggleSelectedStudentPrograms,
    saveProgram,
    openAnalysis,
    saveAnalysis,
    deleteProgram,
    createManagedStudent,
    deleteSelectedStudent,
    openTeacherProgram,
    editTeacherProgram,
    openStudentProgram,
    toggleTopicCompletion,
    resetWorkspaceState,
    resetManagedStudentForm,
    loadStudentPrograms,
    getStudentUsernameFromEmail,
  }
}
