import { Box, Card, CardContent, Checkbox, Chip, LinearProgress, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'

import { buildAnalysisMeta, formatAnalysisDate } from '../lib/analysis'
import type { LessonProgressEntry, ManagedStudent } from '../types'

interface AnalysisBoardProps {
  student: ManagedStudent | null
  programCount: number
  lessons: LessonProgressEntry[]
  selectedLesson: string
  onLessonChange: (lesson: string) => void
  onToggleCompleted: (lesson: string, topic: string, checked: boolean) => void
  emptyMessage: string
}

const getLessonColor = (lessonName: string) => {
  const lesson = lessonName.toLocaleLowerCase('tr-TR')

  if (/matematik|geometri/.test(lesson)) return '#2563eb'
  if (/türkçe|edebiyat/.test(lesson)) return '#ea580c'
  if (/fizik/.test(lesson)) return '#0f766e'
  if (/kimya/.test(lesson)) return '#0891b2'
  if (/biyoloji/.test(lesson)) return '#15803d'
  if (/tarih/.test(lesson)) return '#b45309'
  if (/coğrafya/.test(lesson)) return '#92400e'
  if (/ingilizce/.test(lesson)) return '#7c3aed'
  return '#1d4ed8'
}

export function AnalysisBoard({
  student,
  programCount,
  lessons,
  selectedLesson,
  onLessonChange,
  onToggleCompleted,
  emptyMessage,
}: AnalysisBoardProps) {
  const lessonNames = lessons.map((lesson) => lesson.lesson)
  const visibleLessons = selectedLesson ? lessons.filter((lesson) => lesson.lesson === selectedLesson) : lessons
  const allTopics = visibleLessons.flatMap((lesson) => lesson.topics)
  const overallCoverageRate = allTopics.length
    ? Math.round(allTopics.reduce((sum, topic) => sum + topic.progressRate, 0) / allTopics.length)
    : 0
  const totalQuestions = visibleLessons.reduce((sum, lesson) => sum + lesson.totalQuestionCount, 0)
  const metaText = student ? buildAnalysisMeta(student, selectedLesson) : emptyMessage

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Card variant="outlined" sx={{ borderRadius: 1.25 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Typography variant="h4" sx={{ fontSize: { xs: 28, md: 34 } }}>Öğrenci İlerleme Analizi</Typography>
              <Typography color="text.secondary">{metaText}</Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, gap: 2, alignItems: 'start' }}>
              <TextField select label="Ders Filtresi" value={selectedLesson} onChange={(event) => onLessonChange(event.target.value)} fullWidth>
                <MenuItem value="">Tüm Dersler</MenuItem>
                {lessonNames.map((lesson) => <MenuItem key={lesson} value={lesson}>{lesson}</MenuItem>)}
              </TextField>

              {student && visibleLessons.length ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', xl: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    <Typography variant="overline" color="text.secondary">Kayıtlı Program</Typography>
                    <Typography variant="h5">{programCount}</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    <Typography variant="overline" color="text.secondary">Genel İlerleme</Typography>
                    <Typography variant="h5">%{overallCoverageRate}</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    <Typography variant="overline" color="text.secondary">Toplam Soru</Typography>
                    <Typography variant="h5">{totalQuestions}</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    <Typography variant="overline" color="text.secondary">Takip Edilen Ders</Typography>
                    <Typography variant="h5">{visibleLessons.length}</Typography>
                  </Paper>
                </Box>
              ) : null}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {student && visibleLessons.length ? (
        <Box sx={{ display: 'grid', gap: 2.5 }}>
          {visibleLessons.map((lesson) => {
            const accent = getLessonColor(lesson.lesson)

            return (
              <Card key={lesson.lesson} variant="outlined" sx={{ borderRadius: 1.25, borderTop: `4px solid ${accent}` }}>
                <CardContent>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 1.5 }}>
                      <Box>
                        <Typography variant="h6">{lesson.lesson}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lesson.completedTopicCount} / {lesson.topics.length} konuya temas edildi
                        </Typography>
                      </Box>
                      <Chip label={`%${lesson.lessonRate} ilerleme`} sx={{ bgcolor: `${accent}15`, color: accent, fontWeight: 700 }} />
                    </Box>

                    <LinearProgress variant="determinate" value={lesson.lessonRate} sx={{ height: 10, borderRadius: 999 }} />

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                        <Typography variant="overline" color="text.secondary">Çözülen Soru</Typography>
                        <Typography variant="h6">{lesson.totalQuestionCount}</Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                        <Typography variant="overline" color="text.secondary">Toplam Konu</Typography>
                        <Typography variant="h6">{lesson.topics.length}</Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                        <Typography variant="overline" color="text.secondary">Çalışılan Konu</Typography>
                        <Typography variant="h6">{lesson.completedTopicCount}</Typography>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                        <Typography variant="overline" color="text.secondary">Ortalama İlerleme</Typography>
                        <Typography variant="h6">%{lesson.lessonRate}</Typography>
                      </Paper>
                    </Box>

                    <Paper variant="outlined" sx={{ overflowX: 'auto', borderRadius: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Konu</TableCell>
                            <TableCell>Yöntemler</TableCell>
                            <TableCell align="center">Soru</TableCell>
                            <TableCell>Son Çalışma</TableCell>
                            <TableCell>Bitti</TableCell>
                            <TableCell>İlerleme</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {lesson.topics.map((topic) => (
                            <TableRow key={`${lesson.lesson}-${topic.topic}`} sx={{ bgcolor: topic.progressRate === 100 ? 'success.50' : undefined }}>
                              <TableCell sx={{ fontWeight: 700 }}>{topic.topic}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                  {Object.entries(topic.methods).map(([method, count]) => (
                                    <Chip
                                      key={`${topic.topic}-${method}`}
                                      size="small"
                                      label={count > 0 ? `${method} x${count}` : method}
                                      variant={count > 0 ? 'filled' : 'outlined'}
                                      sx={count > 0 ? { bgcolor: `${accent}15`, color: accent } : undefined}
                                    />
                                  ))}
                                </Box>
                              </TableCell>
                              <TableCell align="center">{topic.questionTotal}</TableCell>
                              <TableCell>{formatAnalysisDate(topic.lastWorkedAt)}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Checkbox checked={topic.isCompleted} onChange={(event) => onToggleCompleted(lesson.lesson, topic.topic, event.target.checked)} />
                                  <Typography variant="body2">Bitti</Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ minWidth: 180 }}>
                                <Box sx={{ display: 'grid', gap: 0.75 }}>
                                  <LinearProgress variant="determinate" value={topic.progressRate} sx={{ height: 8, borderRadius: 999 }} />
                                  <Typography variant="body2" color="text.secondary">%{topic.progressRate}</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.25 }}>
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Paper>
      )}
    </Box>
  )
}
