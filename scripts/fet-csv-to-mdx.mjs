import { readFile, rm, mkdir, writeFile, mkdtemp, rename, stat } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

function createURL(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function safeFileStem(value) {
  const normalized = createURL(value)
  if (normalized.length <= 80) return normalized || 'item'
  const hash = crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 10)
  return `${normalized.slice(0, 60)}_${hash}`
}

function parseCsvLine(line) {
  const out = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      out.push(current)
      current = ''
      continue
    }
    current += char
  }
  out.push(current)
  return out
}

function parseHourRange(value) {
  const match = /^\s*(\d{1,2})h(\d{2})\s*-\s*(\d{1,2})h(\d{2})\s*$/.exec(value)
  if (!match) return null
  const [, h1, m1, h2, m2] = match
  return `${String(h1).padStart(2, '0')}:${m1} - ${String(h2).padStart(2, '0')}:${m2}`
}

const DAY_MAP = new Map([
  ['Segunda-feira', 'Segunda-Feira'],
  ['Terça-feira', 'Terça-Feira'],
  ['Quarta-feira', 'Quarta-Feira'],
  ['Quinta-feira', 'Quinta-Feira'],
  ['Sexta-feira', 'Sexta-Feira'],
  ['Sábado', 'Sábado'],
])

const DAY_ORDER = [
  'Segunda-Feira',
  'Terça-Feira',
  'Quarta-Feira',
  'Quinta-Feira',
  'Sexta-Feira',
  'Sábado',
]

function splitPlus(value) {
  return String(value ?? '')
    .split('+')
    .map((s) => s.trim())
    .filter(Boolean)
}

function ensureDaysMap() {
  const map = new Map()
  for (const day of DAY_ORDER) map.set(day, [])
  return map
}

function toWeekClasses(dayMap) {
  return DAY_ORDER.filter((d) => dayMap.has(d)).map((dayName) => ({
    dayName,
    dayClasses: dayMap.get(dayName) ?? [],
  }))
}

function classSignature(entry) {
  const teachers = entry.teachers.join('|')
  const students = entry.students.join('|')
  return `${entry.subject}||${teachers}||${students}||${entry.classroom}`
}

