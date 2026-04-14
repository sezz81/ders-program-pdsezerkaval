import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'

import {
  CREATE_STUDENT_FUNCTION,
  DELETE_STUDENT_FUNCTION,
  DELETE_STUDY_PROGRAM_FUNCTION,
  LIST_MANAGED_STUDENTS_FUNCTION,
  LIST_STUDENT_TOPIC_PROGRESS_FUNCTION,
  LIST_STUDY_PROGRAMS_FUNCTION,
  MANAGED_STUDENT_DOMAIN,
  SAVE_STUDENT_TOPIC_PROGRESS_FUNCTION,
  SAVE_STUDY_PROGRAM_FUNCTION,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from '../data/legacy'
import type {
  ManagedStudent,
  ProgramDraft,
  ProgramRecord,
  Profile,
  StudentRow,
  TopicProgressOverride,
} from '../types'
import { UserRole } from '../types'

let supabaseClient: SupabaseClient | null = null

const parseJsonResponse = async <T,>(response: Response) => {
  const rawText = await response.text()

  if (!rawText) {
    return {} as T
  }

  return JSON.parse(rawText) as T
}

const normalizeManagedStudent = (item: Partial<ManagedStudent> | null | undefined): ManagedStudent | null => {
  if (!item?.id) {
    return null
  }

  return {
    id: item.id,
    profile_id: item.profile_id ?? '',
    full_name: item.full_name ?? item.email ?? 'Öğrenci',
    email: item.email ?? '',
    school_name: item.school_name ?? '',
    education_level: item.education_level ?? '',
    class_level: item.class_level ?? '',
    exam_track: item.exam_track ?? '',
    study_field: item.study_field ?? '',
  }
}

export const isSupabaseConfigured = () =>
  Boolean(
    SUPABASE_URL
    && SUPABASE_URL.includes('supabase.co')
    && SUPABASE_ANON_KEY
    && !SUPABASE_URL.includes('BURAYA_')
    && !SUPABASE_ANON_KEY.includes('BURAYA_'),
  )

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }

  return supabaseClient
}

export const waitForActiveSession = async (client = getSupabaseClient()) => {
  if (!client) {
    return null
  }

  for (let index = 0; index < 8; index += 1) {
    const sessionResult = await client.auth.getSession()
    const session = sessionResult.data.session

    if (session?.user) {
      return session
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 150)
    })
  }

  return null
}

export const buildStudentAuthEmailCandidates = (identity: string) => {
  const raw = identity.trim().toLowerCase()

  if (!raw) {
    return []
  }

  if (raw.includes('@')) {
    return [raw]
  }

  return Array.from(new Set([`${raw}@${MANAGED_STUDENT_DOMAIN}`, `${raw}@ogrenci.local`]))
}

export const getStudentUsernameFromEmail = (email: string) => {
  const raw = email.trim().toLowerCase()
  const suffix = `@${MANAGED_STUDENT_DOMAIN}`

  return raw.endsWith(suffix) ? raw.slice(0, -suffix.length) : ''
}

export const signInWithRole = async (role: UserRole, identity: string, password: string) => {
  const client = getSupabaseClient()

  if (!client) {
    throw new Error('Supabase bağlantısı kurulamadı.')
  }

  if (role === UserRole.Student) {
    const candidates = buildStudentAuthEmailCandidates(identity)
    let lastError = 'Invalid login credentials'

    for (const candidate of candidates) {
      const signInResult = await client.auth.signInWithPassword({ email: candidate, password })

      if (!signInResult.error) {
        return signInResult.data.session ?? waitForActiveSession(client)
      }

      lastError = signInResult.error.message
    }

    throw new Error(lastError)
  }

  const signInResult = await client.auth.signInWithPassword({ email: identity.trim().toLowerCase(), password })

  if (signInResult.error) {
    throw new Error(signInResult.error.message)
  }

  return signInResult.data.session ?? waitForActiveSession(client)
}

export const signUpTeacher = async (fullName: string, email: string, password: string) => {
  const client = getSupabaseClient()

  if (!client) {
    throw new Error('Supabase bağlantısı kurulamadı.')
  }

  const signupResult = await client.auth.signUp({
    email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
            role: UserRole.Teacher,
          },
        },
      })

  if (signupResult.error) {
    throw new Error(signupResult.error.message)
  }
}

