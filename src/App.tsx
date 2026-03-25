import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import BracketPage from './pages/BracketPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/bracket" element={<BracketPage />} />
    </Routes>
  )
}
