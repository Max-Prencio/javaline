import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Invoicing from './pages/Invoicing'
import CRM from './pages/CRM'
import HR from './pages/HR'
import Purchases from './pages/Purchases'
import Scheduling from './pages/Scheduling'
import Meetings from './pages/Meetings'
import Sales from './pages/Sales'
import Tasks from './pages/Tasks'
import Security from './pages/Security'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import Reports from './pages/Reports'
import Register from './pages/Register'
import AcceptInvite from './pages/AcceptInvite'
import CashRegister from './pages/CashRegister'
import Accounting from './pages/Accounting'
import Inventory from './pages/Inventory'
import PaperSettings from './pages/PaperSettings'
import { preloadLogo } from './utils/print'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()

  useEffect(() => { preloadLogo() }, [])

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/invite/:code" element={user ? <Navigate to="/" replace /> : <AcceptInvite />} />
      <Route path="/*" element={
        <PrivateRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoicing" element={<Invoicing />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/hr" element={<HR />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/scheduling" element={<Scheduling />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/security" element={<Security />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/cash-register" element={<CashRegister />} />
              <Route path="/accounting" element={<Accounting />} />
              <Route path="/paper-settings" element={<PaperSettings />} />
              <Route path="/inventory" element={<Inventory />} />
            </Routes>
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  )
}