function minutesFromHHMM(hhmm) {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

function mergeAdjacentInDay(dayClasses) {
  const parsed = dayClasses
    .map((c) => {
      const parts = String(c.time).split('-')
      if (parts.length < 2) return null
      const start = minutesFromHHMM(parts[0].trim())
      const end = minutesFromHHMM(parts.slice(1).join('-').trim())
      if (start == null || end == null) return null
      return { c, start, end }
    })
    .filter(Boolean)

  parsed.sort((a, b) => a.start - b.start)

  const merged = []
  for (const item of parsed) {
    const last = merged[merged.length - 1]
    if (last && last.end === item.start && classSignature(last.c) === classSignature(item.c)) {
      last.end = item.end
      last.c = { ...last.c, time: `${formatMinutes(last.start)} - ${formatMinutes(last.end)}`, size: 1 }
      continue
    }
    merged.push({
      start: item.start,
      end: item.end,
      c: { ...item.c, size: 1 },
    })
  }

  return merged.map((m) => m.c)
}

function formatMinutes(total) {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function sortAndMergeWeek(dayMap) {
  for (const [day, list] of dayMap.entries()) {
    dayMap.set(day, mergeAdjacentInDay(list))
  }
}

function renderMdx({ slugPrefix, description, title, weekClasses, sidebarLabel }) {
  const slug = `${slugPrefix}/${createURL(title)}`
  const sidebarLabelLine = sidebarLabel ? `\nsidebar_label: ${JSON.stringify(sidebarLabel)}` : ''
  return `---\nslug: ${slug}\ndescription: ${description}${sidebarLabelLine}\n---\nimport { Grid } from \"@site/src/components/Grid\";\nimport BrowserOnly from \"@docusaurus/BrowserOnly\";\nexport const data = {\n  title: ${JSON.stringify(title)},\n  base: \"\",\n  weekClasses: ${JSON.stringify(weekClasses, null, 2)},\n  alert: \"\"\n}\n\n# ${title}\n\n<div>\n  {\n    <BrowserOnly>\n      {() => (\n        <Grid\n          title={data.title}\n          weekClasses={data.weekClasses}\n        />\n      )}\n    </BrowserOnly>\n  }\n</div>\n`
}

function splitCourseAndTurma(fullName) {
  const name = String(fullName ?? '').trim()
  const match = /^(.*?)\s*-\s*(.+)$/.exec(name)
  if (!match) return { courseName: 'Outros', turmaLabel: name }
  return { courseName: match[1].trim(), turmaLabel: match[2].trim() }
}

const COURSE_POSITIONS = new Map([
  ['tec_em_administracao_integrado', 1],
  ['tecnico_integrado_em_administracao_integrado', 1],
  ['tec_em_eventos_integrado', 2],
  ['tecnico_integrado_em_eventos_integrado', 2],
  ['tec_em_informatica_integrado', 3],
  ['tecnico_integrado_em_informatica_integrado', 3],
  ['tec_em_administracao_subsequente', 4],
  ['tec_em_guia_de_turismo_subsequente', 5],
  ['tecnico_em_guia_de_turismo_subsequente', 5],
  ['tec_gastronomia', 6],
  ['tec_gastronomia_proeja', 7],
  ['tecnico_em_gastronomia_proeja', 7],
  ['lic_em_matematica', 8],
  ['licenciatura_em_matematica', 8],
  ['lic_em_fisica', 9],
  ['licenciatura_em_fisica', 9],
  ['sistemas_para_internet', 10],
  ['tecnologia_em_gastronomia', 11],
])

function getCoursePosition(courseName) {
  const key = createURL(courseName)
  return COURSE_POSITIONS.get(key) ?? 9999
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const csvPath = args.find((arg) => arg !== '--force')
  if (!csvPath) {
    throw new Error(
      'Usage: node scripts/fet-csv-to-mdx.mjs <path-to-timetable.csv> [--force]',
    )
  }

  // Read and validate the entire input before creating or replacing any
  // published timetable directories.
  const csvContent = await readFile(csvPath, 'utf8')
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) {
    throw new Error('The timetable CSV is empty or has no data rows.')
  }

  const header = parseCsvLine(lines[0]).map((value) => value.trim())
  const idx = Object.fromEntries(header.map((value, index) => [value, index]))
  const required = ['Day', 'Hour', 'Students Sets', 'Subject', 'Teachers', 'Room']
  const missingColumns = required.filter((key) => !(key in idx))
  if (missingColumns.length > 0) {
    throw new Error(
      'Missing required CSV column(s): ' + missingColumns.join(', ') +
      '. No timetable files were changed.',
    )
  }

  const rows = []
  const malformedRows = []
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const cols = parseCsvLine(lines[lineIndex])
    if (cols.length !== header.length) {
      malformedRows.push(lineIndex + 1)
      continue
    }

    rows.push({
      lineNumber: lineIndex + 1,
      dayRaw: cols[idx['Day']],
      hourRaw: cols[idx['Hour']],
      studentsRaw: cols[idx['Students Sets']],
      subject: (cols[idx['Subject']] ?? '').trim(),
      teachersRaw: cols[idx['Teachers']],
      roomRaw: (cols[idx['Room']] ?? '').trim(),
    })
  }

  if (malformedRows.length > 0) {
    const examples = malformedRows.slice(0, 10).join(', ')
    const suffix = malformedRows.length > 10 ? ', ...' : ''
    throw new Error(
      'Malformed CSV row(s): ' + examples + suffix +
      '. No timetable files were changed.',
    )
  }

  const usableRows = rows.filter((row) => {
    const dayName = DAY_MAP.get(row.dayRaw?.trim()) ?? row.dayRaw?.trim()
    return Boolean(dayName && parseHourRange(row.hourRaw?.trim()) && row.subject)
  })

  // For this campus timetable a very small input is usually a wrong file or
  // an incomplete export. --force is available for intentionally small data.
  const minimumRows = 20
  if (usableRows.length === 0) {
    throw new Error('No valid timetable entries were found. No timetable files were changed.')
  }
  if (usableRows.length < minimumRows && !force) {
    throw new Error(
      'Only ' + usableRows.length + ' valid timetable entries were found; at least ' +
      minimumRows + ' are required for safety. If this small timetable is intentional, ' +
      'rerun with --force. No timetable files were changed.',
    )
  }

  const repoRoot = process.cwd()
  const docsRoot = path.join(repoRoot, 'docs')
  const stageRoot = await mkdtemp(path.join(repoRoot, '.fet-csv-to-mdx-'))
  const generatedRoot = path.join(stageRoot, 'new')
  const backupRoot = path.join(stageRoot, 'backup')
  await mkdir(generatedRoot, { recursive: true })
  await mkdir(backupRoot, { recursive: true })

  const professorDir = path.join(generatedRoot, 'professor')
  const turmaDir = path.join(generatedRoot, 'turma')
  const salaDir = path.join(generatedRoot, 'sala')
  await mkdir(professorDir, { recursive: true })
  await mkdir(turmaDir, { recursive: true })
  await mkdir(salaDir, { recursive: true })

  const teachersMap = new Map()
  const studentsMap = new Map()
  const roomsMap = new Map()

  function ensureEntity(map, name) {
    if (!map.has(name)) map.set(name, ensureDaysMap())
    return map.get(name)
  }

  for (const row of usableRows) {
    const { dayRaw, hourRaw, studentsRaw, subject, teachersRaw, roomRaw } = row
    const dayName = DAY_MAP.get(dayRaw?.trim()) ?? dayRaw?.trim()
    const hour = parseHourRange(hourRaw?.trim())

    const teachers = splitPlus(teachersRaw)
    const students = splitPlus(studentsRaw)
    const classroom = roomRaw || 'Indefinido'

    const entry = {
      subject,
      size: 1,
      teachers,
      classroom,
      students,
      time: hour,
      color: '',
    }

    for (const teacher of teachers) {
      const dayMap = ensureEntity(teachersMap, teacher)
      if (!dayMap.has(dayName)) dayMap.set(dayName, [])
      dayMap.get(dayName).push(entry)
    }

    for (const student of students) {
      const dayMap = ensureEntity(studentsMap, student)
      if (!dayMap.has(dayName)) dayMap.set(dayName, [])
      dayMap.get(dayName).push(entry)
    }

    const roomName = classroom
    if (roomName && roomName !== 'Indefinido') {
      const dayMap = ensureEntity(roomsMap, roomName)
      if (!dayMap.has(dayName)) dayMap.set(dayName, [])
      dayMap.get(dayName).push(entry)
    }
  }

  function writeEntityDocs(map, dir, slugPrefix, filePrefix) {
    return Promise.all(
      Array.from(map.entries()).map(async ([name, dayMap]) => {
        sortAndMergeWeek(dayMap)
        const weekClasses = toWeekClasses(dayMap)
        const fileStem = `${filePrefix}${safeFileStem(name)}`
        const content = renderMdx({
          slugPrefix,
          description: name,
          title: name,
          weekClasses,
        })
        await writeFile(path.join(dir, `${fileStem}.mdx`), content, 'utf8')
      }),
    )
  }

  async function writeTurmaDocs(map) {
    const createdCourseDirs = new Set()
    await Promise.all(
      Array.from(map.entries()).map(async ([fullName, dayMap]) => {
        const { courseName, turmaLabel } = splitCourseAndTurma(fullName)
        const courseDirName = safeFileStem(courseName)
        const courseDir = path.join(turmaDir, courseDirName)

        if (!createdCourseDirs.has(courseDirName)) {
          createdCourseDirs.add(courseDirName)
          await mkdir(courseDir, { recursive: true })
          await writeFile(
            path.join(courseDir, '_category_.json'),
            JSON.stringify({ label: courseName, position: getCoursePosition(courseName) }, null, 2),
            'utf8',
          )
        } else {
          await mkdir(courseDir, { recursive: true })
        }

        sortAndMergeWeek(dayMap)
        const weekClasses = toWeekClasses(dayMap)
        const fileStem = `t_${safeFileStem(fullName)}`
        const content = renderMdx({
          slugPrefix: '/turma',
          description: fullName,
          title: fullName,
          sidebarLabel: turmaLabel,
          weekClasses,
        })
        await writeFile(path.join(courseDir, `${fileStem}.mdx`), content, 'utf8')
      }),
    )
  }

  await writeEntityDocs(teachersMap, professorDir, '/professor', 'p_')
  await writeTurmaDocs(studentsMap)
  await writeEntityDocs(roomsMap, salaDir, '/sala', 's_')

  const counts = {
    professors: teachersMap.size,
    turmas: studentsMap.size,
    salas: roomsMap.size,
  }
  if (counts.professors === 0 || counts.turmas === 0 || counts.salas === 0) {
    throw new Error(
      'Generated timetable data is incomplete (at least one entity type is empty). ' +
      'The current published directories were not changed.',
    )
  }

  // Build everything in a temporary directory first. Only after generation
  // succeeds do we swap the three generated folders into docs/.
  const outputs = [
    {
      name: 'professor',
      target: path.join(docsRoot, 'professor'),
      staged: professorDir,
      backup: path.join(backupRoot, 'professor'),
    },
    {
      name: 'turma',
      target: path.join(docsRoot, 'turma'),
      staged: turmaDir,
      backup: path.join(backupRoot, 'turma'),
    },
    {
      name: 'sala',
      target: path.join(docsRoot, 'sala'),
      staged: salaDir,
      backup: path.join(backupRoot, 'sala'),
    },
  ]
  const backedUp = new Set()
  const installed = new Set()

  try {
    for (const output of outputs) {
      let targetExists = true
      try {
        await stat(output.target)
      } catch (error) {
        if (error?.code === 'ENOENT') {
          targetExists = false
        } else {
          throw error
        }
      }

      if (targetExists) {
        await rename(output.target, output.backup)
        backedUp.add(output.name)
      }

      await rename(output.staged, output.target)
      installed.add(output.name)
    }
  } catch (commitError) {
    const rollbackErrors = []
    for (const output of [...outputs].reverse()) {
      if (installed.has(output.name)) {
        try {
          await rm(output.target, { recursive: true, force: true })
        } catch (error) {
          rollbackErrors.push(output.name + ' (remove new files): ' + String(error))
        }
      }
      if (backedUp.has(output.name)) {
        try {
          await rename(output.backup, output.target)
        } catch (error) {
          rollbackErrors.push(output.name + ' (restore previous files): ' + String(error))
        }
      }
    }

    if (rollbackErrors.length > 0) {
      throw new Error(
        'Publishing the generated files failed and rollback was incomplete. ' +
        'Do not delete the temporary recovery directory: ' + stageRoot +
        '. Recovery details: ' + rollbackErrors.join('; '),
      )
    }

    await rm(stageRoot, { recursive: true, force: true })
    throw commitError
  }

  await rm(stageRoot, { recursive: true, force: true })

  console.log(
    JSON.stringify(
      {
        ...counts,
        validRows: usableRows.length,
        skippedRows: rows.length - usableRows.length,
        forcedSmallInput: force && usableRows.length < minimumRows,
        publishedDirectories: ['professor', 'turma', 'sala'],
      },
      null,
      2,
    ),
  )
}

await main()