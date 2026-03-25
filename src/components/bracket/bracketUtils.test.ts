import { describe, it, expect } from 'vitest'
import { generateBracket } from './bracketUtils'

describe('generateBracket', () => {
  it('n=2: single Final round, one match, two competitor slots, no byes', () => {
    const result = generateBracket(2)
    expect(result.competitorCount).toBe(2)
    expect(result.byeCount).toBe(0)
    expect(result.rounds).toHaveLength(1)
    expect(result.rounds[0].label).toBe('Final')
    expect(result.rounds[0].matches).toHaveLength(1)
    expect(result.rounds[0].matches[0].top.type).toBe('competitor')
    expect(result.rounds[0].matches[0].bottom.type).toBe('competitor')
  })

  it('n=3: Semi-Finals + Final, 1 bye at bottom of round 1', () => {
    const result = generateBracket(3)
    expect(result.byeCount).toBe(1)
    expect(result.rounds).toHaveLength(2)
    expect(result.rounds[0].label).toBe('Semi-Finals')
    expect(result.rounds[0].matches).toHaveLength(2)
    // First match: C vs C (real match)
    expect(result.rounds[0].matches[0].top.type).toBe('competitor')
    expect(result.rounds[0].matches[0].bottom.type).toBe('competitor')
    // Second match: C vs BYE
    expect(result.rounds[0].matches[1].top.type).toBe('competitor')
    expect(result.rounds[0].matches[1].bottom.type).toBe('bye')
    // Final: two competitors
    expect(result.rounds[1].label).toBe('Final')
    expect(result.rounds[1].matches[0].top.type).toBe('competitor')
    expect(result.rounds[1].matches[0].bottom.type).toBe('competitor')
  })

  it('n=4: Semi-Finals + Final, no byes', () => {
    const result = generateBracket(4)
    expect(result.byeCount).toBe(0)
    expect(result.rounds).toHaveLength(2)
    expect(result.rounds[0].label).toBe('Semi-Finals')
    expect(result.rounds[0].matches).toHaveLength(2)
    for (const match of result.rounds[0].matches) {
      expect(match.top.type).toBe('competitor')
      expect(match.bottom.type).toBe('competitor')
    }
    expect(result.rounds[1].label).toBe('Final')
  })

  it('n=5: QF + SF + Final, 3 byes, real Final is C vs C', () => {
    const result = generateBracket(5)
    expect(result.byeCount).toBe(3)
    expect(result.rounds).toHaveLength(3)
    expect(result.rounds[0].label).toBe('Quarter-Finals')
    expect(result.rounds[0].matches).toHaveLength(4)
    // realMatches = 5 - 4 = 1 (first match is C vs C)
    expect(result.rounds[0].matches[0].top.type).toBe('competitor')
    expect(result.rounds[0].matches[0].bottom.type).toBe('competitor')
    // Remaining 3 matches are C vs BYE
    for (let i = 1; i < 4; i++) {
      expect(result.rounds[0].matches[i].top.type).toBe('competitor')
      expect(result.rounds[0].matches[i].bottom.type).toBe('bye')
    }
    // All subsequent rounds are C vs C only
    for (const round of result.rounds.slice(1)) {
      for (const match of round.matches) {
        expect(match.top.type).toBe('competitor')
        expect(match.bottom.type).toBe('competitor')
      }
    }
  })

  it('n=8: QF + SF + Final, no byes, 4 QF matches all C vs C', () => {
    const result = generateBracket(8)
    expect(result.byeCount).toBe(0)
    expect(result.rounds).toHaveLength(3)
    expect(result.rounds[0].label).toBe('Quarter-Finals')
    expect(result.rounds[0].matches).toHaveLength(4)
  })

  it('n=9: Round of 16 + QF + SF + Final, 7 byes, final is C vs C', () => {
    const result = generateBracket(9)
    expect(result.byeCount).toBe(7)
    expect(result.rounds).toHaveLength(4)
    expect(result.rounds[0].label).toBe('Round of 16')
    expect(result.rounds[0].matches).toHaveLength(8)
    // realMatches = 9 - 8 = 1
    expect(result.rounds[0].matches[0].top.type).toBe('competitor')
    expect(result.rounds[0].matches[0].bottom.type).toBe('competitor')
    const finalRound = result.rounds[result.rounds.length - 1]
    expect(finalRound.label).toBe('Final')
    expect(finalRound.matches[0].top.type).toBe('competitor')
    expect(finalRound.matches[0].bottom.type).toBe('competitor')
  })

  it('n=16: Round of 16 + QF + SF + Final, no byes', () => {
    const result = generateBracket(16)
    expect(result.byeCount).toBe(0)
    expect(result.rounds).toHaveLength(4)
    expect(result.rounds[0].label).toBe('Round of 16')
  })

  it('n=17: Round 1 + R16 + QF + SF + Final, 15 byes, final is C vs C', () => {
    const result = generateBracket(17)
    expect(result.byeCount).toBe(15)
    expect(result.rounds).toHaveLength(5)
    expect(result.rounds[0].label).toBe('Round 1')
    expect(result.rounds[0].matches).toHaveLength(16)
    // realMatches = 17 - 16 = 1
    expect(result.rounds[0].matches[0].top.type).toBe('competitor')
    expect(result.rounds[0].matches[0].bottom.type).toBe('competitor')
    const finalRound = result.rounds[result.rounds.length - 1]
    expect(finalRound.label).toBe('Final')
    expect(finalRound.matches[0].top.type).toBe('competitor')
    expect(finalRound.matches[0].bottom.type).toBe('competitor')
  })

  it('n=32: Round 1 + R16 + QF + SF + Final, no byes, 16 R1 matches all C vs C', () => {
    const result = generateBracket(32)
    expect(result.byeCount).toBe(0)
    expect(result.rounds).toHaveLength(5)
    expect(result.rounds[0].matches).toHaveLength(16)
  })

  it('floors non-integer inputs: 3.7 → treated as 3', () => {
    const result = generateBracket(3.7)
    expect(result.competitorCount).toBe(3)
    expect(result.byeCount).toBe(1)
  })

  it('no round ever has a BYE vs BYE match', () => {
    for (let n = 2; n <= 32; n++) {
      const result = generateBracket(n)
      for (const round of result.rounds) {
        for (const match of round.matches) {
          const isByeVsBye = match.top.type === 'bye' && match.bottom.type === 'bye'
          expect(isByeVsBye, `n=${n} has a BYE vs BYE match`).toBe(false)
        }
      }
    }
  })

  it('Final always has two competitors for all n from 2 to 32', () => {
    for (let n = 2; n <= 32; n++) {
      const result = generateBracket(n)
      const finalRound = result.rounds[result.rounds.length - 1]
      expect(finalRound.matches[0].top.type, `n=${n} Final top`).toBe('competitor')
      expect(finalRound.matches[0].bottom.type, `n=${n} Final bottom`).toBe('competitor')
    }
  })
})
