import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { IdleTimeoutProvider } from './context/IdleTimeoutContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from './components/PrivateRoute';
import IdleTimeoutWarning from './components/IdleTimeoutWarning';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import KeyManagement from './pages/KeyManagement';
import KeyDetail from './pages/KeyDetail';
import ModManagement from './pages/ModManagement';
import theme from './utils/theme';
import './index.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <SocketProvider>
            <IdleTimeoutProvider>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
              <IdleTimeoutWarning />
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/keys"
                  element={
                    <PrivateRoute>
                      <KeyManagement />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/keys/:id"
                  element={
                    <PrivateRoute>
                      <KeyDetail />
                    </PrivateRoute>
                  }
                />
                
                {/* Mod Management Routes */}
                <Route
                  path="/mods/:modId"
                  element={
                    <PrivateRoute requireRole="owner">
                      <ModManagement key={window.location.pathname} />
                    </PrivateRoute>
                  }
                />
                
                {/* Fallback for 404 */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </IdleTimeoutProvider>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
