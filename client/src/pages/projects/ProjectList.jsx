import { useState, useEffect } from 'react';
import { Table, Button, Badge, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const ProjectList = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

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
          <h1>Projects</h1>
        </Col>
        <Col xs="auto">
          {(user.role === 'admin' || user.role === 'manager') && (
            <Link to="/projects/new" className="btn btn-primary">
              Create New Project
            </Link>
          )}
        </Col>
      </Row>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {projects.length === 0 ? (
        <Card body>
          <p className="text-center mb-0">No projects found. {(user.role === 'admin' || user.role === 'manager') && 'Create your first project!'}</p>
        </Card>
      ) : (
        <Card>
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Manager</th>
                <th>Start Date</th>
                <th>End Date</th>
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
                  <td>{getStatusBadge(project.status)}</td>
                  <td>{project.manager?.username || 'N/A'}</td>
                  <td>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</td>
                  <td>{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}</td>
                  <td>
                    <Link to={`/projects/${project.id}`} className="btn btn-sm btn-outline-primary me-2">
                      View
                    </Link>
                    {(user.role === 'admin' || (user.role === 'manager' && project.manager_id === user.id)) && (
                      <Link to={`/projects/${project.id}/edit`} className="btn btn-sm btn-outline-secondary">
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

export default ProjectList;
