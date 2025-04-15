import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Alert, Spinner, Tab, Tabs, Table } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import TaskStatusBadge from '../../components/tasks/TaskStatusBadge';
import TaskPriorityBadge from '../../components/tasks/TaskPriorityBadge';

const UserProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch user details
        const userResponse = await api.get(`/users/${id}`);
        setUser(userResponse.data);

        // Fetch user's projects
        const projectsResponse = await api.get(`/users/${id}/projects`);
        setProjects(projectsResponse.data);

        // Fetch user's tasks
        const tasksResponse = await api.get(`/users/${id}/tasks`);
        console.log('User tasks response:', tasksResponse.data);
        setTasks(tasksResponse.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const getRoleBadge = (role) => {
    const roleMap = {
      'admin': 'danger',
      'manager': 'warning',
      'developer': 'primary',
      'designer': 'info',
      'tester': 'success'
    };

    return (
      <Badge bg={roleMap[role] || 'secondary'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const handleDeactivate = async () => {
    if (window.confirm('Are you sure you want to deactivate this user? They will no longer be able to access the system.')) {
      try {
        await api.patch(`/users/${id}/deactivate`);
        navigate('/users', { state: { message: 'User deactivated successfully' } });
      } catch (error) {
        console.error('Error deactivating user:', error);
        setError('Failed to deactivate user');
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!user) {
    return <Alert variant="danger">User not found</Alert>;
  }

  // Check if current user has permission to view this profile
  const canView = currentUser.role === 'admin' ||
                 currentUser.role === 'manager' ||
                 currentUser.id === parseInt(id);

  if (!canView) {
    return <Alert variant="danger">You do not have permission to view this profile</Alert>;
  }

  const canEdit = currentUser.role === 'admin' || currentUser.id === parseInt(id);

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{user.username}'s Profile</h1>
        <div>
          <Link to="/users" className="btn btn-outline-secondary me-2">
            Back to Users
          </Link>
          {canEdit && (
            <Link to={`/users/${id}/edit`} className="btn btn-outline-primary me-2">
              Edit Profile
            </Link>
          )}
          {currentUser.role === 'admin' && currentUser.id !== parseInt(id) && (
            <Button variant="outline-danger" onClick={handleDeactivate}>
              Deactivate User
            </Button>
          )}
        </div>
      </div>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>User Information</Card.Header>
            <Card.Body>
              <div className="text-center mb-4">
                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <h4>{user.username}</h4>
                <p>{user.email}</p>
                <div>{getRoleBadge(user.role)}</div>
              </div>

              <hr />

              <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
              <p><strong>Last Updated:</strong> {new Date(user.updatedAt).toLocaleDateString()}</p>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>Statistics</Card.Header>
            <Card.Body>
              <Row>
                <Col xs={6} className="text-center mb-3">
                  <h5>{projects.length}</h5>
                  <p className="text-muted mb-0">Projects</p>
                </Col>
                <Col xs={6} className="text-center mb-3">
                  <h5>{tasks.length}</h5>
                  <p className="text-muted mb-0">Tasks</p>
                </Col>
                <Col xs={6} className="text-center">
                  <h5>{tasks.filter(task => task.status === 'done').length}</h5>
                  <p className="text-muted mb-0">Completed</p>
                </Col>
                <Col xs={6} className="text-center">
                  <h5>{tasks.filter(task => task.status === 'in_progress').length}</h5>
                  <p className="text-muted mb-0">In Progress</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Tabs defaultActiveKey="projects" className="mb-4">
            <Tab eventKey="projects" title="Projects">
              <Card>
                {projects.length === 0 ? (
                  <Card.Body>
                    <p className="text-center mb-0">No projects assigned.</p>
                  </Card.Body>
                ) : (
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Role</th>
                        <th>Tasks</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map(project => (
                        <tr key={project.id}>
                          <td>
                            <Link to={`/projects/${project.id}`} className="text-decoration-none">
                              {project.title}
                            </Link>
                          </td>
                          <td>
                            <Badge bg={
                              project.status === 'completed' ? 'success' :
                              project.status === 'in_progress' ? 'primary' :
                              project.status === 'on_hold' ? 'warning' : 'secondary'
                            }>
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td>{project.UserProject?.role || 'Member'}</td>
                          <td>{project.tasks?.length || 0}</td>
                          <td>
                            <Link to={`/projects/${project.id}`} className="btn btn-sm btn-outline-primary">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </Tab>

            <Tab eventKey="tasks" title="Tasks">
              <Card>
                {tasks.length === 0 ? (
                  <Card.Body>
                    <p className="text-center mb-0">No tasks assigned.</p>
                  </Card.Body>
                ) : (
                  <Table responsive hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map(task => (
                        <tr key={task.id}>
                          <td>
                            <Link to={`/tasks/${task.id}`} className="text-decoration-none">
                              {task.title}
                            </Link>
                          </td>
                          <td>
                            {task.project ? (
                              <Link to={`/projects/${task.project.id}`} className="text-decoration-none">
                                {task.project.title}
                              </Link>
                            ) : 'N/A'}
                          </td>
                          <td><TaskStatusBadge status={task.status} /></td>
                          <td><TaskPriorityBadge priority={task.priority} /></td>
                          <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}</td>
                          <td>
                            <Link to={`/tasks/${task.id}`} className="btn btn-sm btn-outline-primary">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </Tab>

            <Tab eventKey="activity" title="Activity">
              <Card body>
                <p className="text-center mb-0">Activity tracking will be implemented in a future update.</p>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </div>
  );
};

export default UserProfile;
