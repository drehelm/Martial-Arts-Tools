import React, { useState } from 'react';
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";

// Mapping of decimal scores to integer point values
const scoreMapping = {
  9.93: 6,
  9.94: 5,
  9.95: 4,
  9.96: 3,
  9.97: 2,
  9.98: 1,
  9.99: 0,
};

// Create a competitor object with default fields
const createCompetitor = (id) => ({
  id,
  name: "",
  scores: ["", "", ""],
  total: null,
  placement: null,
  error: null,
  tieBreakMessage: null,
  debug: null,
  scoreHistory: [], // track changes to scores over time
  suggestion: null, // store info about suggested changes
});

// Initialize with 5 competitors
const initialCompetitors = Array.from({ length: 5 }, (_, i) => createCompetitor(i + 1));

export default function KarateScoreCalculator() {
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [showDebug, setShowDebug] = useState(false);

  // Helper for integer-based comparison up to two decimal places
  const toHundred = (val) => Math.round(val * 100);

  // Add a new competitor
  const addCompetitor = () => {
    const newId = competitors.length
      ? Math.max(...competitors.map((c) => c.id)) + 1
      : 1;
    setCompetitors([...competitors, createCompetitor(newId)]);
  };

  // Remove competitor
  const removeCompetitor = (id) => {
    setCompetitors(competitors.filter((comp) => comp.id !== id));
  };

  // Update competitor's name or other field
  const handleInputChange = (id, field, value) => {
    setCompetitors(
      competitors.map((comp) =>
        comp.id === id ? { ...comp, [field]: value } : comp
      )
    );
  };

  // Update a competitor's score array by index
  const handleScoreChange = (id, index, value) => {
    setCompetitors(
      competitors.map((comp) => {
        if (comp.id !== id) return comp;
        const updatedScores = comp.scores.map((s, i) =>
          i === index ? value : s
        );
        return { ...comp, scores: updatedScores };
      })
    );
  };

  // Accept a suggestion for a competitor (adjust outlier)
  const handleAcceptSuggestion = (id) => {
    setCompetitors(
      competitors.map((comp) => {
        if (comp.id !== id || !comp.suggestion) return comp;
        const { updatedScores, reason } = comp.suggestion;
        // Store previous scores
        const oldScores = comp.scores;

        return {
          ...comp,
          scores: updatedScores, // apply the new suggested scores
          scoreHistory: [
            ...comp.scoreHistory,
            {
              before: [...oldScores],
              after: [...updatedScores],
              reason,
              timestamp: new Date().toISOString(),
            },
          ],
          suggestion: null,
          error: null,
        };
      })
    );
  };

  // Reject a suggestion for a competitor
  const handleRejectSuggestion = (id) => {
    setCompetitors(
      competitors.map((comp) =>
        comp.id === id ? { ...comp, suggestion: null } : comp
      )
    );
  };

  // Check if a score is strictly more than 0.02 away from both other scores
  // Using integer-based comparisons to avoid floating-precision issues.
  const checkScoreDiscrepancy = (scores) => {
    const numericScores = scores
      .map((value) => parseFloat(parseFloat(value).toFixed(3)))
      .sort((a, b) => a - b);

    const [low, mid, high] = numericScores;
    const diffLM = toHundred(mid - low);
    const diffHM = toHundred(high - mid);
    const diffHL = toHundred(high - low);
    const threshold = 2; // i.e. 0.02 in hundredths

    const highIsOutlier = diffHM > threshold && diffHL > threshold;
    const lowIsOutlier = diffLM > threshold && diffHL > threshold;

    if (highIsOutlier) {
      const suggestedValue = (mid + 0.02).toFixed(2);
      return {
        errorText: `Score discrepancy > 0.02. Suggest adjusting the high score down to about ${suggestedValue}`,
        debugText: `Scores: [${numericScores.join(
          ","
        )}], diffLM=${diffLM}, diffHM=${diffHM}, diffHL=${diffHL} | highIsOutlier`,
        outlierIndex: scores.findIndex((val) => parseFloat(val) === high),
        suggestedValue,
        reason: `Adjusted high score from ${high} to ${suggestedValue}`,
      };
    } else if (lowIsOutlier) {
      const suggestedValue = (mid - 0.02).toFixed(2);
      return {
        errorText: `Score discrepancy > 0.02. Suggest adjusting the low score up to about ${suggestedValue}`,
        debugText: `Scores: [${numericScores.join(
          ","
        )}], diffLM=${diffLM}, diffHM=${diffHM}, diffHL=${diffHL} | lowIsOutlier`,
        outlierIndex: scores.findIndex((val) => parseFloat(val) === low),
        suggestedValue,
        reason: `Adjusted low score from ${low} to ${suggestedValue}`,
      };
    }

    return {
      errorText: null,
      debugText: `Scores: [${numericScores.join(
        ","
      )}], diffLM=${diffLM}, diffHM=${diffHM}, diffHL=${diffHL} | noOutlier`,
      outlierIndex: null,
      suggestedValue: null,
      reason: null,
    };
  };

  // Calculate total points, check tie-break, set placement
  const calculateScores = () => {
    const scored = competitors.map((comp) => {
      const allFilled = comp.scores.every((score) => score !== "");
      const total = allFilled
        ? comp.scores.reduce(
            (sum, score) => sum + (scoreMapping[parseFloat(score)] || 0),
            0
          )
        : null;

      const highestScores = allFilled
        ? comp.scores.filter(
            (s) => parseFloat(s) === Math.max(...comp.scores.map(parseFloat))
          ).length
        : 0;

      let errorText = null;
      let debugText = null;
      let outlierIndex = null;
      let suggestedValue = null;
      let reason = null;

      if (allFilled) {
        const result = checkScoreDiscrepancy(comp.scores);
        errorText = result.errorText;
        debugText = result.debugText;
        outlierIndex = result.outlierIndex;
        suggestedValue = result.suggestedValue;
        reason = result.reason;
      }

      let suggestion = null;
      if (suggestedValue && outlierIndex !== null && outlierIndex >= 0) {
        const updatedScores = comp.scores.map((val, i) =>
          i === outlierIndex ? suggestedValue : val
        );
        suggestion = { updatedScores, reason };
      }

      return {
        ...comp,
        error: errorText,
        debug: debugText,
        total,
        highestScores,
        tieBreakMessage: null,
        suggestion,
      };
    });

    // Sort by total ascending, then by highestScores descending
    const ranked = scored
      .filter((comp) => comp.total !== null)
      .sort((a, b) => a.total - b.total || b.highestScores - a.highestScores);

    // Assign placement
    ranked.forEach((comp, index) => {
      comp.placement = index + 1;
    });

    // Detect ties (same total) -> show tie-break message
    let i = 0;
    while (i < ranked.length) {
      let j = i + 1;
      while (j < ranked.length && ranked[j].total === ranked[i].total) j++;
      const groupSize = j - i;
      if (groupSize > 1) {
        for (let k = i; k < j; k++) {
          ranked[k].tieBreakMessage =
            "Tie-break used: decided by highest scores.";
        }
      }
      i = j;
    }

    // Merge everything back
    const updated = scored.map((comp) => ranked.find((r) => r.id === comp.id) || comp);
    setCompetitors(updated);
  };

  const resetScores = () => {
    setCompetitors(initialCompetitors);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Karate Tournament Score Calculator</h1>
      <div className="flex space-x-2 mb-4 items-center">
        <Button onClick={addCompetitor} className="bg-blue-500 text-white">
          Add Competitor
        </Button>
        <Button onClick={calculateScores} className="bg-green-500 text-white">
          Calculate Scores
        </Button>
        <Button onClick={resetScores} className="bg-gray-500 text-white">
          Reset
        </Button>
        <div className="flex items-center space-x-1 ml-4">
          <input
            id="debugToggle"
            type="checkbox"
            checked={showDebug}
            onChange={(e) => setShowDebug(e.target.checked)}
          />
          <label htmlFor="debugToggle" className="text-sm">
            Show Debug
          </label>
        </div>
      </div>

      {competitors.map((comp, idx) => (
        <Card key={comp.id} className="p-2 flex flex-col space-y-2">
          {/* Row with name/score entry + remove button */}
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-2 mr-4">
              {/* Competitor label + name input */}
              <div className="space-y-1">
                <label className="font-semibold">
                  Competitor #{idx + 1}
                </label>
                <input
                  type="text"
                  placeholder="Competitor Name"
                  className="border p-1 w-full"
                  value={comp.name}
                  onChange={(e) => handleInputChange(comp.id, "name", e.target.value)}
                />
              </div>

              {/* Score steppers */}
              <div className="flex flex-wrap gap-4 mt-2">
                {comp.scores.map((score, i) => {
                  const numericScore = parseFloat(score) || 9.93;
                  const incrementScore = (delta) => {
                    let newVal = numericScore + delta;
                    if (newVal < 9.93) newVal = 9.93;
                    if (newVal > 9.99) newVal = 9.99;
                    handleScoreChange(comp.id, i, newVal.toFixed(2));
                  };
                  return (
                    <div key={i} className="flex items-center space-x-2">
                      <Button
                        className="bg-gray-300 text-black px-2"
                        onClick={() => incrementScore(-0.01)}
                      >
                        -
                      </Button>
                      <div className="w-14 text-center border p-1">
                        {numericScore.toFixed(2)}
                      </div>
                      <Button
                        className="bg-gray-300 text-black px-2"
                        onClick={() => incrementScore(0.01)}
                      >
                        +
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Error, Debug, Tie-Break, etc. */}
              {comp.error && (
                <p className="text-red-500">Error: {comp.error}</p>
              )}
              {showDebug && comp.debug && (
                <p className="text-xs text-gray-500">Debug: {comp.debug}</p>
              )}
              {comp.tieBreakMessage && (
                <p className="text-blue-500">{comp.tieBreakMessage}</p>
              )}
              <p>Total Points: {comp.total ?? "Not Calculated"}</p>
              <p>Placement: {comp.placement ?? "Not Ranked"}</p>
            </div>

            {/* Remove competitor button */}
            {competitors.length > 1 && (
              <Button
                onClick={() => removeCompetitor(comp.id)}
                className="bg-red-500 text-white"
              >
                Remove
              </Button>
            )}
          </div>

          {/* Suggested fix for outlier scores */}
          {comp.suggestion && comp.suggestion.updatedScores && (
            <div className="bg-yellow-100 p-2 rounded">
              <p className="text-sm text-gray-700">
                Suggested new scores: {comp.suggestion.updatedScores.join(", ")}
              </p>
              <p className="text-sm text-gray-500">
                Reason: {comp.suggestion.reason}
              </p>
              <div className="mt-2 space-x-2">
                <Button
                  className="bg-blue-500 text-white"
                  onClick={() => handleAcceptSuggestion(comp.id)}
                >
                  Accept Suggestion
                </Button>
                <Button
                  className="bg-gray-400 text-white"
                  onClick={() => handleRejectSuggestion(comp.id)}
                >
                  Reject Suggestion
                </Button>
              </div>
            </div>
          )}

          {/* Score history of changes */}
          {comp.scoreHistory && comp.scoreHistory.length > 0 && (
            <div className="mt-2 bg-gray-50 p-2 rounded">
              <p className="font-semibold mb-1">Score History:</p>
              {comp.scoreHistory.map((entry, idx) => (
                <div key={idx} className="text-sm border-b py-1">
                  <p className="text-gray-600">
                    Before: {entry.before.join(", ")} | After: {entry.after.join(", ")}
                  </p>
                  <p className="text-gray-500">
                    Reason: {entry.reason}, Time:{" "}
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
