import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">Game Dev Management</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
            {user && (
              <>
                <Nav.Link as={Link} to="/projects">Projects</Nav.Link>
                <Nav.Link as={Link} to="/tasks">Tasks</Nav.Link>
                {(user.role === 'admin' || user.role === 'manager') && (
                  <Nav.Link as={Link} to="/users">Users</Nav.Link>
                )}
              </>
            )}
          </Nav>
          <Nav>
            {user ? (
              <NavDropdown title={user.username} id="basic-nav-dropdown" align="end">
                <NavDropdown.Item as={Link} to="/profile">My Profile</NavDropdown.Item>
                {(user.role === 'admin' || user.role === 'manager') && (
                  <NavDropdown.Item as={Link} to="/users">Manage Users</NavDropdown.Item>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
