import { useState, useEffect } from 'react';
import { Table, Button, Badge, Card, Alert, Spinner, Row, Col, Form } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const TaskList = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    projectId: searchParams.get('project') || ''
  });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.priority) queryParams.append('priority', filters.priority);
        if (filters.projectId) queryParams.append('projectId', filters.projectId);
        
        const queryString = queryParams.toString();
        const url = queryString ? `/tasks?${queryString}` : '/tasks';
        
        const response = await api.get(url);
        setTasks(response.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    
    // Update URL search params
    const newSearchParams = new URLSearchParams();
    if (filters.status) newSearchParams.set('status', filters.status);
    if (filters.priority) newSearchParams.set('priority', filters.priority);
    if (filters.projectId) newSearchParams.set('project', filters.projectId);
    setSearchParams(newSearchParams);
    
  }, [filters, setSearchParams]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      projectId: ''
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'backlog': 'secondary',
      'todo': 'info',
      'in_progress': 'primary',
      'review': 'warning',
      'done': 'success'
    };
    
    return (
      <Badge bg={statusMap[status] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      'low': 'secondary',
      'medium': 'info',
      'high': 'warning',
      'critical': 'danger'
    };
    
    return (
      <Badge bg={priorityMap[priority] || 'secondary'}>
        {priority}
      </Badge>
    );
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

  return (
    <div>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Tasks</h1>
        </Col>
        <Col xs="auto">
          <Link to="/tasks/new" className="btn btn-primary">
            Create New Task
          </Link>
        </Col>
      </Row>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header>Filters</Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select 
                  name="status" 
                  value={filters.status} 
                  onChange={handleFilterChange}
                >
                  <option value="">All Statuses</option>
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Priority</Form.Label>
                <Form.Select 
                  name="priority" 
                  value={filters.priority} 
                  onChange={handleFilterChange}
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Project</Form.Label>
                <Form.Select 
                  name="projectId" 
                  value={filters.projectId} 
                  onChange={handleFilterChange}
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                className="mb-3" 
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {tasks.length === 0 ? (
        <Card body>
          <p className="text-center mb-0">No tasks found. Create your first task!</p>
        </Card>
      ) : (
        <Card>
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Title</th>
                <th>Project</th>
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
                  <td>
                    {task.project ? (
                      <Link to={`/projects/${task.project.id}`} className="text-decoration-none">
                        {task.project.title}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>{getStatusBadge(task.status)}</td>
                  <td>{getPriorityBadge(task.priority)}</td>
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
                    {(user.role === 'admin' || user.role === 'manager' || 
                      task.assignees?.some(a => a.id === user.id)) && (
                      <Link to={`/tasks/${task.id}/edit`} className="btn btn-sm btn-outline-secondary">
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default TaskList;
