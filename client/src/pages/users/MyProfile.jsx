import { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Alert, Spinner, Tab, Tabs, Table, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import TaskStatusBadge from '../../components/tasks/TaskStatusBadge';
import TaskPriorityBadge from '../../components/tasks/TaskPriorityBadge';

const MyProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError('');

        // Fetch user's projects
        const projectsResponse = await api.get(`/users/${user.id}/projects`);
        setProjects(projectsResponse.data);

        // Fetch user's tasks
        const tasksResponse = await api.get(`/users/${user.id}/tasks`);
        setTasks(tasksResponse.data);

        // Set form values for password change
        reset({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load your profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, reset]);

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

  const onPasswordChange = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      setUpdateError('New passwords do not match');
      return;
    }

    try {
      setUpdateLoading(true);
      setUpdateError('');
      setUpdateSuccess('');

      await api.post('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      setUpdateSuccess('Password changed successfully');

      // Reset form
      reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setUpdateError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    return <Alert variant="danger">You must be logged in to view your profile</Alert>;
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Profile</h1>
        <div>
          <Link to={`/users/${user.id}/edit`} className="btn btn-outline-primary me-2">
            Edit Profile
          </Link>
          <Button variant="outline-secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>Profile Information</Card.Header>
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
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="overview" title="Overview">
              <Card>
                <Card.Header>Recent Activity</Card.Header>
                <Card.Body>
                  <p className="text-muted">Your recent activity will be displayed here in a future update.</p>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="projects" title="My Projects">
              <Card>
                {projects.length === 0 ? (
                  <Card.Body>
                    <p className="text-center mb-0">You are not assigned to any projects yet.</p>
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

            <Tab eventKey="tasks" title="My Tasks">
              <Card>
                {tasks.length === 0 ? (
                  <Card.Body>
                    <p className="text-center mb-0">You don't have any tasks assigned yet.</p>
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

            <Tab eventKey="security" title="Security">
              <Card>
                <Card.Header>Change Password</Card.Header>
                <Card.Body>
                  {updateError && <Alert variant="danger">{updateError}</Alert>}
                  {updateSuccess && <Alert variant="success">{updateSuccess}</Alert>}

                  <Form onSubmit={handleSubmit(onPasswordChange)}>
                    <Form.Group className="mb-3" controlId="currentPassword">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        {...register('currentPassword', {
                          required: 'Current password is required'
                        })}
                        isInvalid={!!errors.currentPassword}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.currentPassword?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="newPassword">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        {...register('newPassword', {
                          required: 'New password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters'
                          }
                        })}
                        isInvalid={!!errors.newPassword}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.newPassword?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="confirmPassword">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        {...register('confirmPassword', {
                          required: 'Please confirm your new password'
                        })}
                        isInvalid={!!errors.confirmPassword}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.confirmPassword?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Button
                      variant="primary"
                      type="submit"
                      disabled={updateLoading}
                    >
                      {updateLoading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Updating...
                        </>
                      ) : 'Change Password'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </div>
  );
};

export default MyProfile;
