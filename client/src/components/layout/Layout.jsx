import { Container } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="flex-grow-1 py-3">
        <Outlet />
      </Container>
      <Footer />
    </div>
  );
};

export default Layout;
