import { Container, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <Container className="text-center py-5">
      <Alert variant="danger">
        <Alert.Heading>Access Denied</Alert.Heading>
        <p>
          You do not have permission to access this page. This area requires higher privileges.
        </p>
      </Alert>
      <Button as={Link} to="/" variant="primary">
        Return to Dashboard
      </Button>
    </Container>
  );
};

export default Unauthorized;
