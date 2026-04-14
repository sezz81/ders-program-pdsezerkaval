import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import SupervisorAccountRoundedIcon from '@mui/icons-material/SupervisorAccountRounded'
import { Box, Chip, Paper } from '@mui/material'

import { formatDateTR } from '../lib/date'

interface ProgramMetaHeaderProps {
  schoolName: string
  student: string
  teacher: string
  start: string
  end: string
}

export function ProgramMetaHeader({ schoolName, student, teacher, start, end }: ProgramMetaHeaderProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.25, '@media print': { p: 1 } }}>
      <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', '@media print': { gap: 0.5 } }}>
        {schoolName ? (
          <Chip
            icon={<SchoolRoundedIcon />}
            label={`Okul: ${schoolName}`}
            sx={{ '@media print': { height: 24, fontSize: 11 } }}
          />
        ) : null}
        {student ? (
          <Chip
            icon={<PersonRoundedIcon />}
            label={`Öğrenci: ${student}`}
            sx={{ '@media print': { height: 24, fontSize: 11 } }}
          />
        ) : null}
        {teacher ? (
          <Chip
            icon={<SupervisorAccountRoundedIcon />}
            label={`Hazırlayan: ${teacher}`}
            sx={{ '@media print': { height: 24, fontSize: 11 } }}
          />
        ) : null}
        {start && end ? (
          <Chip
            icon={<CalendarMonthRoundedIcon />}
            label={`Tarih: ${formatDateTR(start)} - ${formatDateTR(end)}`}
            color="primary"
            variant="outlined"
            sx={{ '@media print': { height: 24, fontSize: 11 } }}
          />
        ) : null}
      </Box>
    </Paper>
  )
}
