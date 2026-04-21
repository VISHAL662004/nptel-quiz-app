import { BookOpen, Flame, Layers, Play, Target } from 'lucide-react'
import { useMemo } from 'react'
import { useQuiz } from '../context/QuizContext'

export function ControlPanel() {
  const { dataset, selection, setSelection, bookmarks, startQuiz } = useQuiz()

  const selectedYear = useMemo(
    () => dataset?.years.find((item) => item.year === selection.year),
    [dataset, selection.year],
  )

  const weeks = selectedYear?.weeks.map((week) => week.week) ?? []

  return (
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
  )
}
