import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Cars from './pages/Cars'
import Customers from './pages/Customers'
import Sales from './pages/Sales'
import Installments from './pages/Installments'
import Transactions from './pages/Transactions'
import Expenses from './pages/Expenses'
import Users from './pages/Users'
import AuditLogs from './pages/AuditLogs'
import CustomerAccounts from './pages/CustomerAccounts'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/cars" element={<ProtectedRoute><Cars /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/customer-accounts" element={<ProtectedRoute><CustomerAccounts /></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
      <Route path="/installments" element={<ProtectedRoute><Installments /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={['owner', 'manager']}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute roles={['owner', 'manager']}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
