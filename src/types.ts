export type TopicMap = Record<string, string[]>

export enum UserRole {
  Teacher = 'teacher',
  Student = 'student',
}

export enum SaveFeedbackType {
  Success = 'success',
  Error = 'error',
}

export enum AppStep {
  Dashboard = 'dashboard',
  Setup = 'setup',
  Editor = 'editor',
  Print = 'print',
  Analysis = 'analysis',
}

export enum AutoPrintMode {
  Program = 'program',
  Analysis = 'analysis',
}

export enum AuthMode {
  SignIn = 'signin',
  SignUp = 'signup',
}

export enum EducationLevel {
  MiddleSchool = 'Ortaokul',
  HighSchool = 'Lise',
  Undergraduate = 'Lisans',
}

export enum StudyField {
  Numeric = 'Sayısal',
  EqualWeight = 'Eşit Ağırlık',
  Verbal = 'Sözel',
}

export enum ExamTrack {
  TYT = 'TYT',
  AYT = 'AYT',
  TYTAndAYT = 'TYT + AYT',
  KPSSB = 'KPSS-B',
  MEBAGS = 'MEB-AGS',
}

export interface ProgramRow {
  time: string
  lesson: string
  topic: string
  method: string
  questionCount: string
}

export interface ProgramDay {
  date: string
  title: string
  rows: ProgramRow[]
}

export interface ProgramDraft {
  schoolName: string
  student: string
  teacher: string
  includeQuestionTracker: boolean
  educationLevel: EducationLevel | ''
  classLevel: string
  examTrack: ExamTrack | ''
  studyField: StudyField | ''
  start: string
  end: string
  days: ProgramDay[]
  notes: string
}

export interface QuestionTrackerRow {
  lesson: string
  topic: string
  questionCount: string
}

export interface SaveFeedback {
  type: SaveFeedbackType
  message: string
}

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
}

export interface StudentRow {
  id: string
  profile_id: string
  school_name: string
  education_level: EducationLevel | ''
  class_level: string
  exam_track: ExamTrack | ''
  study_field: StudyField | ''
}

export interface ManagedStudent {
  id: string
  profile_id: string
  full_name: string
  email: string
  school_name: string
  education_level: EducationLevel | ''
  class_level: string
  exam_track: ExamTrack | ''
  study_field: StudyField | ''
}

export interface ProgramRecord {
  id: string
  title: string
  student_name: string
  teacher_name: string
  start_date: string
  end_date: string
  created_at: string
  draft_json: ProgramDraft | null
}

export interface TopicProgressOverride {
  lesson: string
  topic: string
  is_completed: boolean
  updated_at: string
}

export interface TopicProgressEntry {
  topic: string
  methods: Record<string, number>
  questionTotal: number
  studyCount: number
  lastWorkedAt: string
  progressRate: number
  isCompleted: boolean
}

export interface LessonProgressEntry {
  lesson: string
  topics: TopicProgressEntry[]
  lessonRate: number
  completedTopicCount: number
  totalQuestionCount: number
}

export interface AuthFormState {
  fullName: string
  identity: string
  password: string
}

export interface ManagedStudentCreateForm {
  fullName: string
  schoolName: string
  educationLevel: EducationLevel | ''
  classLevel: string
  examTrack: ExamTrack | ''
  studyField: string
  password: string
}
