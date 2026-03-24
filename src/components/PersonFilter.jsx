import { useState } from 'react'

export default function PersonFilter({ people, selected, onChange }) {
  const [open, setOpen] = useState(false)

  function toggle(val) {
    if (selected.includes(val)) {
      const next = selected.filter(p => p !== val)
      onChange(next)
    } else {
      onChange([...selected, val])
    }
  }

  function selectAll() {
    onChange([])
    setOpen(false)
  }

  let label = 'All Travelers'
  if (selected.length === 1) label = selected[0]
  else if (selected.length > 1) label = `${selected.length} travelers`

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
          {people.map(p => (
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
