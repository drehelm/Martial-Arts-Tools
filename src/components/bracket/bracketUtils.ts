export type SlotType = 'competitor' | 'bye'

export interface Slot {
  type: SlotType
}

export interface Match {
  top: Slot
  bottom: Slot
}

export interface Round {
  label: string
  matches: Match[]
}

export interface BracketData {
  rounds: Round[]      // index 0 = leftmost (Round 1), last index = Final
  competitorCount: number
  byeCount: number
}

function nextPowerOf2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

const ROUND_LABELS: Record<number, string[]> = {
  32: ['Round 1', 'Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Final'],
  16: ['Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Final'],
  8: ['Quarter-Finals', 'Semi-Finals', 'Final'],
  4: ['Semi-Finals', 'Final'],
  2: ['Final'],
}

export function generateBracket(n: number): BracketData {
  const count = Math.floor(n)
  const S = nextPowerOf2(count)
  const B = S - count
  const realMatches = count - S / 2
  const labels = ROUND_LABELS[S]

  // Build Round 1 slots: realMatches*2 competitors at top,
  // then byeMatches of (Competitor, BYE) pairs at bottom
  const slots: Slot[] = []
  for (let i = 0; i < realMatches * 2; i++) {
    slots.push({ type: 'competitor' })
  }
  for (let i = 0; i < B; i++) {
    slots.push({ type: 'competitor' })
    slots.push({ type: 'bye' })
  }

  // Pair slots sequentially into matches
  let currentMatches: Match[] = []
  for (let i = 0; i < slots.length; i += 2) {
    currentMatches.push({ top: slots[i], bottom: slots[i + 1] })
  }

  const rounds: Round[] = [{ label: labels[0], matches: currentMatches }]

  // Propagate each subsequent round
  for (let r = 1; r < labels.length; r++) {
    const nextMatches: Match[] = []
    for (let i = 0; i < currentMatches.length; i += 2) {
      nextMatches.push({
        top: propagate(currentMatches[i]),
        bottom: propagate(currentMatches[i + 1]),
      })
    }
    rounds.push({ label: labels[r], matches: nextMatches })
    currentMatches = nextMatches
  }

  return { rounds, competitorCount: count, byeCount: B }
}

function propagate(match: Match): Slot {
  if (match.top.type === 'bye' && match.bottom.type === 'bye') {
    return { type: 'bye' }
  }
  return { type: 'competitor' }
}
