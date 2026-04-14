import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import EditCalendarRoundedIcon from '@mui/icons-material/EditCalendarRounded'
import SupervisorAccountRoundedIcon from '@mui/icons-material/SupervisorAccountRounded'
import { Box, Button, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material'

import { ProgramsList } from './ProgramsList'
import type { Profile, ProgramRecord } from '../types'

interface StudentToolsPanelProps {
  currentProfile: Profile | null
  linkedTeachers: Profile[]
  programsLoading: boolean
  sortedStudentPrograms: ProgramRecord[]
  onOpenStudentProgram: (programId: string) => void
  onGoToSetup: () => void
  getStudentUsernameFromEmail: (email: string) => string
}

export function StudentToolsPanel({
  currentProfile,
  linkedTeachers,
  programsLoading,
  sortedStudentPrograms,
  onOpenStudentProgram,
  onGoToSetup,
  getStudentUsernameFromEmail,
}: StudentToolsPanelProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 360px' },
        gap: 3,
      }}
    >
      {/* ─── Programlarım ─── */}
      <Card variant="outlined" sx={{ borderRadius: 1.25 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5">Programlarım</Typography>
              <Typography variant="body2" color="text.secondary">
                {programsLoading
                  ? 'Programlar yükleniyor...'
                  : sortedStudentPrograms.length
                    ? `${sortedStudentPrograms.length} kayıtlı program`
                    : 'Henüz kayıtlı program yok'}
              </Typography>
            </Box>

            {programsLoading ? (
              <Stack spacing={1.25}>
                {[0, 1, 2].map((i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Skeleton variant="text" width="40%" height={20} />
                    <Skeleton variant="text" width="25%" height={20} />
                    <Skeleton variant="rounded" width={60} height={28} sx={{ ml: 'auto' }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <ProgramsList
                items={sortedStudentPrograms}
                emptyText="Kayıtlı program bulunmuyor."
                onOpen={onOpenStudentProgram}
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* ─── Sağ Sidebar ─── */}
      <Stack spacing={2.5}>
        {/* Program Oluştur CTA */}
        <Card
          sx={{
            borderRadius: 1.25,
            background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
            color: 'common.white',
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
              <EditCalendarRoundedIcon />
              <Typography variant="h6">Program Oluştur</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2.5 }}>
              Yeni bir haftalık çalışma programı hazırlayın.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={onGoToSetup}
              sx={{
                bgcolor: 'common.white',
                color: 'primary.main',
                fontWeight: 700,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Yeni Program
            </Button>
          </CardContent>
        </Card>

        {/* Öğretmen & Kullanıcı Adı */}
        <Stack spacing={1.25}>
          {linkedTeachers.length ? linkedTeachers.map((teacher) => (
            <Card key={teacher.id} variant="outlined" sx={{ borderRadius: 1.25 }}>
              <CardContent sx={{ py: 1.75 }}>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                  <SupervisorAccountRoundedIcon fontSize="small" />
                  {teacher.full_name || teacher.email || 'Öğretmen'}
                </Typography>
              </CardContent>
            </Card>
          )) : null}

          {currentProfile ? (
            <Card variant="outlined" sx={{ borderRadius: 1.25 }}>
              <CardContent sx={{ py: 1.75 }}>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                  <BadgeRoundedIcon fontSize="small" />
                  Kullanıcı adı: {getStudentUsernameFromEmail(currentProfile.email || '') || '-'}
                </Typography>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  )
}
