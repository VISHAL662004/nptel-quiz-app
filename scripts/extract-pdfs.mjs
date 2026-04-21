import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFParse } from 'pdf-parse'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const sourceRoot = path.resolve(root, '..')

const FILES = ['2024.pdf', '2025.pdf', '2026.pdf']

function normalizeText(text) {
  return text
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\t+/g, ' ')
    .replace(/ +/g, ' ')
}

function cleanLine(line) {
  return line.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
}

function isNoiseLine(line) {
  return (
    /^_{10,}$/.test(line) ||
    /^-{2,}\s*\d+\s+of\s+\d+\s*-{2,}$/i.test(line) ||
    /^NPTEL Online Certification Courses$/i.test(line) ||
    /^Indian Institute of Technology Kharagpur$/i.test(line) ||
    /^\*+END\*+$/i.test(line) ||
    /^Week\s*\d+$/i.test(line) ||
    /^TYPE OF QUESTION:/i.test(line) ||
    /^Number of questions:/i.test(line) ||
    /^Assignment-Week\s*\d+$/i.test(line)
  )
}

function inferMissingAnswer({ year, week, questionNumber, prompt, options }) {
  const normalizedPrompt = prompt.toLowerCase()

  if (year === '2025' && week === 2 && questionNumber === 3 && normalizedPrompt.includes('mqtt protocol follows')) {
    const option = options.find((item) => /publish-subscribe/i.test(item.text))
    if (option) {
      return {
        correctAnswer: option.key,
        correctText: option.text,
        solution: 'MQTT protocol follows Publish-Subscribe paradigm for exchanging messages.',
      }
    }
  }

  return null
}

function splitByWeek(text) {
  const regex = /Assignment-Week\s*(\d+)/gi
  const matches = [...text.matchAll(regex)]
  if (matches.length === 0) {
    return []
  }

  return matches.map((match, index) => {
    const week = Number(match[1])
    const start = match.index ?? 0
    const end = index + 1 < matches.length ? matches[index + 1].index : text.length
    return { week, block: text.slice(start, end) }
  })
}

function parseQuestion(block, year, week, questionNumber) {
  const normalized = normalizeText(block)
    .replace(/QUESTION\s*\d+\s*:/i, '')
    .trim()

  const solutionMatch = normalized.match(/Detailed Solution\s*:\s*([\s\S]*)$/i)
  const answerMatch = normalized.match(/Correct Answer\s*:\s*([a-d])\b[^\n]*/i)

  let body = normalized
  let solution = 'Solution not found in source text.'

  if (solutionMatch) {
    solution = solutionMatch[1].trim()
    body = normalized.slice(0, solutionMatch.index).trim()
  }

  let correctAnswer = ''
  if (answerMatch) {
    correctAnswer = answerMatch[1].toLowerCase()
    body = body.slice(0, answerMatch.index).trim()
  }

  const lines = body
    .split('\n')
    .map((line) => cleanLine(line))
    .filter((line) => line.length > 0 && !isNoiseLine(line))

  const optionLines = []
  let promptParts = []
  let optionStarted = false

  for (const line of lines) {
    if (/^\(?[a-d]\)?[.)]?\s+/i.test(line) || /^\(?[1-4]\)?[.)]?\s+/i.test(line)) {
      optionStarted = true
    }

    if (optionStarted) {
      optionLines.push(line)
    } else {
      promptParts.push(line)
    }
  }

  if (promptParts.length === 0 && lines.length > 0) {
    promptParts = [lines[0]]
  }

  const options = []
  let active = null
  let numericOptionIndex = 0

  for (const line of optionLines) {
    const optionMatch = cleanLine(line).match(/^\(?(?<label>[a-d1-4])\)?[.)]?\s*(?<text>.*)$/i)
    if (optionMatch) {
      const label = optionMatch.groups?.label?.toLowerCase() ?? ''
      const key = /^[1-4]$/.test(label)
        ? ['a', 'b', 'c', 'd'][Number(label) - 1]
        : label

      active = {
        key,
        text: optionMatch.groups?.text?.trim() ?? '',
      }
      options.push(active)
      numericOptionIndex += 1
      continue
    }

    if (active) {
      active.text = `${active.text} ${line}`.trim()
    }
  }

  const inferred = !correctAnswer
    ? inferMissingAnswer({ year, week, questionNumber, prompt: promptParts.join(' ').trim(), options })
    : null

  const finalCorrectAnswer = correctAnswer || inferred?.correctAnswer || ''
  const finalCorrectText =
    options.find((option) => option.key === finalCorrectAnswer)?.text ?? inferred?.correctText ?? 'Not detected from options'
  const finalSolution = solutionMatch ? solution : inferred?.solution ?? solution

  if (options.length < 2) {
    return null
  }

  return {
    id: `${year}-W${week}-Q${questionNumber}`,
    prompt: promptParts.join(' ').trim(),
    options,
    correctAnswer: finalCorrectAnswer,
    correctText: finalCorrectText,
    solution: finalSolution,
    year,
    week,
  }
}

function parseWeekQuestions(weekBlock, year, week) {
  const regex = /QUESTION\s*(\d+)\s*:/gi
  const matches = [...weekBlock.matchAll(regex)]

  const questions = []

  if (matches.length > 0) {
    const firstMatch = matches[0]
    const leading = weekBlock.slice(0, firstMatch.index ?? 0).trim()
    const leadingLines = leading
      .split('\n')
      .map((line) => cleanLine(line))
      .filter((line) => line.length > 0 && !isNoiseLine(line))

    const looksLikeQuestion =
      leadingLines.some((line) => /^(Correct Answer|Detailed Solution|[a-d][.)]|\(?[1-4]\)?[.)])\s+/i.test(line)) ||
      leadingLines.filter((line) => /^(?:\(?[a-d]\)?|\(?[1-4]\)?)[.)]?\s+/i.test(line)).length >= 2

    if (looksLikeQuestion) {
      const parsed = parseQuestion(leading, year, week, 1)
      if (parsed) {
        questions.push(parsed)
      }
    }
  }

  if (matches.length === 0 && questions.length === 0) {
    return []
  }

  for (let index = 0; index < matches.length; index += 1) {
    const qNumber = Number(matches[index][1])
    const start = matches[index].index ?? 0
    const end = index + 1 < matches.length ? matches[index + 1].index : weekBlock.length
    const questionText = weekBlock.slice(start, end)
    const parsed = parseQuestion(questionText, year, week, qNumber)

    if (parsed) {
      questions.push(parsed)
    }
  }

  return questions
}

async function parsePdf(fileName) {
  const pdfPath = path.join(sourceRoot, fileName)
  const bytes = await fs.readFile(pdfPath)
  const parser = new PDFParse({ data: bytes })
  const result = await parser.getText()
  await parser.destroy()

  const year = fileName.replace('.pdf', '')
  const normalizedText = normalizeText(result.text)
  const weeks = splitByWeek(normalizedText).map(({ week, block }) => ({
    week,
    questions: parseWeekQuestions(block, year, week),
  }))

  return {
    year,
    weeks,
  }
}

async function main() {
  const years = []
  for (const file of FILES) {
    years.push(await parsePdf(file))
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    years,
  }

  const outPath = path.join(root, 'public', 'data', 'quiz-data.json')
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8')

  const totals = payload.years.map((year) => ({
    year: year.year,
    weeks: year.weeks.length,
    questions: year.weeks.reduce((sum, week) => sum + week.questions.length, 0),
  }))

  console.log('Created public/data/quiz-data.json')
  console.table(totals)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
