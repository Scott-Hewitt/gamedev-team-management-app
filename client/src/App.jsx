import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Layout
import Layout from './components/layout/Layout';

// Auth Components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/projects/ProjectList';
import ProjectDetail from './pages/projects/ProjectDetail';
import ProjectForm from './pages/projects/ProjectForm';
import TaskList from './pages/tasks/TaskList';
import TaskDetail from './pages/tasks/TaskDetail';
import TaskForm from './pages/tasks/TaskForm';
import UserList from './pages/users/UserList';
import UserProfile from './pages/users/UserProfile';
import UserEdit from './pages/users/UserEdit';
import UserInvite from './pages/users/UserInvite';
import MyProfile from './pages/users/MyProfile';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />

              {/* Project Routes */}
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />

              {/* Task Routes */}
              <Route path="/tasks" element={<TaskList />} />
              <Route path="/tasks/new" element={<TaskForm />} />
              <Route path="/tasks/:id/edit" element={<TaskForm />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />

              {/* User Routes */}
              <Route path="/profile" element={<MyProfile />} />

              {/* Admin/Manager Only Routes */}
              <Route element={<ProtectedRoute requiredRoles={['admin', 'manager']} />}>
                <Route path="/users" element={<UserList />} />
                <Route path="/users/invite" element={<UserInvite />} />
                <Route path="/users/:id" element={<UserProfile />} />
              </Route>

              <Route path="/users/:id/edit" element={<UserEdit />} />

              {/* Routes with role restrictions */}
              <Route element={<ProtectedRoute requiredRoles={['admin', 'manager']} />}>
                <Route path="/projects/new" element={<ProjectForm />} />
                <Route path="/projects/:id/edit" element={<ProjectForm />} />
              </Route>

              {/* Add more routes here as you develop them */}
            </Route>
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
