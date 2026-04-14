import { Time } from '../interfaces/interfaces'

function parseHHMM(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  if (hours < 0 || hours > 23) return null
  if (minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

export function formatMinutesAsHHMM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function createHalfHourTimeSlots(): Time[] {
  const start = parseHHMM('07:30')
  const end = parseHHMM('22:00')
  if (start === null || end === null) return []

  const stepMinutes = 30
  const slots: Time[] = []

  for (let current = start; current < end; current += stepMinutes) {
    const next = Math.min(current + stepMinutes, end)
    slots.push({
      time: `${formatMinutesAsHHMM(current)} - ${formatMinutesAsHHMM(next)}`,
      size: 1,
    })
  }

  return slots
}

export function parseTimeRangeToMinutes(
  range: string,
): { start: number; end: number } | null {
  const parts = range.split('-')
  if (parts.length < 2) return null
  const start = parseHHMM(parts[0])
  const end = parseHHMM(parts.slice(1).join('-'))
  if (start === null || end === null) return null
  if (end <= start) return null
  return { start, end }
}
