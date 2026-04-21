# NPTEL Interactive Quiz Platform

A modern dark-theme React application that creates a multi-mode quiz platform from three yearly PDF sources.

## Features

- Year-wise quiz
- Week-wise quiz (inside a selected year)
- Full syllabus quiz (all years)
- Standard mode with next/previous navigation, flagging and submit flow
- Rapid Fire mode with instant correctness feedback and quick transitions
- Detailed results dashboard:
  - Total score
  - Correct vs incorrect
  - Accuracy
  - Weak areas by year/week
  - Question-wise review with selected answer, correct answer and detailed solution
- Search/filter questions
- Bookmark questions and re-run bookmarked-only quizzes
- Local progress persistence

## Data Pipeline

PDFs must exist one level above this project folder:

- ../2024.pdf
- ../2025.pdf
- ../2026.pdf

Generate JSON data from PDFs:

```bash
npm run extract:pdf
```

This command creates:

- public/data/quiz-data.json

## Run Locally

```bash
npm install
npm run extract:pdf
npm run dev
```

Build for production:

```bash
npm run build
```

## Project Structure

- src/context/QuizContext.tsx: global quiz state, timer, persistence, session flow
- src/components/ControlPanel.tsx: mode/year/week/filter controls
- src/components/QuizCard.tsx: question UI, options, rapid feedback, navigation
- src/components/ResultsDashboard.tsx: score, analytics, and breakdown
- src/utils/quiz.ts: pool building, scoring, weak-area aggregation
- src/types/quiz.ts: shared TypeScript models
- scripts/extract-pdfs.mjs: PDF parser and JSON generator

## Notes

- Parsing is heuristic and targets patterns present in the provided PDFs:
  - Assignment-Week <number>
  - QUESTION <number>:
  - Correct Answer:
  - Detailed Solution:
- If the PDF format changes significantly, update extraction rules in scripts/extract-pdfs.mjs.
