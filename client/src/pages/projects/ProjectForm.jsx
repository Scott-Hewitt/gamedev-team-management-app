import { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const ProjectForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProject = async () => {
      if (!isEditMode) return;
      
      try {
        setFetchLoading(true);
        const response = await api.get(`/projects/${id}`);
        const project = response.data;
        
        // Format dates for form inputs
        if (project.start_date) {
          project.start_date = new Date(project.start_date).toISOString().split('T')[0];
        }
        if (project.end_date) {
          project.end_date = new Date(project.end_date).toISOString().split('T')[0];
        }
        
        reset(project);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project data');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProject();
  }, [id, isEditMode, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      
      if (isEditMode) {
        await api.put(`/projects/${id}`, data);
        navigate(`/projects/${id}`, { state: { message: 'Project updated successfully' } });
      } else {
        const response = await api.post('/projects', data);
        navigate(`/projects/${response.data.project.id}`, { state: { message: 'Project created successfully' } });
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setError(error.response?.data?.message || 'Failed to save project');
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
      <h1 className="mb-4">{isEditMode ? 'Edit Project' : 'Create New Project'}</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3" controlId="title">
              <Form.Label>Project Title</Form.Label>
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
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.status?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              {isEditMode && (user.role === 'admin') && (
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="manager_id">
                    <Form.Label>Project Manager</Form.Label>
                    <Form.Control
                      type="number"
                      {...register('manager_id', { 
                        required: 'Manager ID is required',
                        valueAsNumber: true
                      })}
                      isInvalid={!!errors.manager_id}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.manager_id?.message}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Enter the user ID of the project manager
                    </Form.Text>
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="start_date">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    {...register('start_date')}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3" controlId="end_date">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    {...register('end_date')}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-between">
              <Link to={isEditMode ? `/projects/${id}` : '/projects'} className="btn btn-outline-secondary">
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
                  isEditMode ? 'Update Project' : 'Create Project'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProjectForm;
