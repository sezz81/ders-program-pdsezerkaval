import type { ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'

import { AuthMode, UserRole, type AuthFormState } from '../types'

interface AuthLandingPageProps {
  role: UserRole
  mode: AuthMode
  form: AuthFormState
  busy: boolean
  error: string
  success: string
  onRoleChange: (role: UserRole) => void
  onModeChange: (mode: AuthMode) => void
  onFieldChange: (field: keyof AuthFormState, value: string) => void
  onSubmit: () => void
  onContinueAsGuest: () => void
}

const getIdentityCopy = (mode: AuthMode, role: UserRole) => {
  if (mode === AuthMode.SignUp) {
    return {
      title: 'Öğretmen hesabı oluştur',
      subtitle: 'Öğretmen hesabınızı oluşturun. Öğrenci hesaplarını içeriden yönetebileceksiniz.',
      identityLabel: 'E-posta',
      identityType: 'email',
      identityPlaceholder: 'ogretmen@mail.com',
      submitLabel: 'Kayıt Ol',
    }
  }

  if (role === UserRole.Student) {
    return {
      title: 'Öğrenci girişi',
      subtitle: 'Öğretmeninizin verdiği kullanıcı adı ve şifre ile giriş yapın.',
      identityLabel: 'Kullanıcı Adı',
      identityType: 'text',
      identityPlaceholder: 'kullaniciadi',
      submitLabel: 'Giriş Yap',
    }
  }

  return {
    title: 'Öğretmen girişi',
    subtitle: 'Öğretmen hesabınızla giriş yapın.',
    identityLabel: 'E-posta',
    identityType: 'email',
    identityPlaceholder: 'ogretmen@mail.com',
    submitLabel: 'Giriş Yap',
  }
}

interface RoleOptionCardProps {
  icon: ReactNode
  title: string
  description: string
  active: boolean
  onClick: () => void
}

function RoleOptionCard({ icon, title, description, active, onClick }: RoleOptionCardProps) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.25,
        p: 2,
        borderRadius: 1.25,
        border: '1.5px solid',
        borderColor: active ? 'primary.main' : 'divider',
        bgcolor: active ? 'rgba(29, 78, 216, 0.06)' : 'transparent',
        transition: 'all 120ms ease',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: active ? 'rgba(29, 78, 216, 0.08)' : 'action.hover',
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 40,
          height: 40,
          borderRadius: 1,
          bgcolor: active ? 'primary.main' : 'grey.100',
          color: active ? 'common.white' : 'text.secondary',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, color: active ? 'primary.main' : 'text.primary' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Box>
  )
}