export const signOutFromSupabase = async () => {
  const client = getSupabaseClient()

  if (!client) {
    return
  }

  await client.auth.signOut()
}

export const getCurrentSession = async () => {
  const client = getSupabaseClient()

  if (!client) {
    return null
  }

  const sessionResult = await client.auth.getSession()
  return sessionResult.data.session
}

export const getProfileFromSession = async (session: Session) => {
  const client = getSupabaseClient()

  if (!client) {
    return null
  }

  const profileResult = await client.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
  const metadata = (session.user.user_metadata ?? {}) as Record<string, string>

  return (profileResult.data as Profile | null) ?? {
    id: session.user.id,
    full_name: metadata.full_name ?? session.user.email ?? 'Kullanıcı',
    email: session.user.email ?? '',
    role: (metadata.role as UserRole) ?? UserRole.Teacher,
  }
}

export const ensureProfileRow = async (session: Session, profile: Profile) => {
  const client = getSupabaseClient()

  if (!client) {
    return profile
  }

  const upsertResult = await client
    .from('profiles')
    .upsert({
      id: session.user.id,
      full_name: profile.full_name,
      email: session.user.email ?? profile.email,
      role: profile.role,
    })
    .select('*')
    .maybeSingle()

  return (upsertResult.data as Profile | null) ?? profile
}

export const ensureStudentRow = async (profileId: string) => {
  const client = getSupabaseClient()

  if (!client) {
    return null
  }

  const studentResult = await client.from('students').select('*').eq('profile_id', profileId).maybeSingle()
  return (studentResult.data as StudentRow | null) ?? null
}

export const getManagedStudentsFromSession = (session: Session | null) => {
  const metadata = ((session?.user.user_metadata ?? {}) as { managed_students?: unknown }).managed_students

  if (!Array.isArray(metadata)) {
    return []
  }

  return metadata
    .map((item) => normalizeManagedStudent(item as Partial<ManagedStudent>))
    .filter((item): item is ManagedStudent => Boolean(item))
}

export const loadLinkedTeachers = async (studentId: string) => {
  const client = getSupabaseClient()

  if (!client || !studentId) {
    return []
  }

  const linksResult = await client.from('teacher_students').select('teacher_id').eq('student_id', studentId)

  if (linksResult.error || !linksResult.data?.length) {
    return []
  }

  const teacherIds = linksResult.data.map((item) => item.teacher_id)
  const profilesResult = await client.from('profiles').select('id, full_name, email, role').in('id', teacherIds)

  return (profilesResult.data as Profile[] | null) ?? []
}

