import { useState } from 'react'

export default function PriorityFilter({ priorities, selected, onChange }) {
  const [open, setOpen] = useState(false)

  function toggle(val) {
    if (selected.includes(val)) {
      onChange(selected.filter(p => p !== val))
    } else {
      onChange([...selected, val])
    }
  }

  function selectAll() {
    onChange([])
    setOpen(false)
  }

  let label = 'All Priorities'
  if (selected.length === 1) label = selected[0]
  else if (selected.length > 1) label = `${selected.length} priorities`

  return (
    <div className="year-filter">
      <button
        className="year-btn active"
        onClick={() => setOpen(o => !o)}
      >
        {label} {open ? '▴' : '▾'}
      </button>
      {open && (
        <>
          <button
            className={`year-btn ${selected.length === 0 ? 'active' : ''}`}
            onClick={selectAll}
          >
            All
          </button>
          {priorities.map(p => (
            <button
              key={p}
              className={`year-btn ${selected.includes(p) ? 'active' : ''}`}
              onClick={() => toggle(p)}
            >
              {p}
            </button>
          ))}
        </>
      )}
    </div>
  )
}
