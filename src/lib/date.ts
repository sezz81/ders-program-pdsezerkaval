export const parseLegacyProgramDayTitle = (value: string) => {
  const match = value.match(/(\d{2})\.(\d{2})\.(\d{4})/)

  if (!match) {
    return ''
  }

  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

export const formatDateTR = (value: string) => {
  if (!value) {
    return ''
  }

  const [year, month, day] = value.split('-')
  return `${day}.${month}.${year}`
}

export const formatDateOnlyTR = (value: string) => {
  if (!value) {
    return ''
  }

  return formatDateTR(String(value).split('T')[0].trim())
}

export const toInputDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatCardTitle = (date: Date) => {
  return date.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const getDatesInRange = (start: string, end: string) => {
  const dates: Date[] = []

  if (!start || !end) {
    return dates
  }

  const current = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)

  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

export const formatMonthYearTR = (date: Date) =>
  date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

export const formatProgramDateRange = (start: string, end: string) => {
  if (!start && !end) {
    return 'Tarih bilgisi yok'
  }

  if (start && end) {
    return `${formatDateTR(start)} - ${formatDateTR(end)}`
  }

  return formatDateTR(start || end)
}
