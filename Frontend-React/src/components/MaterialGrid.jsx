import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import MaterialCard from './MaterialCard';

function MaterialGrid({ books, loading = false, error = '', search = '', onSearchChange }) {
  return (
    <Container className="book-grid py-4 py-lg-5">
      <div className="section-heading text-center">
        <p className="eyebrow">Pilihan Worthbook</p>
        <h2 className="fw-bold">Cerita Indonesia, untuk semua pembaca</h2>
        <p className="text-muted section-copy mx-auto">
          Temukan novel dan karya pilihan penulis Indonesia yang layak menemani rak bukumu.
        </p>
      </div>
      {!loading && !error && onSearchChange && (
        <Form.Group className="mx-auto my-4" style={{ maxWidth: '36rem' }}>
          <Form.Label htmlFor="book-search" className="visually-hidden">Cari buku</Form.Label>
          <Form.Control
            id="book-search"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari judul, penulis, atau kategori..."
            type="search"
            value={search}
          />
        </Form.Group>
      )}
      {loading ? (
        <div className="text-center py-4" role="status">
          <Spinner animation="border" className="me-2" />
          Memuat katalog buku...
        </div>
      ) : error ? (
        <Alert variant="danger" role="alert">{error}</Alert>
      ) : books.length === 0 ? (
        <Alert variant="info">{search ? 'Buku tidak ditemukan. Coba kata kunci lain.' : 'Belum ada buku di katalog.'}</Alert>
      ) : (
        <Row xs={1} sm={2} lg={3} className="g-4">
          {books.map((book) => (
            <Col key={book.id}>
              <MaterialCard material={book} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default MaterialGrid;