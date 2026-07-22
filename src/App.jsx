import { lazy, Suspense, Component } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import { preloadLogo } from './utils/print'
import logger from './services/logger'

// Lazy-loaded pages for code splitting
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Invoicing = lazy(() => import('./pages/Invoicing'))
const CRM = lazy(() => import('./pages/CRM'))
const HR = lazy(() => import('./pages/hr'))
const Purchases = lazy(() => import('./pages/Purchases'))
const Scheduling = lazy(() => import('./pages/Scheduling'))
const Meetings = lazy(() => import('./pages/Meetings'))
const Sales = lazy(() => import('./pages/Sales'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Security = lazy(() => import('./pages/Security'))
const Profile = lazy(() => import('./pages/Profile'))
const Chat = lazy(() => import('./pages/Chat'))
const Reports = lazy(() => import('./pages/Reports'))
const Register = lazy(() => import('./pages/Register'))
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'))
const CashRegister = lazy(() => import('./pages/CashRegister'))
const Accounting = lazy(() => import('./pages/Accounting'))
const Inventory = lazy(() => import('./pages/Inventory'))
const PocketDashboard = lazy(() => import('./pages/PocketDashboard'))
const InventoryCount = lazy(() => import('./pages/InventoryCount'))
const DuplicateDetection = lazy(() => import('./pages/DuplicateDetection'))
const AIAssistant = lazy(() => import('./pages/AIAssistant'))
const AiContext = lazy(() => import('./pages/AiContext'))
const PaperSettings = lazy(() => import('./pages/PaperSettings'))

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', color: '#6b7280', fontSize: 14
    }}>
      Cargando...
    </div>
  )
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error, info) { logger.error('App', 'Uncaught error', { error, componentStack: info?.componentStack }) }
  render() {
    if (this.state.hasError) return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:16, padding:24 }}>
        <h2 style={{ fontSize:20, fontWeight:600, color:'#111827' }}>Algo salió mal</h2>
        <p style={{ fontSize:14, color:'#6b7280', textAlign:'center', maxWidth:400 }}>Ha ocurrido un error inesperado. Intenta recargar la página.</p>
        <button onClick={() => { this.setState({ hasError:false }); window.location.reload() }}
          style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'#2563eb', color:'#fff', fontSize:14, cursor:'pointer' }}>
          Recargar
        </button>
      </div>
    )
    return this.props.children
  }
}

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error, info) { logger.error('RouteErrorBoundary', `Route error [${this.props.route}]`, { error, componentStack: info?.componentStack }) }
  render() {
    if (this.state.hasError) return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:12, padding:24 }}>
        <h3 style={{ fontSize:16, fontWeight:600, color:'#111827' }}>Error en esta página</h3>
        <p style={{ fontSize:13, color:'#6b7280' }}>No se pudo cargar el módulo. Intenta navegar a otra sección.</p>
        <button onClick={() => this.setState({ hasError:false })}
          style={{ padding:'6px 16px', borderRadius:6, border:'none', background:'#2563eb', color:'#fff', fontSize:13, cursor:'pointer' }}>
          Reintentar
        </button>
      </div>
    )
    return this.props.children
  }
}

function R({ route, children }) {
  return <RouteErrorBoundary route={route}>{children}</RouteErrorBoundary>
}

export default function App() {
  const { user } = useAuth()

  preloadLogo()

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
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
                  <Route path="/" element={<R route="dashboard"><Dashboard /></R>} />
                  <Route path="/invoicing" element={<R route="invoicing"><Invoicing /></R>} />
                  <Route path="/crm" element={<R route="crm"><CRM /></R>} />
                  <Route path="/hr" element={<R route="hr"><HR /></R>} />
                  <Route path="/purchases" element={<R route="purchases"><Purchases /></R>} />
                  <Route path="/scheduling" element={<R route="scheduling"><Scheduling /></R>} />
                  <Route path="/meetings" element={<R route="meetings"><Meetings /></R>} />
                  <Route path="/sales" element={<R route="sales"><Sales /></R>} />
                  <Route path="/tasks" element={<R route="tasks"><Tasks /></R>} />
                  <Route path="/security" element={<R route="security"><Security /></R>} />
                  <Route path="/profile" element={<R route="profile"><Profile /></R>} />
                  <Route path="/chat" element={<R route="chat"><Chat /></R>} />
                  <Route path="/reports" element={<R route="reports"><Reports /></R>} />
                  <Route path="/cash-register" element={<R route="cash-register"><CashRegister /></R>} />
                  <Route path="/accounting" element={<R route="accounting"><Accounting /></R>} />
                  <Route path="/paper-settings" element={<R route="paper-settings"><PaperSettings /></R>} />
                  <Route path="/inventory" element={<R route="inventory"><Inventory /></R>} />
                  <Route path="/admin/duplicates" element={<R route="duplicates"><DuplicateDetection /></R>} />
                  <Route path="/ai-assistant" element={<R route="ai-assistant"><AIAssistant /></R>} />
                  <Route path="/ai-context" element={<R route="ai-context"><AiContext /></R>} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
