import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-3 mt-auto">
      <Container className="text-center">
        <p className="mb-0">
          &copy; {new Date().getFullYear()} Game Development Team Management System
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
