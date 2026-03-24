import { useRef, useState } from 'react'

export default function UploadZone({ onFile }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  function handleFile(file) {
    if (!file) return
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setError('Please upload a .csv or .xlsx file')
      return
    }
    setError('')
    onFile(file)
  }

  return (
    <div className="upload-page">
      <div className="upload-header">
        <div className="logo">✈</div>
        <h1>NonRev Flight Explorer</h1>
        <p className="subtitle">Calculate miles flown on your non-rev benefits</p>
      </div>

      <div
        className={`drop-zone ${dragging ? 'dragging' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files[0])
        }}
      >
        <div className="drop-icon">📂</div>
        <p className="drop-title">Drop your flight history file here</p>
        <p className="drop-sub">CSV or Excel (.xlsx) · click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {error && <p className="upload-error">{error}</p>}

      <div className="upload-instructions">
        <p className="instructions-note">
          Expects a <code>Route</code> column with values like <code>ATL/DTW</code>. Other columns
          (<code>Date</code>, <code>DL Flight No</code>, <code>Priority</code>) are detected automatically if present.
        </p>
      </div>

      <div className="privacy-details">
        <h3>Your privacy</h3>
        <ul>
          <li>Your file is processed <strong>entirely in your browser</strong> — no data is ever sent to a server</li>
          <li>Employee IDs and other personal information are <strong>discarded immediately</strong> during parsing and never stored. Abbreviated name codes (e.g. BAS/E) are retained only when multiple travelers are detected, for filtering purposes.</li>
          <li>No cookies, no local storage, no analytics, no tracking</li>
          <li>All flight data is cleared from memory when you close the tab, refresh, or click "Clear Data"</li>
        </ul>
      </div>
    </div>
  )
}
