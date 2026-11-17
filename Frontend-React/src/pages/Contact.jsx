import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Row from 'react-bootstrap/Row';
import { useAuth } from '../auth/useAuth';
import { apiRequest } from '../services/api';

function ContactPage() {
  const { token } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setSending(true);
    setError('');
    setSuccess('');

    try {
      await apiRequest('/contact-messages', {
        method: 'POST',
        token,
        body: {
          name: form.elements.namedItem('name').value,
          email: form.elements.namedItem('email').value,
          subject: form.elements.namedItem('subject').value,
          message: form.elements.namedItem('message').value,
        },
      });
      form.reset();
      setSuccess('Pesan berhasil dikirim ke admin. Terima kasih telah menghubungi kami.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Pesan gagal dikirim.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <Container className="page-shell py-5">
        <div className="section-heading text-center mb-5">
          <p className="eyebrow">Hubungi Worthbook</p>
          <h1 className="fw-bold">Ada yang ingin ditanyakan?</h1>
        </div>
        <Row className="g-4 align-items-stretch">
          <Col lg={5}>
            <div className="contact-panel h-100">
              <h2 className="h3 mb-4">Informasi kontak</h2>
              <ListGroup variant="flush" className="contact-list">
                <ListGroup.Item><strong>Email</strong><div>hello@worthbook.co</div></ListGroup.Item>
                <ListGroup.Item><strong>Telepon</strong><div>+62 812-3456-7890</div></ListGroup.Item>
                <ListGroup.Item><strong>Alamat</strong><div>Jl. Merdeka No. 12, Jakarta Selatan</div></ListGroup.Item>
              </ListGroup>
            </div>
          </Col>
          <Col lg={7}>
            <div className="contact-panel h-100 p-4">
              {error && <Alert variant="danger" role="alert">{error}</Alert>}
              {success && <Alert variant="success" role="status">{success}</Alert>}
              <Form className="contact-form" onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="contact-name">
                      <Form.Label>Nama</Form.Label>
                      <Form.Control name="name" type="text" placeholder="Masukkan nama Anda" maxLength={255} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="contact-email">
                      <Form.Label>Email</Form.Label>
                      <Form.Control name="email" type="email" placeholder="email@contoh.com" maxLength={255} required />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group controlId="contact-subject">
                      <Form.Label>Subjek</Form.Label>
                      <Form.Control name="subject" type="text" placeholder="Topik pesan Anda" maxLength={255} required />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group controlId="contact-message">
                      <Form.Label>Pesan</Form.Label>
                      <Form.Control name="message" as="textarea" rows={5} maxLength={5000} placeholder="Tuliskan kebutuhan Anda" required />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Button disabled={sending} type="submit" className="px-4">
                      {sending ? 'Mengirim...' : 'Kirim Pesan'}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </main>
  );
}

export default ContactPage;
