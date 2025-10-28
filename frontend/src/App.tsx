import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Connect from './pages/Connect'
import BuyInsurance from './pages/BuyInsurance'
import Dashboard from './pages/Dashboard'
import Claims from './pages/Claims'
import Pool from './pages/Pool'
import Analytics from './pages/Analytics'
import AdminFunding from './pages/AdminFunding'

console.log('App rendering')

function App() {
  console.log('Inside App function')
  return (
    <Router>
      <Routes>
        <Route path="/connect" element={<Connect />} />
        <Route path="/buy-insurance" element={<BuyInsurance />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/claims" element={<Claims />} />
        <Route path="/pool" element={<Pool />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/admin/funding" element={<AdminFunding />} />
        <Route path="/" element={<Connect />} />
      </Routes>
    </Router>
  )
}

export default App