const loadManagedStudentsFromFunction = async (session: Session) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${LIST_MANAGED_STUDENTS_FUNCTION}`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'x-teacher-token': session.access_token,
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  const payload = await parseJsonResponse<{ students?: ManagedStudent[]; error?: string }>(response)

  if (!response.ok || !Array.isArray(payload.students)) {
    return null
  }

  return payload.students
    .map((item) => normalizeManagedStudent(item))
    .filter((item): item is ManagedStudent => Boolean(item))
}

export const loadManagedStudents = async (teacherProfileId: string, session: Session) => {
  const client = getSupabaseClient()

  if (!client || !teacherProfileId) {
    return null
  }

  try {
    const functionStudents = await loadManagedStudentsFromFunction(session)

    if (functionStudents) {
      return functionStudents
    }
  } catch {
    // Fallback to direct tables below.
  }

  const linksResult = await client.from('teacher_students').select('student_id').eq('teacher_id', teacherProfileId)

  if (linksResult.error) {
    return null
  }

  if (!linksResult.data?.length) {
    return []
  }

  const studentIds = linksResult.data.map((item) => item.student_id)
  const studentsResult = await client
    .from('students')
    .select('id, profile_id, school_name, education_level, class_level, exam_track, study_field')
    .in('id', studentIds)

  if (studentsResult.error || !studentsResult.data) {
    return null
  }

  const profileIds = studentsResult.data.map((item) => item.profile_id).filter(Boolean)
  const profilesResult = profileIds.length
    ? await client.from('profiles').select('id, full_name, email').in('id', profileIds)
    : { data: [] }
  const profiles = (profilesResult.data as Array<{ id: string; full_name: string; email: string }> | null) ?? []

  return studentsResult.data
    .map((row) => {
      const profile = profiles.find((item) => item.id === row.profile_id)
      return normalizeManagedStudent({
        ...row,
        full_name: profile?.full_name ?? profile?.email ?? 'Öğrenci',
        email: profile?.email ?? '',
      })
    })
    .filter((item): item is ManagedStudent => Boolean(item))
}

export const createManagedStudentAccount = async (params: {
  teacherProfileId: string
  session: Session
  schoolName: string
  fullName: string
  educationLevel: string
  classLevel: string
  examTrack: string
  studyField: string
  password: string
}) => {
  const isUndergraduate = params.educationLevel === 'Lisans'
  const is12thGrade = params.classLevel === '12. Sınıf'
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${CREATE_STUDENT_FUNCTION}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      'x-teacher-token': params.session.access_token,
      Authorization: `Bearer ${params.session.access_token}`,
    },
    body: JSON.stringify({
      teacher_profile_id: params.teacherProfileId,
      school_name: params.schoolName || null,
      full_name: params.fullName,
      education_level: params.educationLevel,
      class_level: isUndergraduate ? null : params.classLevel,
      exam_track: (isUndergraduate || is12thGrade) ? params.examTrack || null : null,
      study_field: is12thGrade ? params.studyField || null : null,
      password: params.password,
    }),
  })

  const payload = await parseJsonResponse<{
    error?: string
    username?: string
    student?: ManagedStudent
    managed_students?: ManagedStudent[]
  }>(response)

  if (!response.ok || !payload.username) {
    throw new Error(payload.error || 'Öğrenci hesabı oluşturulamadı.')
  }

  return {
    username: payload.username,
    student: normalizeManagedStudent(payload.student),
    managedStudents: (payload.managed_students ?? [])
      .map((item) => normalizeManagedStudent(item))
      .filter((item): item is ManagedStudent => Boolean(item)),
  }
}

export const deleteManagedStudent = async (studentId: string, session: Session) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${DELETE_STUDENT_FUNCTION}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      'x-teacher-token': session.access_token,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ student_id: studentId }),
  })

  const payload = await parseJsonResponse<{ error?: string; managed_students?: ManagedStudent[] }>(response)

  if (!response.ok) {
    throw new Error(payload.error || 'Öğrenci silinemedi.')
  }

  return (payload.managed_students ?? [])
    .map((item) => normalizeManagedStudent(item))
    .filter((item): item is ManagedStudent => Boolean(item))
}

export const deleteManagedStudentSafely = async (studentId: string, session: Session) => {
  try {
    return await deleteManagedStudent(studentId, session)
  } catch (error) {
    const client = getSupabaseClient()

    if (!client) {
      throw error instanceof Error ? error : new Error('Öğrenci silinemedi.')
    }

    const studentResult = await client
      .from('students')
      .select('id, profile_id')
      .eq('id', studentId)
      .maybeSingle()

    if (studentResult.error) {
      throw new Error(studentResult.error.message)
    }

    const profileId = (studentResult.data as { id: string; profile_id: string } | null)?.profile_id ?? ''

    const teacherLinksResult = await client.from('teacher_students').delete().eq('student_id', studentId)
    if (teacherLinksResult.error) {
      throw new Error(teacherLinksResult.error.message)
    }

    const topicProgressResult = await client.from('student_topic_progress').delete().eq('student_id', studentId)
    if (topicProgressResult.error && !topicProgressResult.error.message.toLowerCase().includes('relation')) {
      throw new Error(topicProgressResult.error.message)
    }

    const programsResult = await client.from('study_programs').delete().eq('student_id', studentId)
    if (programsResult.error && !programsResult.error.message.toLowerCase().includes('relation')) {
      throw new Error(programsResult.error.message)
    }

    const studentDeleteResult = await client.from('students').delete().eq('id', studentId)
    if (studentDeleteResult.error) {
      throw new Error(studentDeleteResult.error.message)
    }

    if (profileId) {
      const profileDeleteResult = await client.from('profiles').delete().eq('id', profileId)
      if (profileDeleteResult.error && !profileDeleteResult.error.message.toLowerCase().includes('policy')) {
        throw new Error(profileDeleteResult.error.message)
      }
    }

    return []
  }
}

export const listStudyProgramsForTeacher = async (studentId: string, session: Session) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${LIST_STUDY_PROGRAMS_FUNCTION}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      'x-teacher-token': session.access_token,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ student_id: studentId }),
  })

  const payload = await parseJsonResponse<{ programs?: ProgramRecord[] }>(response)
  return Array.isArray(payload.programs) ? payload.programs : []
}

export const listStudyProgramsForStudent = async (session: Session) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${LIST_STUDY_PROGRAMS_FUNCTION}`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'x-teacher-token': session.access_token,
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  const payload = await parseJsonResponse<{ programs?: ProgramRecord[] }>(response)
  return Array.isArray(payload.programs) ? payload.programs : []
}

