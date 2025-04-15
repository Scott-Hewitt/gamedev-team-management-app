import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Alert, Spinner, Tab, Tabs, Table } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import TeamManagement from '../../components/teams/TeamManagement';
import TaskStatusBadge from '../../components/tasks/TaskStatusBadge';
import TaskPriorityBadge from '../../components/tasks/TaskPriorityBadge';

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch project details
        const projectResponse = await api.get(`/projects/${id}`);
        setProject(projectResponse.data);

        // Fetch project tasks
        const tasksResponse = await api.get(`/projects/${id}/tasks`);
        setTasks(tasksResponse.data);

        // Fetch project stats
        const statsResponse = await api.get(`/projects/${id}/stats`);
        setStats(statsResponse.data);
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  const getStatusBadge = (status) => {
    const statusMap = {
      'planning': 'info',
      'in_progress': 'primary',
      'on_hold': 'warning',
      'completed': 'success',
      'cancelled': 'danger'
    };

    return (
      <Badge bg={statusMap[status] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  // Use the TaskStatusBadge component instead of a local function

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await api.delete(`/projects/${id}`);
        navigate('/projects', { state: { message: 'Project deleted successfully' } });
      } catch (error) {
        console.error('Error deleting project:', error);
        setError('Failed to delete project');
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

  if (!project) {
    return <Alert variant="danger">Project not found</Alert>;
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{project.title}</h1>
        <div>
          <Link to="/projects" className="btn btn-outline-secondary me-2">
            Back to Projects
          </Link>
          {(user.role === 'admin' || (user.role === 'manager' && project.manager_id === user.id)) && (
            <>
              <Link to={`/projects/${id}/edit`} className="btn btn-outline-primary me-2">
                Edit Project
              </Link>
              <Button variant="outline-danger" onClick={handleDelete}>
                Delete Project
              </Button>
            </>
          )}
        </div>
      </div>

      <Row className="mb-4">
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>Project Details</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Status:</strong> {getStatusBadge(project.status)}</p>
                  <p><strong>Manager:</strong> {project.manager?.username || 'N/A'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Start Date:</strong> {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</p>
                  <p><strong>End Date:</strong> {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}</p>
                </Col>
              </Row>
              <hr />
              <h5>Description</h5>
              <p>{project.description || 'No description provided.'}</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {stats && (
            <Card className="mb-4">
              <Card.Header>Project Statistics</Card.Header>
              <Card.Body>
                <p><strong>Total Tasks:</strong> {stats.totalTasks}</p>
                <p><strong>Completed Tasks:</strong> {stats.completedTasks} ({Math.round(stats.completionRate)}%)</p>
                <p><strong>In Progress:</strong> {stats.inProgressTasks}</p>
                <p><strong>Estimated Hours:</strong> {stats.totalEstimatedHours || 0}</p>
                <p><strong>Actual Hours:</strong> {stats.totalActualHours || 0}</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      <Tabs defaultActiveKey="tasks" className="mb-4">
        <Tab eventKey="tasks" title="Tasks">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Project Tasks</h5>
              <Link to={`/tasks/new?project=${id}`} className="btn btn-sm btn-primary">
                Add Task
              </Link>
            </Card.Header>
            <Card.Body>
              {tasks.length === 0 ? (
                <p className="text-center">No tasks found for this project.</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Assignees</th>
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
                        <td><TaskStatusBadge status={task.status} /></td>
                        <td><TaskPriorityBadge priority={task.priority} /></td>
                        <td>
                          {task.assignees?.length > 0
                            ? task.assignees.map(a => a.username).join(', ')
                            : 'Unassigned'}
                        </td>
                        <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}</td>
                        <td>
                          <Link to={`/tasks/${task.id}`} className="btn btn-sm btn-outline-primary me-2">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="team" title="Team">
          <TeamManagement projectId={id} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;
