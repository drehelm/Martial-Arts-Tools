import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ScoresheetPage from './ScoresheetPage'

function renderPage(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/scoresheet${search}`]}>
      <ScoresheetPage />
    </MemoryRouter>
  )
}

describe('ScoresheetPage', () => {
  it('renders 5 default competitor rows on load', () => {
    renderPage()
    expect(screen.getAllByPlaceholderText(/name \(optional\)/i)).toHaveLength(5)
  })

  it('pre-fills names from ?c= URL param', () => {
    renderPage('?c=Alice,Bob,Charlie')
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Charlie')).toBeInTheDocument()
  })

  it('shows 3 rows when 3 names in URL', () => {
    renderPage('?c=Alice,Bob,Charlie')
    expect(screen.getAllByPlaceholderText(/name \(optional\)/i)).toHaveLength(3)
  })

  it('Increase ticks button shows tick mark', async () => {
    const user = userEvent.setup()
    renderPage()
    const plusButtons = screen.getAllByRole('button', { name: /increase ticks/i })
    await user.click(plusButtons[0])
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('Decrease ticks button is disabled when ticks = 0', () => {
    renderPage()
    const minusButtons = screen.getAllByRole('button', { name: /decrease ticks/i })
    for (const btn of minusButtons) {
      expect(btn).toBeDisabled()
    }
  })

  it('Decrease ticks is enabled after ticks are increased', async () => {
    const user = userEvent.setup()
    renderPage()
    const plusButtons = screen.getAllByRole('button', { name: /increase ticks/i })
    await user.click(plusButtons[0])
    const minusButtons = screen.getAllByRole('button', { name: /decrease ticks/i })
    expect(minusButtons[0]).not.toBeDisabled()
  })

  it('Direct rank panel buttons are disabled before any competitor is touched', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /^1st$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^2nd$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^3rd$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^4th$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^max$/i })).toBeDisabled()
  })

  it('Direct rank panel enables after touching a competitor', async () => {
    const user = userEvent.setup()
    renderPage()
    const plusButtons = screen.getAllByRole('button', { name: /increase ticks/i })
    await user.click(plusButtons[0])
    expect(screen.getByRole('button', { name: /^1st$/i })).not.toBeDisabled()
  })

  it('1st button sets active competitor to 1 tick (1st place)', async () => {
    const user = userEvent.setup()
    renderPage()
    const plusButtons = screen.getAllByRole('button', { name: /increase ticks/i })
    await user.click(plusButtons[0])
    await user.click(plusButtons[0])
    expect(screen.getByText('✓✓')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^1st$/i }))
    expect(screen.queryByText('✓✓')).not.toBeInTheDocument()
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('Max button gives last-place ticks (currentMax + 1)', async () => {
    const user = userEvent.setup()
    renderPage()
    const plusButtons = screen.getAllByRole('button', { name: /increase ticks/i })
    // Give first competitor 3 ticks
    await user.click(plusButtons[0])
    await user.click(plusButtons[0])
    await user.click(plusButtons[0])
    // Activate second competitor and press Max → should get 3+1=4 ticks
    await user.click(plusButtons[1])
    await user.click(screen.getByRole('button', { name: /^max$/i }))
    expect(screen.getByText('✓✓✓✓')).toBeInTheDocument()
  })

  it('Add button appends a new competitor row', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /\+ add/i }))
    expect(screen.getAllByPlaceholderText(/name \(optional\)/i)).toHaveLength(6)
  })

  it('Scores button assigns and displays scores', async () => {
    const user = userEvent.setup()
    renderPage()
    const plusButtons = screen.getAllByRole('button', { name: /increase ticks/i })
    await user.click(plusButtons[0])
    await user.click(screen.getByRole('button', { name: /^scores$/i }))
    const scores = screen.getAllByText(/^9\.(9[3-9])$/)
    expect(scores.length).toBeGreaterThan(0)
  })

  it('Reset button shows confirmation dialog', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /^reset$/i }))
    expect(screen.getByText(/reset scoresheet\?/i)).toBeInTheDocument()
  })

  it('Reset cancel keeps competitors intact', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice,Bob')
    await user.click(screen.getByRole('button', { name: /^reset$/i }))
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  })

  it('Reset confirm restores 5 default empty rows', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice,Bob,Charlie')
    await user.click(screen.getByRole('button', { name: /^reset$/i }))
    const resetButtons = screen.getAllByRole('button', { name: /^reset$/i })
    await user.click(resetButtons[resetButtons.length - 1])
    expect(screen.getAllByPlaceholderText(/name \(optional\)/i)).toHaveLength(5)
    expect(screen.queryByDisplayValue('Alice')).not.toBeInTheDocument()
  })

  it('Remove competitor shows confirmation dialog', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getAllByRole('button', { name: /remove competitor/i })[0])
    expect(screen.getByText(/remove competitor\?/i)).toBeInTheDocument()
  })

  it('Remove competitor cancel keeps the competitor', async () => {
    const user = userEvent.setup()
    renderPage('?c=Alice')
    await user.click(screen.getAllByRole('button', { name: /remove competitor/i })[0])
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  })

  it('Remove competitor confirm removes the row', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getAllByRole('button', { name: /remove competitor/i })[0])
    await user.click(screen.getByRole('button', { name: /^remove$/i }))
    expect(screen.getAllByPlaceholderText(/name \(optional\)/i)).toHaveLength(4)
  })

  it('Update button finalizes blue status competitors', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getAllByRole('button', { name: /increase ticks/i })[0])
    await user.click(screen.getByRole('button', { name: /^update$/i }))
    // Tick display still shows after update
    expect(screen.getByText('✓')).toBeInTheDocument()
  })
})
