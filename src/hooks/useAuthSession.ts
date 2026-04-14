import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import {
  ensureProfileRow,
  getCurrentSession,
  getProfileFromSession,
  isSupabaseConfigured,
  signInWithRole,
  signOutFromSupabase,
  signUpTeacher,
} from '../lib/supabase'
import {
  AuthMode,
  UserRole,
  type AuthFormState,
  type Profile,
} from '../types'

const GUEST_STATUS = 'Misafir modundasınız. Giriş yapmadan kullanabilirsiniz.'
const GUEST_CONTINUE_STATUS = 'Misafir modunda devam ediyorsunuz. Programı kullanabilir ve yazdırabilirsiniz.'

const EMPTY_AUTH_FORM: AuthFormState = {
  fullName: '',
  identity: '',
  password: '',
}

export function useAuthSession() {
  const [authReady, setAuthReady] = useState(false)
  const [hasGuestAccess, setHasGuestAccess] = useState(false)
  const [statusText, setStatusText] = useState(GUEST_STATUS)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)

  const [authMode, setAuthMode] = useState<AuthMode>(AuthMode.SignIn)
  const [authRole, setAuthRole] = useState<UserRole>(UserRole.Teacher)
  const [authForm, setAuthForm] = useState<AuthFormState>(EMPTY_AUTH_FORM)
  const [authBusy, setAuthBusy] = useState(false)
  const [authBusyLabel, setAuthBusyLabel] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')

  const resetAuthForm = useCallback(() => {
    setAuthForm(EMPTY_AUTH_FORM)
    setAuthError('')
    setAuthSuccess('')
  }, [])

  const bootstrapAuthState = useCallback(async (sessionOverride?: Session | null) => {
    setAuthReady(false)

    if (!isSupabaseConfigured()) {
      setCurrentSession(null)
      setCurrentProfile(null)
      setStatusText(GUEST_STATUS)
      setAuthReady(true)
      return null
    }

    const activeSession = sessionOverride === undefined ? await getCurrentSession() : sessionOverride
    setCurrentSession(activeSession)

    if (!activeSession?.user) {
      setCurrentProfile(null)
      setStatusText(GUEST_STATUS)
      setAuthReady(true)
      return null
    }

    const fetchedProfile = await getProfileFromSession(activeSession)

    if (!fetchedProfile) {
      setCurrentProfile(null)
      setStatusText(GUEST_STATUS)
      setAuthReady(true)
      return null
    }

    const ensuredProfile = await ensureProfileRow(activeSession, fetchedProfile)
    setCurrentProfile(ensuredProfile)
    setHasGuestAccess(false)
    setStatusText(
      `${ensuredProfile.full_name || ensuredProfile.email || 'Kullanıcı'} olarak giriş yaptınız. Rol: ${
        ensuredProfile.role === UserRole.Teacher ? 'Öğretmen' : 'Öğrenci'
      }.`,
    )
    setAuthReady(true)

    return {
      session: activeSession,
      profile: ensuredProfile,
    }
  }, [])

  useEffect(() => {
    void bootstrapAuthState()
  }, [bootstrapAuthState])

  const changeAuthMode = useCallback((mode: AuthMode) => {
    setAuthMode(mode)
    setAuthRole(UserRole.Teacher)
    resetAuthForm()
  }, [resetAuthForm])

  const continueAsGuest = useCallback(() => {
    setHasGuestAccess(true)
    setStatusText(GUEST_CONTINUE_STATUS)
  }, [])

  const leaveGuestMode = useCallback(() => {
    setHasGuestAccess(false)
    setStatusText(GUEST_STATUS)
  }, [])

  const submitAuth = useCallback(async () => {
    setAuthError('')
    setAuthSuccess('')

    if (!authForm.identity || !authForm.password) {
      setAuthError(authRole === UserRole.Student ? 'Kullanıcı adı ve şifre zorunludur.' : 'E-posta ve şifre zorunludur.')
      return null
    }

    if (authMode === AuthMode.SignUp && !authForm.fullName) {
      setAuthError('Ad soyad zorunludur.')
      return null
    }

    setAuthBusy(true)
    setAuthBusyLabel(authMode === AuthMode.SignUp ? 'Hesap oluşturuluyor...' : 'Giriş yapılıyor...')

    try {
      if (authMode === AuthMode.SignUp) {
        await signUpTeacher(authForm.fullName, authForm.identity, authForm.password)
        setAuthSuccess('Öğretmen hesabı oluşturuldu.')
        return null
      }

      const session = await signInWithRole(authRole, authForm.identity, authForm.password)

      if (!session?.user) {
        setAuthError('Giriş başarılı görünüyor ancak oturum açılamadı. Tekrar deneyin.')
        return null
      }

      resetAuthForm()
      return bootstrapAuthState(session)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'İşlem sırasında beklenmeyen bir hata oluştu.')
      return null
    } finally {
      setAuthBusy(false)
      setAuthBusyLabel('')
    }
  }, [authForm.fullName, authForm.identity, authForm.password, authMode, authRole, bootstrapAuthState, resetAuthForm])

  const signOut = useCallback(async () => {
    resetAuthForm()
    setHasGuestAccess(false)
    setAuthBusy(true)
    setAuthBusyLabel('Çıkış yapılıyor...')

    try {
      await signOutFromSupabase()
      await bootstrapAuthState(null)
    } finally {
      setAuthBusy(false)
      setAuthBusyLabel('')
    }
  }, [bootstrapAuthState, resetAuthForm])

  return {
    authReady,
    hasGuestAccess,
    statusText,
    setStatusText,
    currentSession,
    currentProfile,
    authMode,
    authRole,
    authForm,
    authBusy,
    authBusyLabel,
    authError,
    authSuccess,
    setAuthMode,
    setAuthRole,
    setAuthForm,
    changeAuthMode,
    continueAsGuest,
    leaveGuestMode,
    submitAuth,
    signOut,
    bootstrapAuthState,
  }
}
