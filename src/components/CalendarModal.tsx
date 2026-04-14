import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Stack, TextField, Alert } from '@mui/material'

import { formatDateTR } from '../lib/date'

interface CalendarModalProps {
  open: boolean
  start: string
  end: string
  onClose: () => void
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  onApply: () => void
}

export function CalendarModal({ open, start, end, onClose, onStartChange, onEndChange, onApply }: CalendarModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Tarih aralığı seç</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Başlangıç"
            type="date"
            value={start}
            onChange={(event) => onStartChange(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label="Bitiş"
            type="date"
            value={end}
            onChange={(event) => onEndChange(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <Alert severity="info">
            {start && end ? `${formatDateTR(start)} - ${formatDateTR(end)}` : 'Başlangıç ve bitiş tarihini seçin.'}
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
        <Button variant="contained" onClick={onApply}>
          Uygula
        </Button>
      </DialogActions>
    </Dialog>
  )
}
