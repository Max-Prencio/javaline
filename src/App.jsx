import { useEffect, useState } from 'react'
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
import PocketDashboard from './pages/PocketDashboard'
import InventoryCount from './pages/InventoryCount'
import DuplicateDetection from './pages/DuplicateDetection'
import AIAssistant from './pages/AIAssistant'
import AiContext from './pages/AiContext'
import PaperSettings from './pages/PaperSettings'
import { preloadLogo } from './utils/print'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user, deviceWarning, dismissDeviceWarning } = useAuth()
  const [storageFull, setStorageFull] = useState(false)

  useEffect(() => { preloadLogo() }, [])

  useEffect(() => {
    const handler = () => setStorageFull(true)
    window.addEventListener('javaline:storage-full', handler)
    return () => window.removeEventListener('javaline:storage-full', handler)
  }, [])

  return (
    <>
    {deviceWarning && (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#d97706', color: '#fff', textAlign: 'center',
        padding: '10px 16px', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        🔔 Sesión activa desde un dispositivo diferente al registrado. Si no fuiste tú, cambia tu contraseña.
        <button onClick={dismissDeviceWarning}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontSize: 12 }}>
          Entendido
        </button>
      </div>
    )}
    {storageFull && (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#dc2626', color: '#fff', textAlign: 'center',
        padding: '10px 16px', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        ⚠️ Almacenamiento local lleno. Algunos cambios no se guardarán. Elimina fotos de perfil o exporta y limpia datos.
        <button onClick={() => setStorageFull(false)}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontSize: 12 }}>
          Cerrar
        </button>
      </div>
    )}
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/invite/:code" element={user ? <Navigate to="/" replace /> : <AcceptInvite />} />
      <Route path="/pocket" element={<PrivateRoute><PocketDashboard /></PrivateRoute>} />
      <Route path="/pocket/count" element={<PrivateRoute><InventoryCount /></PrivateRoute>} />
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
              <Route path="/admin/duplicates" element={<DuplicateDetection />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/ai-context" element={<AiContext />} />
            </Routes>
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
    </>
  )
}
