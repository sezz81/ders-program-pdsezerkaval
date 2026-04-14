import type { Dispatch, SetStateAction } from 'react'

import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { DateRangePicker } from '../components/DateRangePicker'
import { EDUCATION_LEVEL_OPTIONS, EDUCATION_LEVELS, STUDY_FIELD_OPTIONS } from '../data/legacy'
import { EducationLevel, ExamTrack, UserRole, type ManagedStudent, type ProgramDraft } from '../types'

interface SetupPageProps {
  draft: ProgramDraft
  setDraft: Dispatch<SetStateAction<ProgramDraft>>
  setupError: string
  linkedStudents: ManagedStudent[]
  currentRole: UserRole | null
  onStudentSelect: (studentId: string) => void
  onGoNext: () => void
}

export function SetupPage({
  draft,
  setDraft,
  setupError,
  linkedStudents,
  currentRole,
  onStudentSelect,
  onGoNext,
}: SetupPageProps) {
  const isStudent = currentRole === UserRole.Student
  const hasStudents = linkedStudents.length > 0

  const selectedStudent = hasStudents
    ? linkedStudents.find((s) => s.full_name === draft.student) ?? null
    : null
  const needsExamTrackSelection =
    draft.educationLevel === EducationLevel.Undergraduate || draft.classLevel === '12. Sınıf'
  const needsStudyFieldSelection =
    draft.educationLevel !== EducationLevel.Undergraduate &&
    (draft.examTrack === ExamTrack.AYT || draft.examTrack === ExamTrack.TYTAndAYT)

  const handleStudentSelect = (studentId: string) => {
    onStudentSelect(studentId)
    if (!studentId) {
      setDraft((current) => ({
        ...current,
        student: '',
        schoolName: '',
        educationLevel: '',
        classLevel: '',
        examTrack: '',
        studyField: '',
      }))
      return
    }
    const student = linkedStudents.find((s) => s.id === studentId)
    if (!student) return
    setDraft((current) => ({
      ...current,
      student: student.full_name,
      schoolName: student.school_name || current.schoolName,
      educationLevel: student.education_level,
      classLevel: student.class_level,
      examTrack: student.exam_track,
      studyField: student.study_field,
    }))
  }

  const buildStudentMeta = (student: ManagedStudent) => {
    const parts: string[] = []
    if (student.school_name) parts.push(student.school_name)
    if (student.education_level) parts.push(student.education_level)
    if (student.education_level === EducationLevel.Undergraduate) {
      if (student.exam_track) parts.push(student.exam_track)
    } else {
      if (student.class_level) parts.push(student.class_level)
      if (student.exam_track) parts.push(student.exam_track)
      if (student.study_field) parts.push(student.study_field)
    }
    return parts
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' },
        gap: 2.5,
        maxWidth: 1020,
        mx: 'auto',
      }}
    >
      {/* ─── Left: Program info ─── */}
      <Card variant="outlined" sx={{ borderRadius: 1.25 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <Box>
              <Typography variant="h5" sx={{ mb: 0.5 }}>Program Bilgileri</Typography>
              <Typography color="text.secondary">
                {isStudent
                  ? 'Kademe ve tarih aralığını belirleyerek programı oluşturun.'
                  : hasStudents
                    ? 'Öğrenci seçin, geri kalan bilgiler otomatik gelir.'
                    : 'Programın kime ait olduğunu belirtin.'}
              </Typography>
            </Box>

            {!isStudent ? (
              <TextField
                label="Öğretmen Adı Soyadı"
                value={draft.teacher}
                onChange={(event) => setDraft((current) => ({ ...current, teacher: event.target.value }))}
                fullWidth
              />
            ) : null}

            {!isStudent && hasStudents ? (
              <TextField
                select
                label="Öğrenci"
                value={selectedStudent?.id ?? ''}
                onChange={(event) => handleStudentSelect(event.target.value)}
                fullWidth
              >
                <MenuItem value="">Öğrenci seçiniz</MenuItem>
                {linkedStudents.map((student) => {
                  const detail =
                    student.education_level === EducationLevel.Undergraduate
                      ? student.exam_track || student.education_level
                      : [student.class_level, student.education_level].filter(Boolean).join(' · ')
                  return (
                    <MenuItem key={student.id} value={student.id}>
                      <Box>
                        <Box sx={{ fontWeight: 600 }}>{student.full_name}</Box>
                        {detail ? (
                          <Box component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
                            {detail}
                          </Box>
                        ) : null}
                      </Box>
                    </MenuItem>
                  )
                })}
              </TextField>
            ) : !isStudent && !hasStudents ? (
              <>
                <TextField
                  label="Öğrenci Adı Soyadı"
                  value={draft.student}
                  onChange={(event) => setDraft((current) => ({ ...current, student: event.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Okul Adı"
                  value={draft.schoolName}
                  onChange={(event) => setDraft((current) => ({ ...current, schoolName: event.target.value }))}
                  fullWidth
                />
              </>
            ) : null}

            {/* Student info display — shown after selection */}
            {selectedStudent ? (
              <>
                <Divider />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1.75,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <SchoolRoundedIcon sx={{ color: 'text.secondary', mt: 0.25, flexShrink: 0 }} />
                  <Stack spacing={0.75}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedStudent.full_name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      {buildStudentMeta(selectedStudent).map((part) => (
                        <Chip key={part} label={part} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Stack>
                </Box>
              </>
            ) : null}

            {/* Manual education fields — only for guest/no-student mode */}
            {!hasStudents ? (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    select
                    label="Kademe"
                    value={draft.educationLevel}
                    onChange={(event) => {
                      setDraft((current) => ({
                        ...current,
                        educationLevel: event.target.value as ProgramDraft['educationLevel'],
                        classLevel: '',
                        examTrack: '',
                        studyField: '',
                      }))
                    }}
                    fullWidth
                  >
                    <MenuItem value="">Kademe seçiniz</MenuItem>
                    {EDUCATION_LEVEL_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </TextField>

                  {draft.educationLevel !== EducationLevel.Undergraduate ? (
                    <TextField
                      select
                      label="Sınıf"
                      value={draft.classLevel}
                      onChange={(event) => {
                        setDraft((current) => ({
                          ...current,
                          classLevel: event.target.value,
                          examTrack: current.classLevel !== event.target.value ? '' : current.examTrack,
                          studyField: current.classLevel !== event.target.value ? '' : current.studyField,
                        }))
                      }}
                      fullWidth
                    >
                      <MenuItem value="">{draft.educationLevel ? 'Sınıf seçiniz' : 'Önce kademe seçiniz'}</MenuItem>
                      {(draft.educationLevel ? EDUCATION_LEVELS[draft.educationLevel] ?? [] : []).map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </TextField>
                  ) : <Box />}
                </Box>

                {(draft.educationLevel === EducationLevel.Undergraduate || draft.classLevel === '12. Sınıf') ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField
                      select
                      label={draft.educationLevel === EducationLevel.Undergraduate ? 'Sınav' : '12. Sınıf Alanı'}
                      value={draft.examTrack}
                      onChange={(event) => {
                        setDraft((current) => ({
                          ...current,
                          examTrack: event.target.value as ProgramDraft['examTrack'],
                          studyField:
                            event.target.value === ExamTrack.AYT || event.target.value === ExamTrack.TYTAndAYT
                              ? current.studyField
                              : '',
                        }))
                      }}
                      fullWidth
                    >
                      <MenuItem value="">{draft.educationLevel === EducationLevel.Undergraduate ? 'Sınav seçiniz' : 'Alan seçiniz'}</MenuItem>
                      {(draft.educationLevel === EducationLevel.Undergraduate
                        ? [ExamTrack.KPSSB, ExamTrack.MEBAGS]
                        : [ExamTrack.TYT, ExamTrack.AYT, ExamTrack.TYTAndAYT]).map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </TextField>

                    {draft.educationLevel !== EducationLevel.Undergraduate &&
                    (draft.examTrack === ExamTrack.AYT || draft.examTrack === ExamTrack.TYTAndAYT) ? (
                      <TextField
                        select
                        label="Alan"
                        value={draft.studyField}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, studyField: event.target.value as ProgramDraft['studyField'] }))
                        }
                        fullWidth
                      >
                        <MenuItem value="">Alan seçiniz</MenuItem>
                        {STUDY_FIELD_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </TextField>
                    ) : <Box />}
                  </Box>
                ) : null}
              </>
            ) : null}

            {hasStudents && needsExamTrackSelection ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  select
                  label={draft.educationLevel === EducationLevel.Undergraduate ? 'Sınav' : 'Sınav Türü'}
                  value={draft.examTrack}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      examTrack: event.target.value as ProgramDraft['examTrack'],
                      studyField:
                        event.target.value === ExamTrack.AYT || event.target.value === ExamTrack.TYTAndAYT
                          ? current.studyField
                          : '',
                    }))
                  }}
                  fullWidth
                >
                  <MenuItem value="">
                    {draft.educationLevel === EducationLevel.Undergraduate ? 'Sınav seçiniz' : 'Sınav türü seçiniz'}
                  </MenuItem>
                  {(draft.educationLevel === EducationLevel.Undergraduate
                    ? [ExamTrack.KPSSB, ExamTrack.MEBAGS]
                    : [ExamTrack.TYT, ExamTrack.AYT, ExamTrack.TYTAndAYT]).map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>

                {needsStudyFieldSelection ? (
                  <TextField
                    select
                    label="Alan"
                    value={draft.studyField}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, studyField: event.target.value as ProgramDraft['studyField'] }))
                    }
                    fullWidth
                  >
                    <MenuItem value="">Alan seçiniz</MenuItem>
                    {STUDY_FIELD_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </TextField>
                ) : <Box />}
              </Box>
            ) : null}

            <FormControlLabel
              control={
                <Checkbox
                  checked={draft.includeQuestionTracker}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, includeQuestionTracker: event.target.checked }))
                  }
                />
              }
              label="Soru takip çizelgesi oluştur"
            />
          </Box>
        </CardContent>
      </Card>

      {/* ─── Right: Date range + submit ─── */}
      <Card variant="outlined" sx={{ borderRadius: 1.25 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>Tarih Aralığı</Typography>
              <Typography color="text.secondary">Başlangıç ve bitiş tarihini seçin.</Typography>
            </Box>

            <DateRangePicker
              start={draft.start}
              end={draft.end}
              onChange={(start, end) => setDraft((current) => ({ ...current, start, end }))}
            />

            <Button size="large" variant="contained" onClick={onGoNext}>
              Devam
            </Button>

            {setupError ? <Alert severity="error">{setupError}</Alert> : null}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
