import { useRef, useState } from 'react'

export default function UploadZone({ onFile }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  function handleFile(file) {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file')
      return
    }
    setError('')
    onFile(file)
  }

  return (
    <div className="upload-page">
      <div className="upload-header">
        <div className="logo">✈</div>
        <h1>NonRev Flight Tracker</h1>
        <p className="subtitle">Calculate miles flown on Delta non-rev benefits</p>
        <div className="privacy-badge">🔒 100% private — nothing is uploaded, stored, or tracked</div>
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
        <p className="drop-title">Drop your flight history CSV here</p>
        <p className="drop-sub">or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {error && <p className="upload-error">{error}</p>}

      <div className="upload-instructions">
        <h3>How to export your flight history from Delta Net</h3>
        <ol>
          <li>Log in to <strong>DeltaNet</strong></li>
          <li>Go to <strong>Travel &gt; Non-Rev History</strong></li>
          <li>Export or download your history as a <strong>CSV file</strong></li>
          <li>Drop the file above</li>
        </ol>
        <p className="instructions-note">
          Expects a <code>Route</code> column with values like <code>ATL/DTW</code>. Other columns
          (<code>Date</code>, <code>DL Flight No</code>, <code>Priority</code>) are optional.
        </p>
      </div>

      <div className="privacy-details">
        <h3>Your privacy</h3>
        <ul>
          <li>Your CSV is processed <strong>entirely in your browser</strong> — no data is ever sent to a server</li>
          <li>Names, employee IDs, and other personal information are <strong>discarded immediately</strong> during parsing and never stored</li>
          <li>No cookies, no local storage, no analytics, no tracking</li>
          <li>All flight data is cleared from memory when you close the tab, refresh, or click "Clear Data"</li>
        </ul>
      </div>
    </div>
  )
}
