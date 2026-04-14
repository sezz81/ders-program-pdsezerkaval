import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import { ProgramMetaHeader } from '../components/ProgramMetaHeader'
import { QuestionTrackerTable } from '../components/QuestionTrackerTable'
import { UserRole, type ProgramDraft, type QuestionTrackerRow, type SaveFeedback } from '../types'

interface WeeklySummaryItem {
  lesson: string
  count: number
}

interface PrintPageProps {
  draft: ProgramDraft
  weeklySummary: WeeklySummaryItem[]
  questionTrackerRows: QuestionTrackerRow[]
  saveFeedback: SaveFeedback | null
  currentRole: UserRole | null
  onEdit: () => void
  onSaveProgram: () => void
  onPrint: () => void
  onReset: () => void
}

export function PrintPage({
  draft,
  weeklySummary,
  questionTrackerRows,
  saveFeedback,
  currentRole,
  onEdit,
  onSaveProgram,
  onPrint,
  onReset,
}: PrintPageProps) {
  const isStudentMode = currentRole === UserRole.Student

  return (
    <Box sx={{ display: 'grid', gap: 3, '@media print': { gap: '5px' } }}>
      <ProgramMetaHeader
        schoolName={draft.schoolName}
        student={draft.student}
        teacher={draft.teacher}
        start={draft.start}
        end={draft.end}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2.5,
          '@media print': {
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '4px',
            alignItems: 'start',
          },
        }}
      >
        {draft.days.map((day) => {
          const nonEmptyRows = day.rows.filter((row) => row.time || row.lesson || row.topic || row.method)

          return (
            <Card
              key={day.title}
              variant="outlined"
              sx={{
                borderRadius: 1.25,
                breakInside: 'avoid',
                '@media print': { borderRadius: 0.75 },
              }}
            >
              <CardContent sx={{ '@media print': { p: '5px !important' } }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1.5, fontWeight: 700, '@media print': { fontSize: 10, mb: 0.5 } }}
                >
                  {day.title}
                </Typography>

                <Table
                  size="small"
                  sx={{
                    tableLayout: 'fixed',
                    '@media print': {
                      '& td, & th': {
                        fontSize: 8,
                        p: '1px 2px',
                        lineHeight: 1.25,
                        verticalAlign: 'top',
                        wordBreak: 'break-word',
                      },
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '18%' }}>Saat</TableCell>
                      <TableCell sx={{ width: '20%' }}>Ders</TableCell>
                      <TableCell sx={{ width: '37%' }}>Konu</TableCell>
                      <TableCell sx={{ width: '25%' }}>Yöntem</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {nonEmptyRows.length ? (
                      nonEmptyRows.map((row, index) => (
                        <TableRow key={`${day.title}-${index}`}>
                          <TableCell>{row.time}</TableCell>
                          <TableCell>{row.lesson}</TableCell>
                          <TableCell>{row.topic}</TableCell>
                          <TableCell>
                            {row.method === 'Soru Çözümü' && row.questionCount
                              ? `${row.method} (${row.questionCount} soru)`
                              : row.method}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4}>Henüz ders seçilmedi</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            xl: draft.includeQuestionTracker && questionTrackerRows.length ? '0.75fr 1.25fr' : '1fr',
          },
          gap: 2.5,
          '@media print': {
            gridTemplateColumns: draft.includeQuestionTracker && questionTrackerRows.length ? '0.7fr 1.3fr' : '1fr',
            gap: '6px',
          },
        }}
      >
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 1.25, '@media print': { p: 1, borderRadius: 0.75 } }}>
          <Typography variant="h6" sx={{ mb: 1.5, '@media print': { fontSize: 12, mb: 0.5 } }}>
            Haftalık Ders Özeti
          </Typography>
          <Box sx={{ display: 'grid', gap: 0.75, '@media print': { gap: 0.25 } }}>
            {weeklySummary.length ? (
              weeklySummary.map((item) => (
                <Typography key={item.lesson} sx={{ '@media print': { fontSize: 9, lineHeight: 1.25 } }}>
                  {item.lesson}: {item.count} ders saati
                </Typography>
              ))
            ) : (
              <Typography color="text.secondary" sx={{ '@media print': { fontSize: 9 } }}>
                Henüz ders seçilmedi.
              </Typography>
            )}
          </Box>
        </Paper>

        {draft.includeQuestionTracker && questionTrackerRows.length ? <QuestionTrackerTable rows={questionTrackerRows} compact /> : null}
      </Box>

      {saveFeedback ? <Alert severity={saveFeedback.type === 'success' ? 'success' : 'error'}>{saveFeedback.message}</Alert> : null}

      <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }} className="no-print">
        <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={onEdit}>
          Düzenle
        </Button>

        {!isStudentMode ? (
          <Button variant="outlined" startIcon={<SaveRoundedIcon />} onClick={onSaveProgram}>
            Programı Kaydet
          </Button>
        ) : null}

        <Button variant="contained" startIcon={<PrintRoundedIcon />} onClick={onPrint}>
          Yazdır
        </Button>
        <Button variant="text" startIcon={<AddRoundedIcon />} onClick={onReset}>
          Yeni
        </Button>
      </Box>
    </Box>
  )
}
