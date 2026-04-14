import { Classes, Days } from '../interfaces/interfaces'
import { formatMinutesAsHHMM, parseTimeRangeToMinutes } from './create-time-slots'

function normalizeList(value: string[] | undefined): string[] {
  return (value ?? []).map((v) => v.trim())
}

function signatureForMerge(value: Classes): string {
  const teachers = normalizeList(value.teachers)
  const students = normalizeList(value.students)

  return JSON.stringify({
    subject: value.subject?.trim() ?? '',
    classroom: value.classroom?.trim() ?? '',
    teachers,
    students,
  })
}

function formatRange(start: number, end: number): string {
  return `${formatMinutesAsHHMM(start)} - ${formatMinutesAsHHMM(end)}`
}

export function mergeAdjacentClasses(weekClasses: Days[]): Days[] {
  return weekClasses.map((week) => {
    const classesWithRange = week.dayClasses
      .map((c) => {
        const range = parseTimeRangeToMinutes(c.time)
        return range ? { c, range } : null
      })
      .filter(Boolean) as Array<{ c: Classes; range: { start: number; end: number } }>

    const classesWithoutRange = week.dayClasses.filter(
      (c) => !parseTimeRangeToMinutes(c.time),
    )

    classesWithRange.sort((a, b) => a.range.start - b.range.start)

    const merged: Classes[] = []
    for (const item of classesWithRange) {
      const current = item.c
      const currentSig = signatureForMerge(current)

      const last = merged[merged.length - 1]
      if (last) {
        const lastRange = parseTimeRangeToMinutes(last.time)
        if (lastRange) {
          const lastSig = signatureForMerge(last)
          if (lastSig === currentSig && lastRange.end === item.range.start) {
            merged[merged.length - 1] = {
              ...last,
              time: formatRange(lastRange.start, item.range.end),
              size: 1,
              positionY: undefined,
              links: undefined,
            }
            continue
          }
        }
      }

      merged.push({
        ...current,
        size: 1,
        positionY: undefined,
        links: undefined,
      })
    }

    return {
      ...week,
      dayClasses: [...merged, ...classesWithoutRange],
    }
  })
}

