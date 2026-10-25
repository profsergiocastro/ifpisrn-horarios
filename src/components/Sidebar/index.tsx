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

  function takeScreenShot(canva: HTMLElement): Promise<HTMLCanvasElement> {
    const ios = isIOSDevice()
    const width = Math.max(canva.scrollWidth, canva.offsetWidth, 1)
    const height = Math.max(canva.scrollHeight, canva.offsetHeight, 1)

    // iPhones/iPads have tighter canvas memory limits. Keep the exported
    // image within a conservative pixel budget instead of always using 4x.
    const requestedScale = ios ? 1.5 : 4
    const maxPixels = ios ? 12_000_000 : 32_000_000
    const maxDimension = ios ? 8192 : 16384
    const safeScale = Math.max(
      0.5,
      Math.min(
        requestedScale,
        Math.sqrt(maxPixels / (width * height)),
        maxDimension / width,
        maxDimension / height,
      ),
    )

    return html2canvas(canva, {
      useCORS: true,
      allowTaint: false,
      scale: safeScale,
      backgroundColor: null,
    })
  }

  function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('O navegador não conseguiu gerar o arquivo PNG.'))
          }
        },
        'image/png',
      )
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
