import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { FaBookJournalWhills } from 'react-icons/fa6';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useCart } from '../auth/useCart';

const navItems = [
  { path: '/', label: 'Beranda' },
  { path: '/book', label: 'Buku' },
  { path: '/about', label: 'Tentang kami' },
  { path: '/contact', label: 'Kontak' },
];

function NavbarComponent() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { pathname } = useLocation();
  const isAdminArea = user?.role === 'admin' || pathname.startsWith('/admin');
  const [logoutError, setLogoutError] = useState('');

  async function handleLogout() {
    setLogoutError('');
    try {
      await logout();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Token tidak dapat dicabut dari server.');
    }
  }

  return (
    <>
      <Navbar collapseOnSelect expand="lg" className="store-navbar">
        <Container>
          <Navbar.Brand as={Link} to={isAdminArea ? '/admin' : '/'}>
            <FaBookJournalWhills className="me-2 store-navbar__icon" />
            Worthbook
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navigation" />
          <Navbar.Collapse id="main-navigation">
            {!isAdminArea && (
              <Nav className="mx-auto justify-content-center">
                {navItems.map((item) => (
                  <Nav.Link
                    as={NavLink}
                    to={item.path}
                    end={item.path === '/'}
                    key={item.path}
                    className="text-center"
                  >
                    {item.label}
                  </Nav.Link>
                ))}
              </Nav>
            )}
            <Nav className="d-flex gap-2 align-items-lg-center">
              {user ? (
                <>
                  <span className="store-navbar__welcome">
                    Halo, {user.name || user.username || user.email}
                  </span>
                  {user.role === 'customer' && (
                    <>
                      <Nav.Link as={NavLink} to="/keranjang" className="text-center">
                        Keranjang <Badge bg="dark">{itemCount}</Badge>
                      </Nav.Link>
                      <Nav.Link as={NavLink} to="/pesanan" className="text-center">
                        Pesanan saya
                      </Nav.Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <Nav.Link as={NavLink} to="/admin" className="text-center">
                      Dashboard admin
                    </Nav.Link>
                  )}
                  <Nav.Link as="button" onClick={handleLogout} className="text-center btn btn-outline-dark px-3">
                    Keluar
                  </Nav.Link>
                </>
              ) : !isAdminArea ? (
                <>
                  <Nav.Link as={NavLink} to="/register" className="text-center btn btn-primary px-3">
                    Register
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/login" className="text-center btn btn-primary px-3">
                    Login
                  </Nav.Link>
                </>
              ) : null}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {logoutError && <Alert variant="warning" className="m-0 rounded-0">{logoutError}</Alert>}
    </>
  );
}

export default NavbarComponent;
