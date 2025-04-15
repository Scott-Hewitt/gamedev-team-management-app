import { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const TaskForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  
  const isEditMode = !!id;
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects');
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
      }
    };

    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchTask = async () => {
      if (!isEditMode) {
        // If creating a new task with a project pre-selected
        if (projectId) {
          setValue('project_id', projectId);
        }
        return;
      }
      
      try {
        setFetchLoading(true);
        const response = await api.get(`/tasks/${id}`);
        const task = response.data;
        
        // Format dates for form inputs
        if (task.due_date) {
          task.due_date = new Date(task.due_date).toISOString().split('T')[0];
        }
        
        // Set form values
        reset({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          project_id: task.project?.id || '',
          due_date: task.due_date,
          estimated_hours: task.estimated_hours,
          actual_hours: task.actual_hours
        });
        
        // Set selected assignees
        if (task.assignees) {
          setSelectedAssignees(task.assignees.map(a => a.id.toString()));
        }
      } catch (error) {
        console.error('Error fetching task:', error);
        setError('Failed to load task data');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchTask();
  }, [id, isEditMode, reset, setValue, projectId]);

  const handleAssigneeChange = (e) => {
    const options = e.target.options;
    const values = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    setSelectedAssignees(values);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      
      // Add assignees to the data
      const taskData = {
        ...data,
        assignee_ids: selectedAssignees.map(id => parseInt(id))
      };
      
      if (isEditMode) {
        await api.put(`/tasks/${id}`, taskData);
        navigate(`/tasks/${id}`, { state: { message: 'Task updated successfully' } });
      } else {
        const response = await api.post('/tasks', taskData);
        navigate(`/tasks/${response.data.task.id}`, { state: { message: 'Task created successfully' } });
      }
    } catch (error) {
      console.error('Error saving task:', error);
      setError(error.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
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
      <h1 className="mb-4">{isEditMode ? 'Edit Task' : 'Create New Task'}</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3" controlId="title">
              <Form.Label>Task Title</Form.Label>
              <Form.Control
                type="text"
                {...register('title', { 
                  required: 'Title is required',
                  minLength: {
                    value: 3,
                    message: 'Title must be at least 3 characters'
                  }
                })}
                isInvalid={!!errors.title}
              />
              <Form.Control.Feedback type="invalid">
                {errors.title?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                {...register('description')}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="status">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    {...register('status', { required: 'Status is required' })}
                    isInvalid={!!errors.status}
                    defaultValue="todo"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.status?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="priority">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    {...register('priority', { required: 'Priority is required' })}
                    isInvalid={!!errors.priority}
                    defaultValue="medium"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.priority?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="project_id">
                  <Form.Label>Project</Form.Label>
                  <Form.Select
                    {...register('project_id')}
                  >
                    <option value="">No Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="due_date">
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    {...register('due_date')}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="estimated_hours">
                  <Form.Label>Estimated Hours</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.5"
                    min="0"
                    {...register('estimated_hours', {
                      valueAsNumber: true
                    })}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="actual_hours">
                  <Form.Label>Actual Hours</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.5"
                    min="0"
                    {...register('actual_hours', {
                      valueAsNumber: true
                    })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="assignees">
              <Form.Label>Assignees</Form.Label>
              <Form.Select 
                multiple 
                value={selectedAssignees}
                onChange={handleAssigneeChange}
                style={{ height: '150px' }}
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Hold Ctrl (or Cmd on Mac) to select multiple users
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Link to={isEditMode ? `/tasks/${id}` : '/tasks'} className="btn btn-outline-secondary">
                Cancel
              </Link>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditMode ? 'Update Task' : 'Create Task'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TaskForm;
