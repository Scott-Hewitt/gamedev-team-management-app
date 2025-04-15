import { useState, useEffect } from 'react';
import { Table, Button, Badge, Card, Alert, Spinner, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const UserList = () => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    role: searchParams.get('role') || '',
    search: searchParams.get('search') || ''
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');

        // Only admins and managers can access this page
        if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
          setError('You do not have permission to view this page');
          setLoading(false);
          return;
        }

        const response = await api.get('/users');

        // Apply filters
        let filteredUsers = response.data;

        if (filters.role) {
          filteredUsers = filteredUsers.filter(user => user.role === filters.role);
        }

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredUsers = filteredUsers.filter(user =>
            user.username.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
          );
        }

        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    // Update URL search params
    const newSearchParams = new URLSearchParams();
    if (filters.role) newSearchParams.set('role', filters.role);
    if (filters.search) newSearchParams.set('search', filters.search);
    setSearchParams(newSearchParams);

  }, [filters, setSearchParams, currentUser]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      search: ''
    });
  };

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

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error && (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Team Members</h1>
        </Col>
        {currentUser.role === 'admin' && (
          <Col xs="auto">
            <Link to="/users/invite" className="btn btn-primary">
              Invite New User
            </Link>
          </Col>
        )}
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Header>Filters</Card.Header>
        <Card.Body>
          <Row>
            <Col md={5}>
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by name or email"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </InputGroup>
            </Col>

            <Col md={5}>
              <Form.Group className="mb-3">
                <Form.Select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="developer">Developer</option>
                  <option value="designer">Designer</option>
                  <option value="tester">Tester</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2} className="d-flex align-items-center">
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

      {users.length === 0 ? (
        <Card body>
          <p className="text-center mb-0">No users found matching your filters.</p>
        </Card>
      ) : (
        <Card>
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Projects</th>
                <th>Tasks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <Link to={`/users/${user.id}`} className="text-decoration-none">
                      {user.username}
                    </Link>
                  </td>
                  <td>{user.email}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{user.projects || 0}</td>
                  <td>{user.tasks || 0}</td>
                  <td>
                    <Link to={`/users/${user.id}`} className="btn btn-sm btn-outline-primary me-2">
                      View
                    </Link>
                    {currentUser.role === 'admin' && (
                      <Link to={`/users/${user.id}/edit`} className="btn btn-sm btn-outline-secondary">
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

export default UserList;
