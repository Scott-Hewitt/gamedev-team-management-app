import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, Alert, Spinner, Form, Modal, ListGroup } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import TaskStatusBadge from '../../components/tasks/TaskStatusBadge';
import TaskPriorityBadge from '../../components/tasks/TaskPriorityBadge';
import TaskComments from '../../components/comments/TaskComments';

const TaskDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  // Component state
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Fetch task data on component mount
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get(`/tasks/${id}`);
        setTask(response.data);
      } catch (error) {
        console.error('Error fetching task:', error);
        setError('Failed to load task data');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  // Event handlers for task actions
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;

    try {
      setStatusLoading(true);

      await api.patch(`/tasks/${id}`, { status: newStatus });

      setTask(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      try {
        await api.delete(`/tasks/${id}`);
        navigate('/tasks', { state: { message: 'Task deleted successfully' } });
      } catch (error) {
        console.error('Error deleting task:', error);
        setError('Failed to delete task');
      }
    }
  };

  const openAssignModal = async () => {
    try {
      // Get all users
      const response = await api.get('/users');

      // Filter out users already assigned to the task
      const assigneeIds = task.assignees.map(a => a.id);
      const filteredUsers = response.data.filter(u => !assigneeIds.includes(u.id));

      setAvailableUsers(filteredUsers);
      setShowAssignModal(true);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load available users');
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUser) return;

    try {
      setAssignLoading(true);

      // Assign user to task
      await api.post(`/tasks/${id}/assign-user`, { userId: selectedUser });

      // Refresh task data
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);

      // Reset and close modal
      setSelectedUser('');
      setShowAssignModal(false);
    } catch (error) {
      console.error('Error assigning user:', error);
      setError('Failed to assign user to task');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveAssignee = async (userId) => {
    try {
      // Remove user from task
      await api.delete(`/tasks/${id}/assign/${userId}`);

      // Refresh task data
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);
    } catch (error) {
      console.error('Error removing assignee:', error);
      setError('Failed to remove assignee from task');
    }
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

  // Render loading state
  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!task) {
    return <Alert variant="danger">Task not found</Alert>;
  }

  const canEdit = user.role === 'admin' || user.role === 'manager' ||
                 task.assignees?.some(a => a.id === user.id);

  // Main component render
  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{task.title}</h1>
        <div>
          <Link to="/tasks" className="btn btn-outline-secondary me-2">
            Back to Tasks
          </Link>
          {canEdit && (
            <>
              <Link to={`/tasks/${id}/edit`} className="btn btn-outline-primary me-2">
                Edit Task
              </Link>
              {(user.role === 'admin' || user.role === 'manager') && (
                <Button variant="outline-danger" onClick={handleDelete}>
                  Delete Task
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Row className="mb-4">
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>Task Details</Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Project:</strong> {task.project ? (
                    <Link to={`/projects/${task.project.id}`}>
                      {task.project.title}
                    </Link>
                  ) : 'Not assigned to a project'}</p>

                  <p>
                    <strong>Status:</strong>{' '}
                    {canEdit ? (
                      <Form.Select
                        value={task.status}
                        onChange={handleStatusChange}
                        disabled={statusLoading}
                        className="d-inline-block ms-2"
                        style={{ width: 'auto' }}
                      >
                        <option value="backlog">Backlog</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </Form.Select>
                    ) : (
                      getStatusBadge(task.status)
                    )}
                  </p>

                  <p><strong>Priority:</strong> {getPriorityBadge(task.priority)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Created:</strong> {new Date(task.createdAt).toLocaleDateString()}</p>
                  <p><strong>Due Date:</strong> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}</p>
                  <p>
                    <strong>Estimated Hours:</strong> {task.estimated_hours || 'Not set'}
                    {task.actual_hours && ` / Actual: ${task.actual_hours}`}
                  </p>
                </Col>
              </Row>

              <h5>Description</h5>
              <p className="mb-4">{task.description || 'No description provided.'}</p>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Assignees</h5>
                {(user.role === 'admin' || user.role === 'manager') && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={openAssignModal}
                  >
                    Assign User
                  </Button>
                )}
              </div>
              {task.assignees?.length > 0 ? (
                <ListGroup className="mb-3">
                  {task.assignees.map(assignee => (
                    <ListGroup.Item
                      key={assignee.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <Link to={`/users/${assignee.id}`}>
                          {assignee.username}
                        </Link>
                        {' '}
                        <Badge bg="secondary">{assignee.role}</Badge>
                      </div>
                      {(user.role === 'admin' || user.role === 'manager') && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveAssignee(assignee.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p>No assignees</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>Activity</Card.Header>
            <Card.Body>
              <p className="text-muted">Task activity will be displayed here in a future update.</p>
            </Card.Body>
          </Card>

          <TaskComments taskId={id} />
        </Col>
      </Row>

      {/* Assign User Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign User to Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {availableUsers.length === 0 ? (
            <Alert variant="info">All users are already assigned to this task.</Alert>
          ) : (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Select User</Form.Label>
                <Form.Select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.role})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAssignUser}
            disabled={!selectedUser || assignLoading || availableUsers.length === 0}
          >
            {assignLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Assigning...
              </>
            ) : 'Assign User'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TaskDetail;
