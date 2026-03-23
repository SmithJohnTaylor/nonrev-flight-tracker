import { useState, useMemo, useEffect } from 'react'
import UploadZone from './components/UploadZone.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import YearFilter from './components/YearFilter.jsx'
import PersonFilter from './components/PersonFilter.jsx'
import FlightTable from './components/FlightTable.jsx'
import RouteMap from './components/RouteMap.jsx'
import { parseFile } from './utils/parseFlights.js'

export default function App() {
  const [flights, setFlights] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedPerson, setSelectedPerson] = useState('all')

  // Clear all data from memory when the user leaves or refreshes the page
  useEffect(() => {
    const handleUnload = () => setFlights(null)
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  async function handleFile(file) {
    setLoading(true)
    setError('')
    try {
      const parsed = await parseFile(file)
      setFlights(parsed)
      setSelectedYear('all')
      setSelectedPerson('all')
    } catch (e) {
      setError(e.message || 'Failed to parse CSV')
    } finally {
      setLoading(false)
    }
  }

  function clearData() {
    setFlights(null)
    setError('')
    setSelectedYear('all')
    setSelectedPerson('all')
  }

  const years = useMemo(() => {
    if (!flights) return []
    return [...new Set(flights.map(f => f.year).filter(Boolean))].sort((a, b) => b - a)
  }, [flights])

  const people = useMemo(() => {
    if (!flights) return []
    return [...new Set(flights.map(f => f.person).filter(Boolean))].sort()
  }, [flights])

  const filtered = useMemo(() => {
    if (!flights) return []
    let result = flights
    if (selectedPerson !== 'all') result = result.filter(f => f.person === selectedPerson)
    if (selectedYear !== 'all') result = result.filter(f => f.year === selectedYear)
    return result
  }, [flights, selectedYear, selectedPerson])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Parsing flights…</p>
      </div>
    )
  }

  if (!flights) {
    return (
      <>
        <UploadZone onFile={handleFile} />
        {error && <p className="global-error">{error}</p>}
      </>
    )
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-title">
          <span className="logo-sm">✈</span>
          <h1>NonRev Flight Tracker</h1>
        </div>
        <div className="dash-actions">
          <span className="file-stats">
            {flights.length.toLocaleString()} flights loaded
          </span>
          <button className="clear-btn" onClick={clearData}>
            Clear Data
          </button>
        </div>
      </header>

      <main className="dash-main">
        {people.length > 1 && (
          <PersonFilter people={people} selected={selectedPerson} onChange={setSelectedPerson} />
        )}

        {years.length > 1 && (
          <YearFilter years={years} selected={selectedYear} onChange={setSelectedYear} />
        )}

        <StatsPanel flights={filtered} allFlights={flights} selectedYear={selectedYear} />

        <RouteMap flights={filtered} />

        <section className="table-section-wrap">
          <h2 className="section-title">Flight Log</h2>
          <FlightTable flights={filtered} multiPerson={people.length > 1} />
        </section>
      </main>

      <footer className="dash-footer">
        🔒 No data is stored or transmitted — everything runs in your browser.
      </footer>
    </div>
  )
}
