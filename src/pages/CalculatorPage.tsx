// src/pages/CalculatorPage.tsx
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  type BeltMode,
  type Competitor,
  BELT_CONFIG,
  DEFAULT_POINTS,
  parseCompetitorsFromUrl,
  createCompetitor,
  hasChangedScores,
  anyChangedScores,
  adjustScore,
  assignPlacements,
} from '../components/calculator/calculatorUtils'
import CompetitorRow from '../components/calculator/CompetitorRow'

export default function CalculatorPage() {
  const location = useLocation()
  const [mode, setMode] = useState<BeltMode>('black')
  const [competitors, setCompetitors] = useState<Competitor[]>(() =>
    parseCompetitorsFromUrl(location.search)
  )
  const [confirmModeSwitch, setConfirmModeSwitch] = useState<BeltMode | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  const { competitors: placed, tieBreakApplied } = assignPlacements(competitors, mode)

  // ── Belt toggle ────────────────────────────────────────────────────────
  function handleModeToggle(newMode: BeltMode) {
    if (newMode === mode) return
    if (anyChangedScores(competitors)) {
      setConfirmModeSwitch(newMode)
    } else {
      setMode(newMode)
    }
  }

  function confirmModeChange() {
    if (!confirmModeSwitch) return
    setMode(confirmModeSwitch)
    setCompetitors(cs =>
      cs.map(c => ({ ...c, scores: [DEFAULT_POINTS, DEFAULT_POINTS, DEFAULT_POINTS] as [number, number, number] }))
    )
    setConfirmModeSwitch(null)
  }

  // ── Score adjustment ───────────────────────────────────────────────────
  function handleAdjust(id: string, judgeIndex: 0 | 1 | 2, delta: number) {
    setCompetitors(cs =>
      cs.map(c => (c.id === id ? adjustScore(c, judgeIndex, delta) : c))
    )
  }

  function handleAcceptOutlier(id: string, judgeIndex: 0 | 1 | 2, suggestedPoints: number) {
    setCompetitors(cs =>
      cs.map(c => {
        if (c.id !== id) return c
        const newScores: [number, number, number] = [...c.scores] as [number, number, number]
        newScores[judgeIndex] = suggestedPoints
        return { ...c, scores: newScores }
      })
    )
  }

  // ── Name change ────────────────────────────────────────────────────────
  function handleNameChange(id: string, name: string) {
    setCompetitors(cs => cs.map(c => (c.id === id ? { ...c, name } : c)))
  }

  // ── Add competitor ─────────────────────────────────────────────────────
  function handleAdd() {
    const id = String(Date.now())
    setCompetitors(cs => [...cs, createCompetitor(id)])
  }

  // ── Remove competitor ──────────────────────────────────────────────────
  function handleRemoveRequest(id: string) {
    const competitor = competitors.find(c => c.id === id)
    if (competitor && hasChangedScores(competitor)) {
      setConfirmRemoveId(id)
    } else {
      setCompetitors(cs => cs.filter(c => c.id !== id))
    }
  }

  function confirmRemove() {
    if (!confirmRemoveId) return
    setCompetitors(cs => cs.filter(c => c.id !== confirmRemoveId))
    setConfirmRemoveId(null)
  }

  // ── Reset scores ───────────────────────────────────────────────────────
  function handleReset() {
    setCompetitors(cs =>
      cs.map(c => ({ ...c, scores: [DEFAULT_POINTS, DEFAULT_POINTS, DEFAULT_POINTS] as [number, number, number] }))
    )
  }

  const removingCompetitor = competitors.find(c => c.id === confirmRemoveId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex flex-wrap justify-between items-center gap-2 sticky top-0 z-10">
        <span className="font-bold text-lg">Division Calculator</span>
        {/* Belt toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          {(['black', 'colour'] as BeltMode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeToggle(m)}
              aria-pressed={mode === m}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === m ? 'bg-white text-gray-900' : 'bg-transparent text-gray-300 hover:text-white'
              }`}
            >
              {BELT_CONFIG[m].label}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400">{competitors.length} competitors</span>
      </div>

      {/* Tie-break note */}
      {tieBreakApplied && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-xs text-blue-700 text-center">
          Tie broken by highest scores
        </div>
      )}

      {/* Mobile list */}
      <div className="md:hidden px-4 pt-4">
        {competitors.map(c => (
          <CompetitorRow
            key={c.id}
            competitor={c}
            placed={placed.find(p => p.id === c.id)}
            mode={mode}
            onAdjust={(idx, delta) => handleAdjust(c.id, idx, delta)}
            onNameChange={name => handleNameChange(c.id, name)}
            onRemove={() => handleRemoveRequest(c.id)}
            onAcceptOutlier={(idx, pts) => handleAcceptOutlier(c.id, idx, pts)}
          />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block px-6 pt-6">
        <table className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Judge 1</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Judge 2</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Judge 3</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Pts</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Place</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {competitors.map(c => (
              <CompetitorRow
                key={c.id}
                competitor={c}
                placed={placed.find(p => p.id === c.id)}
                mode={mode}
                onAdjust={(idx, delta) => handleAdjust(c.id, idx, delta)}
                onNameChange={name => handleNameChange(c.id, name)}
                onRemove={() => handleRemoveRequest(c.id)}
                onAcceptOutlier={(idx, pts) => handleAcceptOutlier(c.id, idx, pts)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Action bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 mt-6">
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add Competitor
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      {/* Confirm belt-mode switch dialog */}
      {confirmModeSwitch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Switch Belt Mode?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will reset all scores to the {BELT_CONFIG[confirmModeSwitch].label} default.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModeSwitch(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModeChange}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium"
              >
                Switch
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
