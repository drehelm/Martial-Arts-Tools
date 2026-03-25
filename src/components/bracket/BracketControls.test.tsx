// src/components/bracket/BracketControls.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BracketControls from './BracketControls'

describe('BracketControls', () => {
  it('Generate button is disabled when input is empty', () => {
    render(
      <BracketControls
        competitorCount=""
        date=""
        division=""
        onCompetitorCountChange={vi.fn()}
        onDateChange={vi.fn()}
        onDivisionChange={vi.fn()}
        onGenerate={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /generate/i })).toBeDisabled()
  })

  it('Generate button is disabled when value floors to below 2', () => {
    render(
      <BracketControls
        competitorCount="1.5"
        date=""
        division=""
        onCompetitorCountChange={vi.fn()}
        onDateChange={vi.fn()}
        onDivisionChange={vi.fn()}
        onGenerate={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /generate/i })).toBeDisabled()
  })

  it('Generate button is enabled when value floors to valid range (3.7 → 3)', () => {
    render(
      <BracketControls
        competitorCount="3.7"
        date=""
        division=""
        onCompetitorCountChange={vi.fn()}
        onDateChange={vi.fn()}
        onDivisionChange={vi.fn()}
        onGenerate={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /generate/i })).not.toBeDisabled()
  })

  it('Generate button is disabled when value floors to above 32', () => {
    render(
      <BracketControls
        competitorCount="33"
        date=""
        division=""
        onCompetitorCountChange={vi.fn()}
        onDateChange={vi.fn()}
        onDivisionChange={vi.fn()}
        onGenerate={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /generate/i })).toBeDisabled()
  })

  it('calls onGenerate with floored value when Generate is clicked', async () => {
    const user = userEvent.setup()
    const onGenerate = vi.fn()
    render(
      <BracketControls
        competitorCount="5.9"
        date=""
        division=""
        onCompetitorCountChange={vi.fn()}
        onDateChange={vi.fn()}
        onDivisionChange={vi.fn()}
        onGenerate={onGenerate}
      />
    )
    await user.click(screen.getByRole('button', { name: /generate/i }))
    expect(onGenerate).toHaveBeenCalledWith(5)
  })
})
