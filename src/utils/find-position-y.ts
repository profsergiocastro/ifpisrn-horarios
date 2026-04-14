import { Days, Time } from '../interfaces/interfaces'
import { parseTimeRangeToMinutes } from './create-time-slots'
// Analyse the time of the class and add a value to the property 'y' based on index of the time

interface FindPositionYProps {
  weekClasses: Days[]
  time: Time[]
}

export function findPositionY({ weekClasses, time }: FindPositionYProps) {
  const timeRanges = time
    .map((t) => parseTimeRangeToMinutes(t.time))
    .filter(Boolean) as Array<{ start: number; end: number }>

  const slotMinutes =
    timeRanges.length >= 2 ? timeRanges[1].start - timeRanges[0].start : 30

  const weekClassesFormatted = weekClasses.map((week) => {
    return {
      dayClasses: week.dayClasses.map((el) => {
        const classRange = parseTimeRangeToMinutes(el.time)
        if (!classRange) {
          el.positionY = 2
          el.size = Math.max(1, el.size ?? 1)
          return el
        }

        const startIndexExact = timeRanges.findIndex(
          (t) => t.start === classRange.start,
        )
        let startIndex = startIndexExact
        if (startIndex === -1) {
          for (let i = timeRanges.length - 1; i >= 0; i--) {
            if (timeRanges[i].start <= classRange.start) {
              startIndex = i
              break
            }
          }
        }

        const safeStartIndex = Math.max(0, startIndex)
        el.positionY = safeStartIndex + 2

        const durationMinutes = classRange.end - classRange.start
        const computedSize = Math.max(
          1,
          Math.ceil(durationMinutes / Math.max(1, slotMinutes)),
        )

        const maxSize = time.length + 2 - el.positionY
        el.size = Math.max(1, Math.min(computedSize, maxSize))
        return el
      }),
      ...week,
    }
  })
  return weekClassesFormatted
}
