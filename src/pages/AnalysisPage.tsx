import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import { Box, Button } from '@mui/material'

import { AnalysisBoard } from '../components/AnalysisBoard'
import { type AppStep, type LessonProgressEntry, type ManagedStudent } from '../types'

interface AnalysisPageProps {
  student: ManagedStudent | null
  programCount: number
  lessons: LessonProgressEntry[]
  selectedLesson: string
  emptyMessage: string
  analysisReturnStep: AppStep
  onLessonChange: (lesson: string) => void
  onToggleCompleted: (lesson: string, topic: string, checked: boolean) => void
  onSaveAnalysis: () => void
  onPrintAnalysis: () => void
  onBack: (step: AppStep) => void
}

export function AnalysisPage({
  student,
  programCount,
  lessons,
  selectedLesson,
  emptyMessage,
  analysisReturnStep,
  onLessonChange,
  onToggleCompleted,
  onSaveAnalysis,
  onPrintAnalysis,
  onBack,
}: AnalysisPageProps) {
  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <AnalysisBoard
        student={student}
        programCount={programCount}
        lessons={lessons}
        selectedLesson={selectedLesson}
        onLessonChange={onLessonChange}
        onToggleCompleted={onToggleCompleted}
        emptyMessage={emptyMessage}
      />

      <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }} className="no-print">
        <Button variant="outlined" startIcon={<AnalyticsRoundedIcon />} onClick={onSaveAnalysis}>
          Analizi Kaydet
        </Button>
        <Button variant="contained" startIcon={<PrintRoundedIcon />} onClick={onPrintAnalysis}>
          Yazdır / PDF
        </Button>
        <Button variant="text" startIcon={<ArrowBackRoundedIcon />} onClick={() => onBack(analysisReturnStep)}>
          Programa Dön
        </Button>
      </Box>
    </Box>
  )
}