export function AuthLandingPage({
  role,
  mode,
  form,
  busy,
  error,
  success,
  onRoleChange,
  onModeChange,
  onFieldChange,
  onSubmit,
  onContinueAsGuest,
}: AuthLandingPageProps) {
  const copy = getIdentityCopy(mode, role)
  const isSignUp = mode === AuthMode.SignUp

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        background:
          'radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 24%), radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.14), transparent 22%), linear-gradient(180deg, #f8fbff 0%, #eef3fb 100%)',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 980, overflow: 'hidden', borderRadius: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' } }}>
          <Box
            sx={{
              p: { xs: 4, md: 5 },
              color: 'common.white',
              background: 'linear-gradient(160deg, #0f172a 0%, #1d4ed8 52%, #60a5fa 100%)',
            }}
          >
            <Chip
              label="Ders Çalışma Programı"
              sx={{
                mb: 3,
                color: 'common.white',
                bgcolor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            />

            <Typography variant="h3" sx={{ mb: 2, fontSize: { xs: 32, md: 40 }, lineHeight: 1.1 }}>
              Ders programınızı dakikalar içinde hazırlayın.
            </Typography>

            <Typography sx={{ mb: 4, color: 'rgba(255,255,255,0.82)', maxWidth: 480 }}>
              Öğretmenler öğrencileri için program oluşturur ve ilerlemeyi analiz eder.
              Öğrenciler kendilerine atanan programları açıp yazdırabilir.
            </Typography>

            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SchoolRoundedIcon fontSize="small" />
                <Typography>Öğretmen hesapları öğrenci, program ve analiz yönetebilir.</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PersonOutlineRoundedIcon fontSize="small" />
                <Typography>Öğrenciler kaydedilmiş programlarını açıp yazdırabilir.</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LoginRoundedIcon fontSize="small" />
                <Typography>Misafir kullanım giriş gerektirmez, taslaklar cihazda tutulur.</Typography>
              </Box>
            </Stack>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Öneri ve bildirimleriniz için{' '}
                <Box component="span" sx={{ color: '#fde68a', fontWeight: 700 }}>
                  sezer.hssn10@gmail.com
                </Box>{' '}
                iletişime geçiniz.
              </Typography>
              <Typography sx={{ mt: 2.5, fontWeight: 700, color: 'common.white' }}>
                Sezer KAVAL
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.82)' }}>
                Psikolojik Danışman
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" sx={{ mb: 0.75 }}>
                  {isSignUp ? 'Öğretmen hesabı oluştur' : 'Giriş yap'}
                </Typography>
                <Typography color="text.secondary">
                  {isSignUp
                    ? 'Yalnızca öğretmenler yeni hesap oluşturabilir.'
                    : 'Öğretmen veya öğrenci olarak devam edin.'}
                </Typography>
              </Box>

              {!isSignUp ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                    Hesap türü
                  </Typography>
                  <Stack spacing={1.25}>
                    <RoleOptionCard
                      icon={<SchoolRoundedIcon />}
                      title="Öğretmen"
                      description="Program oluştur, öğrenci yönet, analiz et."
                      active={role === UserRole.Teacher}
                      onClick={() => onRoleChange(UserRole.Teacher)}
                    />
                    <RoleOptionCard
                      icon={<PersonOutlineRoundedIcon />}
                      title="Öğrenci"
                      description="Öğretmeninden aldığın kullanıcı adı ile giriş yap."
                      active={role === UserRole.Student}
                      onClick={() => onRoleChange(UserRole.Student)}
                    />
                  </Stack>
                </Box>
              ) : null}

              <Divider />

              <Box>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  {copy.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {copy.subtitle}
                </Typography>
              </Box>

              <Stack spacing={2}>
                {isSignUp ? (
                  <TextField
                    label="Ad Soyad"
                    value={form.fullName}
                    onChange={(event) => onFieldChange('fullName', event.target.value)}
                    fullWidth
                  />
                ) : null}

                <TextField
                  label={copy.identityLabel}
                  type={copy.identityType}
                  value={form.identity}
                  placeholder={copy.identityPlaceholder}
                  onChange={(event) => onFieldChange('identity', event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      onSubmit()
                    }
                  }}
                  fullWidth
                />

                <TextField
                  label="Şifre"
                  type="password"
                  value={form.password}
                  placeholder="En az 6 karakter"
                  onChange={(event) => onFieldChange('password', event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      onSubmit()
                    }
                  }}
                  fullWidth
                />
              </Stack>

              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}

              <Button
                size="large"
                variant="contained"
                onClick={onSubmit}
                disabled={busy}
                startIcon={<LoginRoundedIcon />}
              >
                {busy ? 'İşleniyor...' : copy.submitLabel}
              </Button>

              {role === UserRole.Teacher || isSignUp ? (
                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={() => onModeChange(isSignUp ? AuthMode.SignIn : AuthMode.SignUp)}
                  >
                    {isSignUp ? 'Zaten hesabım var, giriş yap' : 'Öğretmen hesabı oluştur'}
                  </Link>
                </Box>
              ) : null}

              <Box sx={{ textAlign: 'center' }}>
                <Button variant="text" size="small" onClick={onContinueAsGuest}>
                  Misafir olarak devam et
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Box>
      </Card>
    </Box>
  )
}
