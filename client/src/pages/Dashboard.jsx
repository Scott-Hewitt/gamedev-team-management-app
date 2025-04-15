import { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    completedTasks: 0,
    inProgressTasks: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Get user's projects
        const projectsResponse = await api.get(`/users/${user.id}/projects`);

        // Get user's tasks
        const tasksResponse = await api.get(`/users/${user.id}/tasks`);

        // Calculate stats
        const projects = projectsResponse.data;
        const tasks = tasksResponse.data;

        // Get all tasks for the system (not just user's tasks) for accurate dashboard stats
        const allTasksResponse = await api.get('/tasks');
        const allTasks = allTasksResponse.data;

        // Calculate stats based on all tasks in the system
        const completedTasks = allTasks.filter(task => task.status === 'done').length;
        const inProgressTasks = allTasks.filter(task => task.status === 'in_progress').length;

        setStats({
          projects: projects.length,
          tasks: allTasks.length,  // Show total tasks in the system
          completedTasks,
          inProgressTasks
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Projects</Card.Title>
              <Card.Text className="display-4">{stats.projects}</Card.Text>
              <Link to="/projects" className="btn btn-primary">View Projects</Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>Total Tasks</Card.Title>
              <Card.Text className="display-4">{stats.tasks}</Card.Text>
              <Link to="/tasks" className="btn btn-primary">View Tasks</Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100 bg-success text-white">
            <Card.Body>
              <Card.Title>Completed Tasks</Card.Title>
              <Card.Text className="display-4">{stats.completedTasks}</Card.Text>
              <Link to="/tasks?status=done" className="btn btn-light">View Completed</Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100 bg-warning">
            <Card.Body>
              <Card.Title>In Progress</Card.Title>
              <Card.Text className="display-4">{stats.inProgressTasks}</Card.Text>
              <Link to="/tasks?status=in_progress" className="btn btn-dark">View In Progress</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>Recent Projects</Card.Header>
            <Card.Body>
              {/* We'll implement this in the next phase */}
              <p className="text-muted">Recent projects will be displayed here</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>Upcoming Tasks</Card.Header>
            <Card.Body>
              {/* We'll implement this in the next phase */}
              <p className="text-muted">Upcoming tasks will be displayed here</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
