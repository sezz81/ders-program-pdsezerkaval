import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import {
  Box,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

import { STUDY_METHODS, TIME_OPTIONS } from '../lib/program'
import type { ProgramDay, ProgramRow } from '../types'

interface DayCardProps {
  day: ProgramDay
  dayIndex: number
  lessons: string[]
  getTopicsForLesson: (lesson: string) => string[]
  onRowChange: (dayIndex: number, rowIndex: number, field: keyof ProgramRow, value: string) => void
  onAddRow: (dayIndex: number) => void
  onRemoveRow: (dayIndex: number) => void
}

export function DayCard({
  day,
  dayIndex,
  lessons,
  getTopicsForLesson,
  onRowChange,
  onAddRow,
  onRemoveRow,
}: DayCardProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 1.25 }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {day.title}
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5 }} className="no-print">
            <IconButton size="small" onClick={() => onRemoveRow(dayIndex)}>
              <RemoveRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onAddRow(dayIndex)}>
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', '& .MuiTableCell-root': { px: 0.75, py: 0.5 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 110, minWidth: 110 }}>Saat</TableCell>
              <TableCell sx={{ width: '22%' }}>Ders</TableCell>
              <TableCell sx={{ width: '40%' }}>Konu</TableCell>
              <TableCell sx={{ width: '25%' }}>Yöntem</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {day.rows.map((row, rowIndex) => {
              const topics = getTopicsForLesson(row.lesson)
              const prevTime = day.rows.slice(0, rowIndex).map((r) => r.time).filter(Boolean).at(-1) ?? ''
              const availableTimes = prevTime
                ? TIME_OPTIONS.filter((t) => t > prevTime)
                : TIME_OPTIONS

              return (
                <TableRow key={`${day.title}-${rowIndex}`}>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={row.time}
                      onChange={(event) => onRowChange(dayIndex, rowIndex, 'time', event.target.value)}
                      fullWidth
                    >
                      <MenuItem value=""></MenuItem>
                      {availableTimes.map((time) => (
                        <MenuItem key={time} value={time}>
                          {time}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>

                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={row.lesson}
                      onChange={(event) => onRowChange(dayIndex, rowIndex, 'lesson', event.target.value)}
                      fullWidth
                      sx={{ '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
                    >
                      <MenuItem value=""></MenuItem>
                      {lessons.map((lesson) => (
                        <MenuItem key={lesson} value={lesson}>
                          {lesson}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>

                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={row.topic}
                      onChange={(event) => onRowChange(dayIndex, rowIndex, 'topic', event.target.value)}
                      fullWidth
                      sx={{ '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
                    >
                      <MenuItem value=""></MenuItem>
                      {topics.map((topic) => (
                        <MenuItem key={topic} value={topic}>
                          {topic}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'grid', gap: 1 }}>
                      <TextField
                        select
                        size="small"
                        value={row.method}
                        onChange={(event) => onRowChange(dayIndex, rowIndex, 'method', event.target.value)}
                        fullWidth
                        sx={{ '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
                      >
                        <MenuItem value=""></MenuItem>
                        {STUDY_METHODS.map((method) => (
                          <MenuItem key={method} value={method}>
                            {method}
                          </MenuItem>
                        ))}
                      </TextField>

                      {row.method === 'Soru Çözümü' ? (
                        <TextField
                          type="number"
                          size="small"
                          value={row.questionCount}
                          placeholder="Soru sayısı"
                          slotProps={{ htmlInput: { min: 1, step: 1 } }}
                          onChange={(event) => onRowChange(dayIndex, rowIndex, 'questionCount', event.target.value)}
                          fullWidth
                        />
                      ) : null}
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
