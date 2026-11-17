import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';

function AboutPage() {
  return (
    <main className="page-shell py-5">
      <Container>
        <section className="section-heading text-center mb-5">
          <p className="eyebrow">Tentang Worthbook</p>
          <h1 className="fw-bold">Buku yang tepat, cerita yang selalu dekat</h1>
          <p className="text-muted mx-auto section-copy">
            Worthbook adalah toko buku online yang membantu pembaca menemukan dan memesan
            buku pilihan dengan pengalaman belanja yang sederhana.
          </p>
        </section>
        <div className="row g-4 justify-content-center">
          <div className="col-md-6">
            <Card className="about-card h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <h2 className="h4 fw-bold">Misi kami</h2>
                <p className="text-muted mb-0">
                  Memudahkan akses ke beragam bacaan dan mendukung kebiasaan membaca
                  melalui katalog yang mudah dijelajahi.
                </p>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-6">
            <Card className="about-card h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <h2 className="h4 fw-bold">Layanan kami</h2>
                <p className="text-muted mb-0">
                  Setiap buku menampilkan informasi, harga, dan stok. Pengguna dapat
                  menyimpan buku di keranjang dan mengirim pesanan secara online.
                </p>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}

export default AboutPage;
