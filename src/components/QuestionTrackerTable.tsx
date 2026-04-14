import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import type { QuestionTrackerRow } from '../types'

interface QuestionTrackerTableProps {
  rows: QuestionTrackerRow[]
  compact?: boolean
}

export function QuestionTrackerTable({ rows, compact = false }: QuestionTrackerTableProps) {
  if (!rows.length) {
    return null
  }

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderRadius: 1.25, '@media print': { borderRadius: 0.75 } }}
    >
      <Typography variant="h6" sx={{ px: 3, pt: 3, fontWeight: 700, '@media print': { px: 1, pt: 1, fontSize: 12 } }}>
        Soru Takip Çizelgesi
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ px: 3, pb: 2, '@media print': { px: 1, pb: 0.75, fontSize: 9, lineHeight: 1.25 } }}
      >
        Bu tablo, programda soru çözümü olarak planlanan çalışmalar üzerinden otomatik üretilir.
      </Typography>

      <Table
        size="small"
        sx={{
          tableLayout: compact ? 'fixed' : 'auto',
          '@media print': {
            '& td, & th': {
              fontSize: 8,
              p: '1px 2px',
              lineHeight: 1.25,
              wordBreak: 'break-word',
            },
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Ders</TableCell>
            <TableCell>Konu</TableCell>
            <TableCell align="center">Hedef</TableCell>
            <TableCell align="center">Çözülen</TableCell>
            <TableCell align="center">Doğru</TableCell>
            <TableCell align="center">Yanlış</TableCell>
            <TableCell align="center">Boş</TableCell>
            <TableCell>Not</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.lesson}-${row.topic}`}>
              <TableCell>{row.lesson}</TableCell>
              <TableCell>{row.topic}</TableCell>
              <TableCell align="center">{row.questionCount}</TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="center"></TableCell>
              <TableCell></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
