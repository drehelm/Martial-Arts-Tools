import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  type Competitor,
  parseCompetitorsFromUrl,
  applyTickChange,
  setTicks,
  updateStatuses,
  assignScores,
  getMaxTicks,
  createInitialCompetitors,
} from '../components/scoresheet/scoresheetUtils'
import CompetitorRow from '../components/scoresheet/CompetitorRow'
import DirectRankPanel from '../components/scoresheet/DirectRankPanel'
import ScoresheetFooter from '../components/scoresheet/ScoresheetFooter'

export default function ScoresheetPage() {
  const location = useLocation()
  const [competitors, setCompetitors] = useState<Competitor[]>(() =>
    parseCompetitorsFromUrl(location.search)
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  function handleTickChange(id: string, delta: number) {
    setActiveId(id)
    setCompetitors(cs => applyTickChange(cs, id, delta))
  }

  function handleDirectRank(ticks: number) {
    if (!activeId) return
    setCompetitors(cs => setTicks(cs, activeId, ticks))
  }

  function handleMax() {
    if (!activeId) return
    const max = getMaxTicks(competitors)
    setCompetitors(cs => setTicks(cs, activeId, max + 1))
  }

  function handleNameChange(id: string, name: string) {
    setCompetitors(cs => cs.map(c => (c.id === id ? { ...c, name } : c)))
  }

  function handleAddCompetitor() {
    const id = String(Date.now())
    setCompetitors(cs => [...cs, { id, name: '', ticks: 0, status: 'empty' }])
  }

  function confirmRemove() {
    if (!confirmRemoveId) return
    setCompetitors(cs => cs.filter(c => c.id !== confirmRemoveId))
    if (activeId === confirmRemoveId) setActiveId(null)
    setConfirmRemoveId(null)
  }

  function confirmResetAction() {
    setCompetitors(createInitialCompetitors())
    setActiveId(null)
    setConfirmReset(false)
  }

  const removingCompetitor = competitors.find(c => c.id === confirmRemoveId)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <span className="font-bold text-lg">Ref Scoresheet</span>
        <span className="text-sm text-gray-400">{competitors.length} competitors</span>
      </div>

      {/* Competitor list */}
      <div className="flex-1 overflow-y-auto">
        {competitors.map(c => (
          <CompetitorRow
            key={c.id}
            competitor={c}
            isActive={c.id === activeId}
            onTickChange={delta => handleTickChange(c.id, delta)}
            onNameChange={name => handleNameChange(c.id, name)}
            onRemove={() => setConfirmRemoveId(c.id)}
          />
        ))}
      </div>

      {/* Direct rank panel */}
      <DirectRankPanel activeId={activeId} onRank={handleDirectRank} onMax={handleMax} />

      {/* Footer */}
      <ScoresheetFooter
        onUpdate={() => setCompetitors(cs => updateStatuses(cs))}
        onAssignScores={() => setCompetitors(cs => assignScores(cs))}
        onAdd={handleAddCompetitor}
        onReset={() => setConfirmReset(true)}
      />

      {/* Confirm reset dialog */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Reset Scoresheet?</h3>
            <p className="text-sm text-gray-600 mb-4">This will clear all competitors and rankings.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetAction}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove dialog */}
      {confirmRemoveId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Remove Competitor?</h3>
            <p className="text-sm text-gray-600 mb-4">
              {removingCompetitor?.name || 'This competitor'} will be removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemoveId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemove}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