export const saveStudyProgram = async (params: {
  session: Session
  currentEditingProgramId: string
  selectedStudent: ManagedStudent
  currentProfile: Profile
  draft: ProgramDraft
}) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${SAVE_STUDY_PROGRAM_FUNCTION}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      'x-teacher-token': params.session.access_token,
      Authorization: `Bearer ${params.session.access_token}`,
    },
    body: JSON.stringify({
      program_id: params.currentEditingProgramId || null,
      student_id: params.selectedStudent.id,
      title: `${params.draft.student || params.selectedStudent.full_name || 'Program'} | ${params.draft.start || ''} - ${params.draft.end || ''}`,
      school_name: params.draft.schoolName || '',
      teacher_name: params.draft.teacher || params.currentProfile.full_name || '',
      student_name: params.draft.student || params.selectedStudent.full_name || '',
      education_level: params.draft.educationLevel || params.selectedStudent.education_level || '',
      class_level: params.draft.classLevel || params.selectedStudent.class_level || '',
      exam_track: params.draft.examTrack || params.selectedStudent.exam_track || '',
      study_field: params.draft.studyField || params.selectedStudent.study_field || '',
      start: params.draft.start,
      end: params.draft.end,
      include_question_tracker: params.draft.includeQuestionTracker,
      draft: params.draft,
    }),
  })

  const payload = await parseJsonResponse<{
    error?: string
    mode?: 'created' | 'updated'
    program?: ProgramRecord
  }>(response)

  if (!response.ok) {
    throw new Error(payload.error || 'Program kaydedilemedi.')
  }

  return {
    mode: payload.mode === 'updated' ? 'updated' : 'created',
    program: payload.program ?? null,
  }
}

export const deleteStudyProgram = async (programId: string, session: Session) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${DELETE_STUDY_PROGRAM_FUNCTION}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      'x-teacher-token': session.access_token,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ program_id: programId }),
  })

  const payload = await parseJsonResponse<{ error?: string }>(response)

  if (!response.ok) {
    throw new Error(payload.error || 'Program silinemedi.')
  }
}

export const loadTeacherTopicProgressOverrides = async (studentId: string, session: Session) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${LIST_STUDENT_TOPIC_PROGRESS_FUNCTION}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      'x-teacher-token': session.access_token,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ student_id: studentId }),
  })

  const payload = await parseJsonResponse<{ items?: TopicProgressOverride[] }>(response)

  return (payload.items ?? []).reduce<Record<string, TopicProgressOverride>>((accumulator, item) => {
    if (!item.lesson || !item.topic) {
      return accumulator
    }

    accumulator[`${item.lesson}||${item.topic}`] = {
      lesson: item.lesson,
      topic: item.topic,
      is_completed: Boolean(item.is_completed),
      updated_at: item.updated_at || '',
    }

    return accumulator
  }, {})
}

export const saveTeacherTopicProgress = async (
  studentId: string,
  overrides: Record<string, TopicProgressOverride>,
  session: Session,
) => {
  const items = Object.values(overrides).filter((item) => item.lesson && item.topic && item.is_completed)
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${SAVE_STUDENT_TOPIC_PROGRESS_FUNCTION}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      'x-teacher-token': session.access_token,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ student_id: studentId, items }),
  })

  const payload = await parseJsonResponse<{ error?: string; items?: TopicProgressOverride[] }>(response)

  if (!response.ok) {
    throw new Error(payload.error || 'Analiz kaydedilemedi.')
  }

  return (payload.items ?? []).reduce<Record<string, TopicProgressOverride>>((accumulator, item) => {
    if (!item.lesson || !item.topic) {
      return accumulator
    }

    accumulator[`${item.lesson}||${item.topic}`] = {
      lesson: item.lesson,
      topic: item.topic,
      is_completed: Boolean(item.is_completed),
      updated_at: item.updated_at || '',
    }

    return accumulator
  }, {})
}
