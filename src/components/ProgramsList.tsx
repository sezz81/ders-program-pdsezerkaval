import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box, Button, Card, CardActions, CardContent, Chip, Typography } from '@mui/material'

import { formatProgramDateRange } from '../lib/date'
import type { ProgramRecord } from '../types'

interface ProgramsListProps {
  items: ProgramRecord[]
  emptyText: string
  onOpen: (programId: string) => void
  onEdit?: (programId: string) => void
  onDelete?: (programId: string) => void
}

export function ProgramsList({ items, emptyText, onOpen, onEdit, onDelete }: ProgramsListProps) {
  if (!items.length) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography color="text.secondary">{emptyText}</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      {items.map((item) => {
        const title = item.title || item.student_name || 'Program'
        const dateText = formatProgramDateRange(item.start_date, item.end_date)

        return (
          <Card key={item.id} variant="outlined">
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dateText}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {item.student_name ? <Chip size="small" label={item.student_name} /> : null}
                  {item.teacher_name ? <Chip size="small" variant="outlined" label={item.teacher_name} /> : null}
                </Box>
              </Box>
            </CardContent>

            <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1, flexWrap: 'wrap' }}>
              <Button size="small" variant="contained" startIcon={<VisibilityOutlinedIcon />} onClick={() => onOpen(item.id)}>
                Aç
              </Button>
              {onEdit ? (
                <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => onEdit(item.id)}>
                  Düzenle
                </Button>
              ) : null}
              {onDelete ? (
                <Button size="small" color="error" variant="text" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => onDelete(item.id)}>
                  Sil
                </Button>
              ) : null}
            </CardActions>
          </Card>
        )
      })}
    </Box>
  )
}
