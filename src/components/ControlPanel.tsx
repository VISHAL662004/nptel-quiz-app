import { BookOpen, Flame, Layers, Play, Target } from 'lucide-react'
import { useMemo } from 'react'
import { useQuiz } from '../context/QuizContext'

export function ControlPanel() {
  const {
    dataset,
    selection,
    setSelection,
    bookmarks,
    startQuiz,
    customWeekSelection,
    setCustomWeekSelection,
    customQuizOrder,
    setCustomQuizOrder,
  } = useQuiz()

  const selectedYear = useMemo(
    () => dataset?.years.find((item) => item.year === selection.year),
    [dataset, selection.year],
  )

  const weeks = selectedYear?.weeks.map((week) => week.week) ?? []

  const selectedCustomCount = useMemo(
    () =>
      Object.values(customWeekSelection).reduce(
        (total, weekList) => total + weekList.length,
        0,
      ),
    [customWeekSelection],
  )

  const setWeeksForYear = (year: string, nextWeeks: number[]) => {
    setCustomWeekSelection(
      nextWeeks.length === 0
        ? Object.fromEntries(
            Object.entries(customWeekSelection).filter(([key]) => key !== year),
          )
        : { ...customWeekSelection, [year]: nextWeeks },
    )
  }

  const toggleCustomYear = (year: string) => {
    const yearWeeks = dataset?.years.find((item) => item.year === year)?.weeks.map((week) => week.week) ?? []
    const selectedWeeks = customWeekSelection[year] ?? []
    const isFullySelected = yearWeeks.length > 0 && selectedWeeks.length === yearWeeks.length

    setWeeksForYear(year, isFullySelected ? [] : yearWeeks)
  }

  const toggleCustomWeek = (year: string, week: number) => {
    const selectedWeeks = customWeekSelection[year] ?? []
    const nextWeeks = selectedWeeks.includes(week)
      ? selectedWeeks.filter((item) => item !== week)
      : [...selectedWeeks, week].sort((a, b) => a - b)

    setWeeksForYear(year, nextWeeks)
  }

  return (
    <>
      <aside className="panel setup-panel">
        <div className="panel-title-row">
          <h2>Quiz Console</h2>
        </div>

        <div className="grid-2">
          <button
            className={`select-btn ${selection.scope === 'year' ? 'active' : ''}`}
            onClick={() => setSelection({ scope: 'year' })}
          >
            <Layers size={16} /> Year-wise
          </button>
          <button
            className={`select-btn ${selection.scope === 'week' ? 'active' : ''}`}
            onClick={() => setSelection({ scope: 'week' })}
          >
            <Target size={16} /> Week-wise
          </button>
        </div>

        <button
          className={`select-btn full-btn ${selection.scope === 'full' ? 'active' : ''}`}
          onClick={() => setSelection({ scope: 'full' })}
        >
          <BookOpen size={16} /> Full Syllabus
        </button>

        <label className="field">
          <span>Year</span>
          <select
            value={selection.year}
            onChange={(event) =>
              setSelection({
                year: event.target.value,
                week: 1,
              })
            }
            disabled={selection.scope === 'full'}
          >
            {dataset?.years.map((year) => (
              <option key={year.year} value={year.year}>
                {year.year}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Week</span>
          <select
            value={selection.week}
            disabled={selection.scope !== 'week'}
            onChange={(event) => setSelection({ week: Number(event.target.value) })}
          >
            {weeks.map((week) => (
              <option key={week} value={week}>
                Week {week}
              </option>
            ))}
          </select>
        </label>

        {/* <label className="field">
          <span>Search or filter topics</span>
          <div className="input-wrap">
            <Search size={16} />
            <input
              value={selection.searchTerm}
              onChange={(event) => setSelection({ searchTerm: event.target.value })}
              placeholder="Search question text or solution"
            />
          </div>
        </label> */}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--text-2)' }}>
            Shuffle Options
          </label>
          <div className="grid-2" style={{ gap: '0.5rem' }}>
            <button
              className={`select-btn ${selection.shuffle === 'none' ? 'active' : ''}`}
              onClick={() => setSelection({ shuffle: 'none' })}
              style={{ fontSize: '0.875rem', padding: '0.5rem' }}
            >
              None
            </button>
            <button
              className={`select-btn ${selection.shuffle === 'week' ? 'active' : ''}`}
              onClick={() => setSelection({ shuffle: 'week' })}
              style={{ fontSize: '0.875rem', padding: '0.5rem' }}
              disabled={selection.scope === 'full'}
            >
              Week Shuffle
            </button>
          </div>
          <div className="grid-2" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              className={`select-btn ${selection.shuffle === 'year' ? 'active' : ''}`}
              onClick={() => setSelection({ shuffle: 'year' })}
              style={{ fontSize: '0.875rem', padding: '0.5rem' }}
              disabled={selection.scope === 'full'}
            >
              Year Shuffle
            </button>
            <button
              className={`select-btn ${selection.shuffle === 'random15' ? 'active' : ''}`}
              onClick={() => setSelection({ shuffle: 'random15', scope: 'full' })}
              style={{ fontSize: '0.875rem', padding: '0.5rem' }}
            >
              Random 15
            </button>
          </div>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={selection.bookmarkedOnly}
            onChange={(event) => setSelection({ bookmarkedOnly: event.target.checked })}
          />
          <span>Use bookmarked questions only ({bookmarks.length})</span>
        </label>

        <div className="mode-actions">
          <button className="action-btn" onClick={() => startQuiz('standard')}>
            <Play size={16} /> Start Standard Quiz
          </button>
          <button className="action-btn rapid" onClick={() => startQuiz('rapid')}>
            <Flame size={16} /> Rapid Fire Mode
          </button>
        </div>
      </aside>

      <aside className="panel setup-panel custom-panel">
        <div className="panel-title-row">
          <h2>Custom Week Quiz</h2>
        </div>
        <p className="custom-panel-note">
          Pick any years and any week combinations. The quiz will use only those weeks.
        </p>

        <div className="custom-year-list">
          {dataset?.years.map((year) => {
            const selectedWeeks = customWeekSelection[year.year] ?? []
            const yearWeeks = year.weeks.map((week) => week.week)
            const yearChecked =
              yearWeeks.length > 0 && selectedWeeks.length === yearWeeks.length

            return (
              <section key={year.year} className="custom-year-card">
                <label className="custom-year-toggle">
                  <input
                    type="checkbox"
                    checked={yearChecked}
                    onChange={() => toggleCustomYear(year.year)}
                  />
                  <span>{year.year}</span>
                </label>

                <div className="custom-week-grid">
                  {year.weeks.map((week) => (
                    <label key={week.week} className="custom-week-chip">
                      <input
                        type="checkbox"
                        checked={selectedWeeks.includes(week.week)}
                        onChange={() => toggleCustomWeek(year.year, week.week)}
                      />
                      <span>Week {week.week}</span>
                    </label>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <div className="custom-summary">{selectedCustomCount} weeks selected</div>

        <div className="custom-order-toggle">
          <button
            className={`select-btn ${customQuizOrder === 'serial' ? 'active' : ''}`}
            onClick={() => setCustomQuizOrder('serial')}
            type="button"
          >
            Serial wise
          </button>
          <button
            className={`select-btn ${customQuizOrder === 'shuffle' ? 'active' : ''}`}
            onClick={() => setCustomQuizOrder('shuffle')}
            type="button"
          >
            Shuffle questions
          </button>
        </div>

        <div className="mode-actions">
          <button
            className="action-btn"
            onClick={() => startQuiz('standard', 'custom')}
            disabled={selectedCustomCount === 0}
          >
            <Play size={16} /> Start Custom Standard Quiz
          </button>
          <button
            className="action-btn rapid"
            onClick={() => startQuiz('rapid', 'custom')}
            disabled={selectedCustomCount === 0}
          >
            <Flame size={16} /> Start Custom Rapid Fire
          </button>
        </div>
      </aside>
    </>
  )
}
