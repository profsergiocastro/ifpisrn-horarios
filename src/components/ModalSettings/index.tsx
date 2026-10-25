import React, { useContext, useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as RadioGroup from '@radix-ui/react-radio-group'
import * as Slider from '@radix-ui/react-slider'
import {
  DialogClose,
  DialogContent,
  DialogTrigger,
  ScreenshotButton,
  ScreenshotLink,
  SettingsContainer,
} from './styles'
import { Gear, X, Check, Camera, ShareNetwork, SpinnerGap } from 'phosphor-react'
import { RadioItem } from '../RadioItem'
import { GridContext } from '../Grid'
import { TimetableViewType, TimetableColorType} from '@site/src/reducers/settings/reducer'
import { trackEvent } from '@site/src/utils/analytics'

export interface ModalSettingsProps {
  downloadScreenshot: () => Promise<Blob>
}

export function ModalSettings({ downloadScreenshot }: ModalSettingsProps) {
  const {
    isMenuFixed,
    modifyMenu,
    timetableView,
    reduceGrid,
    timetableColor,
    colorizeGrid,
    title,
  } = useContext(GridContext)

  const [isGeneratingScreenshot, setIsGeneratingScreenshot] = useState(false)
  const [screenshotMessage, setScreenshotMessage] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [canShareScreenshot, setCanShareScreenshot] = useState(false)

  useEffect(() => {
    return () => {
      if (screenshotUrl) URL.revokeObjectURL(screenshotUrl)
    }
  }, [screenshotUrl])

  function isIOSDevice(): boolean {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    )
  }

  function createScreenshotFileName(): string {
    const date = new Date()
    const formattedDate = date.toISOString().replace(/[:.]/g, '-')
    const safeTitle = String(title || 'horario').trim().replace(/[^a-zA-Z0-9À-ÿ ._()-]/g, '-')
    return `${safeTitle || 'horario'}-${formattedDate}.png`
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)
  }

  async function handleScreenshotClick() {
    setIsGeneratingScreenshot(true)
    setScreenshotMessage('Gerando imagem do horário…')
    setScreenshotFile(null)
    setScreenshotUrl(null)
    setCanShareScreenshot(false)

    try {
      const blob = await downloadScreenshot()
      const fileName = createScreenshotFileName()

      if (isIOSDevice()) {
        const previewUrl = URL.createObjectURL(blob)
        const file = new File([blob], fileName, { type: 'image/png' })
        let canShare = false

        try {
          canShare =
            typeof navigator.share === 'function' &&
            typeof navigator.canShare === 'function' &&
            navigator.canShare({ files: [file] })
        } catch {
          canShare = false
        }

        setScreenshotUrl(previewUrl)
        setScreenshotFile(file)
        setCanShareScreenshot(canShare)
        setScreenshotMessage(
          canShare
            ? 'Imagem pronta. Toque em compartilhar ou abra a imagem para salvá-la.'
            : 'Imagem pronta. Abra a imagem e mantenha-a pressionada para salvar.',
        )
      } else {
        downloadBlob(blob, fileName)
        setScreenshotMessage('Imagem gerada; o download foi iniciado.')
      }
    } catch (error) {
      console.error('Falha ao gerar imagem do horário:', error)
      const detail =
        error instanceof Error ? error.message.slice(0, 160) : 'Erro desconhecido'
      setScreenshotMessage(
        `Não foi possível gerar a imagem. Tente uma visualização mais condensada. Detalhe: ${detail}`,
      )
    } finally {
      setIsGeneratingScreenshot(false)
    }
  }

  async function handleShareScreenshot() {
    if (!screenshotFile || typeof navigator.share !== 'function') return

    try {
      // On iOS, share the file alone; adding title/text can break sharing on
      // some Safari/iOS combinations.
      await navigator.share({ files: [screenshotFile] })
      setScreenshotMessage(
        'Compartilhamento aberto. Selecione “Salvar imagem” ou outro destino disponível.',
      )
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setScreenshotMessage(
          'Compartilhamento cancelado. A imagem continua disponível no link abaixo.',
        )
      } else {
        console.error('Falha ao compartilhar imagem do horário:', error)
        setScreenshotMessage(
          'Não foi possível compartilhar. Abra a imagem abaixo e mantenha-a pressionada para salvar.',
        )
      }
    }
  }

  function handleChangeMenu() {
    modifyMenu(!isMenuFixed)
    trackEvent('menu_fixed_toggle', { enabled: !isMenuFixed })
  }

  function handleChangeTimetableView(newView: TimetableViewType) {
    reduceGrid(newView)
    trackEvent('timetable_view_change', { view: newView })
  }

  function handleChangeTimetableColor(newColor: TimetableColorType) {
    colorizeGrid(newColor)
    trackEvent('timetable_color_change', { color: newColor })
  }

  return (
    <Dialog.Root>
      <DialogTrigger>
        <Gear size={'2rem'} />
      </DialogTrigger>
      <Dialog.Portal>
        <DialogContent>
          <header>
            <div>
              <Dialog.Title>Configurações</Dialog.Title>
              <Dialog.Description>
                Configure o horário da maneira como quiser
              </Dialog.Description>
            </div>

            <DialogClose type="button">
              <X size={'1.5rem'} />
            </DialogClose>
          </header>

          <hr />

          <SettingsContainer>
            <div className="menuFixed">
              <Checkbox.Root
                id="menuFixed"
                defaultChecked={isMenuFixed}
                onCheckedChange={handleChangeMenu}
              >
                <Checkbox.Indicator>
                  <Check size={'1rem'} />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label htmlFor="menuFixed">Menu fixo</label>
            </div>

            <RadioGroup.Root
              className="radioContainer"
              defaultValue={timetableView}
              onValueChange={(value: TimetableViewType) =>
                handleChangeTimetableView(value)
              }
            >
              <RadioItem title="Horário Completo" value="completed" />
              <RadioItem title="Horário Condensado" value="condensed" />
              <RadioItem
                title="Horário Super Condensado"
                value="superCondensed"
              />
            </RadioGroup.Root>

            {/* <RadioGroup.Root
              className="radioColor"
              defaultValue={timetableColor}
              onValueChange={(value: TimetableColorType) =>
                handleChangeTimetableColor(value)
              }
            >
              <RadioItem title="Sem cores" value="noColor" />
              <RadioItem title="Cores por Professor" value="teacherColor" />
              <RadioItem title="Cores por Componente" value="subjectColor" />
              <RadioItem title="Cores por Turma" value="studentsColor" />
              <RadioItem title="Cores por Sala" value="roomColor" />
              <RadioItem title="Cores por Turma, Professor, Componente e Sala" value="allColor" />
              
            </RadioGroup.Root> */}

            {/* <div className="sliderContainer">
              <span>Tamanho da fonte</span>
              <Slider.Root 
                className="slider" 
                defaultValue={[14.4]} 
                min={8} 
                max={30} 
                step={1} 
                aria-label="Tamanho da fonte"
              >
                <Slider.Track className="sliderTrack">
                  <Slider.Range className="sliderRange" />
                </Slider.Track>
                <Slider.Thumb className="sliderThumb" />
              </Slider.Root>
            </div> */}


          </SettingsContainer>

          <hr />
          <footer>
            <div className="screenshotInfo">
              <Dialog.Description>
                Caso queira ter o horário como uma imagem
              </Dialog.Description>
              {screenshotMessage && (
                <p className="screenshotMessage" role="status" aria-live="polite">
                  {screenshotMessage}
                </p>
              )}
              {screenshotUrl && (
                <ScreenshotLink
                  href={screenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir imagem para salvar
                </ScreenshotLink>
              )}
            </div>
            <div className="screenshotActions">
              {screenshotFile && canShareScreenshot && (
                <ScreenshotButton
                  type="button"
                  onClick={handleShareScreenshot}
                  title="Compartilhar ou salvar imagem"
                  aria-label="Compartilhar ou salvar imagem"
                >
                  <ShareNetwork size={25} />
                </ScreenshotButton>
              )}
              <ScreenshotButton
                type="button"
                disabled={isGeneratingScreenshot}
                onClick={() => {
                  trackEvent('timetable_screenshot_download', {
                    source: 'settings_modal',
                  })
                  void handleScreenshotClick()
                }}
                title="Gerar imagem do horário"
                aria-label="Gerar imagem do horário"
              >
                {isGeneratingScreenshot ? (
                  <SpinnerGap size={25} className="screenshotSpinner" />
                ) : (
                  <Camera size={25} />
                )}
              </ScreenshotButton>
            </div>
          </footer>
        </DialogContent>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
