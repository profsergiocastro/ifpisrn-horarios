import React, { useContext } from 'react'

import html2canvas from 'html2canvas'
import { GridContext } from '../Grid'
import { ModalSettings, ModalSettingsProps } from '../ModalSettings'

import { Cell } from '../../css/Cell'
import { Container } from './styles'

export interface TimeProps {
  time: string
  size?: number
}

export interface SidebarProps {
  timeClasses: Array<TimeProps>
  // rows: string;
  modal: ModalSettingsProps
}

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function Sidebar() {
  const { timeChanged } = useContext(GridContext)
  let timeOffSet = 2

  const { rowsSize, gridRef } = useContext(GridContext)

  const downloadScreenshot = async (): Promise<Blob> => {
    const canvas = await takeScreenShot(gridRef.current)
    return canvasToBlob(canvas)
  }

  async function takeScreenShot(canva: HTMLElement): Promise<HTMLCanvasElement> {
    if (!canva) {
      throw new Error('A grade de horários não foi encontrada para captura.')
    }

    const ios = isIOSDevice()
    const width = Math.max(canva.scrollWidth, canva.offsetWidth, 1)
    const height = Math.max(canva.scrollHeight, canva.offsetHeight, 1)

    // Mobile Safari must keep the canvas below both its per-side and total
    // pixel limits. For iOS we export one column per weekday, rather than the
    // clipped carousel viewport currently visible on a phone.
    const slider = canva.querySelector<HTMLElement>('.keen-slider')
    const slideCount = slider
      ? slider.querySelectorAll<HTMLElement>('.keen-slider__slide').length
      : 0
    const sidebarWidth =
      canva.querySelector<HTMLElement>('.sidebar')?.getBoundingClientRect().width ??
      Math.max(1, width * 0.1)
    const dayWidth = slider
      ? Math.max(1, slider.getBoundingClientRect().width)
      : Math.max(1, width - sidebarWidth)
    const captureWidth =
      ios && slideCount > 1
        ? Math.ceil(sidebarWidth + dayWidth * slideCount)
        : width

    const requestedScale = ios ? 2 : 4
    const maxPixels = ios ? 4_000_000 : 32_000_000
    const maxDimension = ios ? 4096 : 16384
    const safeScale = Math.max(
      0.25,
      Math.min(
        requestedScale,
        Math.sqrt(maxPixels / (captureWidth * height)),
        maxDimension / captureWidth,
        maxDimension / height,
      ),
    )
    const scales = ios
      ? [...new Set([
          safeScale,
          Math.min(safeScale, 0.85),
          Math.min(safeScale, 0.6),
          Math.min(safeScale, 0.4),
        ])]
      : [safeScale]

    let lastError: unknown

    for (const scale of scales) {
      try {
        const canvas = await html2canvas(canva, {
          useCORS: true,
          allowTaint: false,
          scale,
          // The original grid and empty timetable cells are partly
          // transparent. An opaque white base prevents transparent slots
          // from appearing black in image viewers.
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 15000,
          windowWidth: Math.max(document.documentElement.clientWidth, captureWidth),
          windowHeight: Math.max(document.documentElement.clientHeight, height),
          onclone: (clonedDocument) => {
            const cloneRoot = clonedDocument.querySelector<HTMLElement>(
              '[data-timetable-export-root]',
            )
            if (!cloneRoot) return

            const cloneSlider = cloneRoot.querySelector<HTMLElement>(
              '.keen-slider',
            )
            const cloneSlides = cloneSlider
              ? Array.from(
                  cloneSlider.querySelectorAll<HTMLElement>(
                    '.keen-slider__slide',
                  ),
                )
              : []

            if (ios && cloneSlider && cloneSlides.length > 1) {
              const fullTimetableWidth = dayWidth * cloneSlides.length

              // The phone shows days in a horizontal carousel. Export all
              // days side-by-side in the cloned document so html2canvas sees
              // the whole timetable rather than just the visible viewport.
              cloneRoot.style.setProperty(
                'width',
                `${sidebarWidth + fullTimetableWidth}px`,
                'important',
              )
              cloneRoot.style.setProperty('max-width', 'none', 'important')
              cloneRoot.style.setProperty(
                'grid-template-columns',
                `${sidebarWidth}px ${fullTimetableWidth}px`,
                'important',
              )
              cloneRoot.style.setProperty('overflow', 'visible', 'important')

              cloneSlider.style.setProperty('display', 'grid', 'important')
              cloneSlider.style.setProperty(
                'grid-template-columns',
                `repeat(${cloneSlides.length}, ${dayWidth}px)`,
                'important',
              )
              cloneSlider.style.setProperty(
                'width',
                `${fullTimetableWidth}px`,
                'important',
              )
              cloneSlider.style.setProperty(
                'min-width',
                `${fullTimetableWidth}px`,
                'important',
              )
              cloneSlider.style.setProperty('max-width', 'none', 'important')
              cloneSlider.style.setProperty('overflow', 'visible', 'important')
              cloneSlider.style.setProperty('transform', 'none', 'important')

              cloneSlides.forEach((slide) => {
                slide.style.setProperty('width', `${dayWidth}px`, 'important')
                slide.style.setProperty('min-width', `${dayWidth}px`, 'important')
                slide.style.setProperty('max-width', `${dayWidth}px`, 'important')
                slide.style.setProperty('flex', 'none', 'important')
                slide.style.setProperty('transform', 'none', 'important')
                slide.style.setProperty('overflow', 'visible', 'important')
                slide.style.setProperty('position', 'relative', 'important')
              })
            }

            // Replace the SVG data-URI used to hatch empty slots with a CSS
            // gradient in the screenshot clone. Safari has stricter canvas
            // security checks for some SVG data-image backgrounds.
            const emptySlots = cloneRoot.querySelectorAll<HTMLElement>(
              '[data-timetable-empty-slot]',
            )
            emptySlots.forEach((slot) => {
              slot.style.backgroundColor = '#ffffff'
              slot.style.backgroundImage =
                'repeating-linear-gradient(135deg, transparent 0px, transparent 5px, rgba(156, 146, 172, 0.16) 5px, rgba(156, 146, 172, 0.16) 6px)'
            })

            // CSS background URLs cannot carry crossorigin metadata. Remove
            // any remaining URL-based backgrounds from the cloned timetable
            // so no foreign/background image can taint the exported canvas.
            const elements = [
              cloneRoot,
              ...Array.from(cloneRoot.querySelectorAll<HTMLElement>('*')),
            ]
            elements.forEach((element) => {
              if (element.hasAttribute('data-timetable-empty-slot')) return
              const backgroundImage =
                clonedDocument.defaultView?.getComputedStyle(element)
                  .backgroundImage ?? ''
              if (backgroundImage.includes('url(')) {
                element.style.backgroundImage = 'none'
              }
            })
          },
        })

        if (
          canvas.width > 0 &&
          canvas.height > 0 &&
          canvas.width <= maxDimension &&
          canvas.height <= maxDimension
        ) {
          return canvas
        }

        lastError = new Error(
          `A captura retornou dimensões inválidas: ${canvas.width} × ${canvas.height}.`,
        )
      } catch (error) {
        lastError = error
      }
    }

    const reason =
      lastError instanceof Error ? ` Detalhe: ${lastError.message}` : ''
    throw new Error(
      `O navegador não conseguiu renderizar a grade mesmo reduzindo a resolução.${reason}`,
    )
  }

  function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const fallbackToDataUrl = () => {
        try {
          const dataUrl = canvas.toDataURL('image/png')
          const base64 = dataUrl.split(',')[1]
          if (!base64) {
            reject(new Error('A captura não produziu dados de imagem.'))
            return
          }

          const binary = window.atob(base64)
          const bytes = new Uint8Array(binary.length)
          for (let index = 0; index < binary.length; index++) {
            bytes[index] = binary.charCodeAt(index)
          }
          resolve(new Blob([bytes], { type: 'image/png' }))
        } catch (error) {
          reject(
            error instanceof Error
              ? error
              : new Error('Não foi possível converter a captura em PNG.'),
          )
        }
      }

      if (typeof canvas.toBlob !== 'function') {
        fallbackToDataUrl()
        return
      }

      try {
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              resolve(blob)
            } else {
              // Some browser versions return a null/empty blob instead of
              // throwing. Try the compatibility path before reporting error.
              fallbackToDataUrl()
            }
          },
          'image/png',
        )
      } catch {
        fallbackToDataUrl()
      }
    })
  }

  return (
    <Container $rowsSize={`${rowsSize}`}>
      <Cell $gridArea="1 / 1 / 2 / 2" className="sidebar">
        <ModalSettings downloadScreenshot={downloadScreenshot} />
      </Cell>
      {timeChanged.map((timeEl) => (
        <Cell
          className="sidebar"
          $gridArea={`${timeOffSet} / 1 / ${timeOffSet++} / 2`}
          key={timeEl.time}
        >
          <span className="text-time">{timeEl.time}</span>
        </Cell>
      ))}
    </Container>
  )
}
