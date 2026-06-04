import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Exams from './pages/Exams';
import StudyPlans from './pages/StudyPlans';
import Goals from './pages/Goals';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import SyllabusUpload from './pages/SyllabusUpload';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-7xl mx-auto px-4 py-8"><Dashboard /></main></div></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-7xl mx-auto px-4 py-8"><Courses /></main></div></ProtectedRoute>} />
      <Route path="/exams" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-7xl mx-auto px-4 py-8"><Exams /></main></div></ProtectedRoute>} />
      <Route path="/study-plans" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-7xl mx-auto px-4 py-8"><StudyPlans /></main></div></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-7xl mx-auto px-4 py-8"><Goals /></main></div></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-7xl mx-auto px-4 py-8"><Profile /></main></div></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-7xl mx-auto px-4 py-8"><Notifications /></main></div></ProtectedRoute>} />
      <Route path="/syllabus/upload" element={<ProtectedRoute><div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-7xl mx-auto px-4 py-8"><SyllabusUpload /></main></div></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
        <Toaster position="top-right" />
        <AppRoutes />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
