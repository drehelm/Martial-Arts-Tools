import React, { useState } from 'react';
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "./components/ui/dialog";

export default function KarateScoringAppV2() {
  const [confirmAction, setConfirmAction] = useState(null);

  // Initialize with 5 competitors. Each competitor has ticks, status, score.
  // We'll no longer track an 'edit' boolean. The user wants the + / - and rank buttons by default.
  const [competitors, setCompetitors] = useState(
    Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Competitor ${i + 1}`,
      ticks: 0,
      status: '',
      score: ''
    }))
  );

  const scoreMapping = {
    1: 9.99,
    2: 9.98,
    3: 9.97,
    4: 9.96,
    5: 9.95,
    6: 9.95,
    7: 9.94,
    8: 9.94,
    default: 9.93
  };

  // Inserts a competitor at the desired rank, pushing others down.
  function insertAtRank(competitorsList, compId, desiredRank) {
    let updated = competitorsList.map((c) => {
      if (c.ticks >= desiredRank) {
        return { ...c, ticks: c.ticks + 1 };
      }
      return c;
    });

    // Now set the target competitor's rank to desiredRank.
    updated = updated.map((c) => {
      if (c.id === compId) {
        return { ...c, ticks: desiredRank, status: 'green' };
      }
      return c;
    });

    return updated;
  }

  // Adjust competitor's ticks (rank) by a delta.
  const adjustPlace = (id, change) => {
    setCompetitors((prev) =>
      prev.map((comp) => {
        if (comp.id !== id) return comp;
        const newTicks = Math.max(0, comp.ticks + change);
        let newStatus = comp.status;
        // If going from 0 => >0, becomes blue.
        if (comp.ticks === 0 && newTicks > 0) {
          newStatus = 'blue';
        } else if (newTicks === 0) {
          newStatus = '';
        }
        return { ...comp, ticks: newTicks, status: newStatus };
      })
    );
  };

  // Sets an exact rank.
  const setExactRank = (id, rank) => {
    setCompetitors((prev) => {
      const comp = prev.find((c) => c.id === id);
      if (!comp) return prev;

      const diff = rank - comp.ticks;
      return prev.map((c) => {
        if (c.id === id) {
          const newTicks = Math.max(0, c.ticks + diff);
          let newStatus = c.status;
          if (c.ticks === 0 && newTicks > 0) {
            newStatus = 'blue';
          } else if (newTicks === 0) {
            newStatus = '';
          }
          return { ...c, ticks: newTicks, status: newStatus };
        }
        return c;
      });
    });
  };

  // Jump a competitor to one above the current maximum.
  const setMaxTicks = (id) => {
    setCompetitors((prev) => {
      const maxTicks = Math.max(0, ...prev.map((c) => c.ticks));
      const comp = prev.find((c) => c.id === id);
      if (!comp) return prev;
      if (comp.ticks >= maxTicks + 1) {
        return prev;
      }
      const diff = (maxTicks + 1) - comp.ticks;
      return prev.map((c) => {
        if (c.id === id) {
          const newTicks = Math.max(0, c.ticks + diff);
          let newStatus = c.status;
          if (c.ticks === 0 && newTicks > 0) {
            newStatus = 'blue';
          } else if (newTicks === 0) {
            newStatus = '';
          }
          return { ...c, ticks: newTicks, status: newStatus };
        }
        return c;
      });
    });
  };

  // Finalize 'blue' competitors => 'green'. Clear scores if any.
  const updateGreenCompetitors = () => {
    setCompetitors((prev) => {
      let updated = [...prev];
      if (updated.some((c) => c.score !== '')) {
        updated = updated.map((c) => ({ ...c, score: '' }));
      }
      const blueComps = updated.filter((c) => c.status === 'blue' && c.ticks > 0);
      blueComps.sort((a, b) => a.ticks - b.ticks || a.id - b.id);
      blueComps.forEach((blueComp) => {
        updated = insertAtRank(updated, blueComp.id, blueComp.ticks);
      });
      return updated;
    });
  };

  // If there's any 'blue', finalize them, then assign scores.
  const assignScores = () => {
    setCompetitors((prev) => {
      let updated = [...prev];
      const hasBlue = updated.some((c) => c.status === 'blue' && c.ticks > 0);
      if (hasBlue) {
        updated = updated.map((c) => ({ ...c, score: '' }));
        const blueComps = updated.filter((c) => c.status === 'blue' && c.ticks > 0);
        blueComps.sort((a, b) => a.ticks - b.ticks || a.id - b.id);
        blueComps.forEach((blueComp) => {
          updated = insertAtRank(updated, blueComp.id, blueComp.ticks);
        });
      }
      updated = updated.map((c) => {
        if (c.ticks > 0 && (c.status === 'blue' || c.status === 'green')) {
          return {
            ...c,
            score: scoreMapping[c.ticks] || scoreMapping.default
          };
        } else {
          return { ...c, score: '' };
        }
      });
      return updated;
    });
  };

  // Confirmation.
  const confirmDialog = (message, action) => {
    setConfirmAction({ message, action });
  };

  const executeConfirmedAction = () => {
    if (confirmAction && confirmAction.action) {
      confirmAction.action();
    }
    setConfirmAction(null);
  };

  // Reset.
  const resetCompetitors = () =>
    confirmDialog('Reset all competitors?', () => {
      setCompetitors(
        Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          name: `Competitor ${i + 1}`,
          ticks: 0,
          status: '',
          score: ''
        }))
      );
    });

  // Remove competitor.
  const removeCompetitor = (id) =>
    confirmDialog('Remove this competitor?', () => {
      setCompetitors((prev) => prev.filter((comp) => comp.id !== id));
    });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto bg-gray-50 rounded-lg">
      <h1 className="text-2xl font-bold text-center">Karate Tournament Scoring (Version 2)</h1>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Add Competitor (blue) */}
        <Button
          onClick={() =>
            setCompetitors((prev) => [
              ...prev,
              {
                id: prev.length + 1,
                name: `Competitor ${prev.length + 1}`,
                ticks: 0,
                status: '',
                score: ''
              }
            ])}
          className="bg-blue-500 text-white"
        >
          Add Competitor
        </Button>

        {/* Update (green) / Assign Scores (green) */}
        <div className="flex gap-2">
          <Button onClick={updateGreenCompetitors} className="bg-green-500 text-white">
            Update
          </Button>
          <Button onClick={assignScores} className="bg-green-500 text-white">
            Assign Scores
          </Button>
        </div>

        {/* Reset (red) */}
        <Button onClick={resetCompetitors} className="bg-red-500 text-white">
          Reset
        </Button>
      </div>

      <div className="max-h-[600px] overflow-y-auto space-y-3 p-2">
        {competitors.map((comp) => {
          const colorClass =
            comp.status === 'blue'
              ? 'text-blue-500'
              : comp.status === 'green'
              ? 'text-green-500'
              : '';
          const isGreen = comp.status === 'green';

          return (
            <Card
              key={comp.id}
              className="p-4 flex flex-col gap-2 items-start shadow bg-white"
            >
              <div className="flex items-center w-full justify-between">
                <p className={`text-base font-semibold ${colorClass}`}>{comp.name}</p>
                {comp.score && (
                  <span className="text-3xl font-extrabold text-gray-700 ml-2">
                    {comp.score}
                  </span>
                )}
              </div>

              {/* If competitor is not green, show place assignment buttons by default */}
              {!isGreen && (
                <div className="flex flex-wrap gap-2 items-center">
                  <Button onClick={() => adjustPlace(comp.id, 1)} className="px-4 py-2 text-sm">
                    +
                  </Button>
                  <Button onClick={() => adjustPlace(comp.id, -1)} className="px-4 py-2 text-sm">
                    -
                  </Button>
                  <Button onClick={() => setExactRank(comp.id, 1)} className="px-2 py-1 text-xs bg-blue-100 text-black">
                    1st
                  </Button>
                  <Button onClick={() => setExactRank(comp.id, 2)} className="px-2 py-1 text-xs bg-blue-100 text-black">
                    2nd
                  </Button>
                  <Button onClick={() => setExactRank(comp.id, 3)} className="px-2 py-1 text-xs bg-blue-100 text-black">
                    3rd
                  </Button>
                  <Button onClick={() => setExactRank(comp.id, 4)} className="px-2 py-1 text-xs bg-blue-100 text-black">
                    4th
                  </Button>
                  <Button onClick={() => setMaxTicks(comp.id)} className="px-2 py-1 text-xs bg-blue-100 text-black">
                    Max
                  </Button>
                </div>
              )}

              <div className="flex justify-between w-full">
                <p className="text-sm">Ticks: {'✔️'.repeat(comp.ticks)}</p>
                <div className="flex gap-2">
                  {/* If competitor is green, show "Edit" button that reverts them to "blue"? */}
                  {isGreen && (
                    <Button
                      onClick={() =>
                        setCompetitors((prev) =>
                          prev.map((c) => {
                            if (c.id === comp.id) {
                              return { ...c, status: 'blue' };
                            }
                            return c;
                          })
                        )
                      }
                      className="px-2 py-1 bg-blue-500 text-white text-xs"
                    >
                      Edit
                    </Button>
                  )}

                  {/* Del is always red */}
                  <Button
                    onClick={() => removeCompetitor(comp.id)}
                    className="px-2 py-1 bg-red-500 text-white text-xs"
                  >
                    Del
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        {confirmAction && (
          <>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogContent>
              <p>{confirmAction.message}</p>
              <div className="flex gap-2 mt-4 justify-end">
                <Button onClick={executeConfirmedAction} className="bg-green-500 text-white">
                  Confirm
                </Button>
                <Button onClick={() => setConfirmAction(null)}>Cancel</Button>
              </div>
            </DialogContent>
          </>
        )}
      </Dialog>
    </div>
  );
}
