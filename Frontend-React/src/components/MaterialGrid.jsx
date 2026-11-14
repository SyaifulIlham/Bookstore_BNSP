import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import MaterialCard from './MaterialCard';

function MaterialGrid({ books, loading = false, error = '' }) {
  return (
    <Container className="book-grid py-4 py-lg-5">
      <div className="section-heading text-center">
        <p className="eyebrow">Pilihan Worthbook</p>
        <h2 className="fw-bold">Cerita Indonesia, untuk semua pembaca</h2>
        <p className="text-muted section-copy mx-auto">
          Temukan novel dan karya pilihan penulis Indonesia yang layak menemani rak bukumu.
        </p>
      </div>
      {loading ? (
        <div className="text-center py-4" role="status">
          <Spinner animation="border" className="me-2" />
          Memuat katalog buku...
        </div>
      ) : error ? (
        <Alert variant="danger" role="alert">{error}</Alert>
      ) : books.length === 0 ? (
        <Alert variant="info">Belum ada buku di katalog.</Alert>
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