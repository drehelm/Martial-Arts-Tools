// src/pages/CalculatorPage.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CalculatorPage from './CalculatorPage'

function renderPage(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/calculator${search}`]}>
      <CalculatorPage />
    </MemoryRouter>
  )
}

describe('CalculatorPage', () => {
  it('renders 5 default competitor rows on load', () => {
    renderPage()
    expect(screen.getAllByPlaceholderText(/name \(optional\)/i)).toHaveLength(20) // 5 competitors × 2 renders (mobile list + desktop table) × 2 layouts per CompetitorRow
  })

  it('pre-fills names from ?c= URL param', () => {
    renderPage('?c=Alice,Bob,Charlie')
    expect(screen.getAllByDisplayValue('Alice')).toHaveLength(4) // 2 renders × 2 layouts
    expect(screen.getAllByDisplayValue('Bob')).toHaveLength(4)
  })

  it('defaults to Black Belt mode', () => {
    renderPage()
    const btn = screen.getByRole('button', { name: /black belt/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows 9.97 as default score in black belt mode', () => {
    renderPage()
    // Many 9.97 values — at least one present
    expect(screen.getAllByText('9.97').length).toBeGreaterThan(0)
  })

  it('+ button (better) decreases displayed score', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const betterButtons = screen.getAllByRole('button', { name: /judge 1 better/i })
    await user.click(betterButtons[0])
    expect(screen.getAllByText('9.98').length).toBeGreaterThan(0)
  })

  it('− button (worse) increases displayed score', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    await user.click(worseButtons[0])
    expect(screen.getAllByText('9.96').length).toBeGreaterThan(0)
  })

  it('+ button is disabled when score is already at max (9.99)', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    // Press better 2 times from 9.97 → 9.99
    const betterButtons = screen.getAllByRole('button', { name: /judge 1 better/i })
    await user.click(betterButtons[0])
    await user.click(betterButtons[0])
    expect(betterButtons[0]).toBeDisabled()
  })

  it('− button is disabled when score is already at min (9.90)', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    // Press worse 7 times from 9.97 (pts=2) → 9.90 (pts=9)
    for (let i = 0; i < 7; i++) await user.click(worseButtons[0])
    expect(worseButtons[0]).toBeDisabled()
  })

  it('placement badge appears after scores differ', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice,Bob')
    // Differentiate Alice from Bob by making Alice's Judge 1 better
    const betterButtons = screen.getAllByRole('button', { name: /judge 1 better/i })
    await user.click(betterButtons[0])
    expect(screen.getAllByText('1st').length).toBeGreaterThan(0)
  })

  it('discrepancy banner appears when outlier detected', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    // Make Judge 1 much worse: press worse 4 times (9.97 → 9.93, diff from J2/J3 = 4 > 2)
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    // Start at 9.97 (pts=2). Go to 9.93 (pts=6). Other judges at 9.97 (pts=2). Diff=4>2 → outlier.
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    expect(screen.getAllByText(/outlier/i).length).toBeGreaterThan(0)
  })

  it('Accept button resolves discrepancy and hides banner', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    await user.click(worseButtons[0])
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
    await user.click(acceptButtons[0])
    expect(screen.queryByText(/outlier/i)).not.toBeInTheDocument()
  })

  it('Add Competitor button appends a row', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /\+ add competitor/i }))
    expect(screen.getAllByPlaceholderText(/name \(optional\)/i)).toHaveLength(24) // 6 × 4
  })

  it('Remove button with unchanged scores removes without dialog', async () => {
    const user = userEvent.setup()
    renderPage()
    const removeButtons = screen.getAllByRole('button', { name: /remove competitor/i })
    await user.click(removeButtons[0])
    expect(screen.getAllByPlaceholderText(/name \(optional\)/i)).toHaveLength(16) // 4 × 4
  })

  it('Remove button with changed scores shows confirmation dialog', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    await user.click(worseButtons[0])
    const removeButtons = screen.getAllByRole('button', { name: /remove competitor/i })
    await user.click(removeButtons[0])
    expect(screen.getByText(/remove competitor\?/i)).toBeInTheDocument()
  })

  it('Reset clears scores but keeps names', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    await user.click(worseButtons[0])
    await user.click(screen.getByRole('button', { name: /^reset$/i }))
    expect(screen.getAllByDisplayValue('Alice')).toHaveLength(4) // 2 renders × 2 layouts
    expect(screen.getAllByText('9.97').length).toBeGreaterThan(0)
  })

  it('belt toggle to Coloured Belt shows 8.97 default after confirm', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    // Change a score so confirmation dialog is needed
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    await user.click(worseButtons[0])
    await user.click(screen.getByRole('button', { name: /coloured belt/i }))
    expect(screen.getByText(/switch belt mode\?/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^switch$/i }))
    expect(screen.getAllByText('8.97').length).toBeGreaterThan(0)
  })

  it('belt toggle cancel keeps current mode', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    const worseButtons = screen.getAllByRole('button', { name: /judge 1 worse/i })
    await user.click(worseButtons[0])
    await user.click(screen.getByRole('button', { name: /coloured belt/i }))
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    // Score should still be 9.96 (changed from 9.97), not reset
    expect(screen.getAllByText('9.96').length).toBeGreaterThan(0)
  })
})
