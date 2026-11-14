import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import { Link } from 'react-router-dom';
import MaterialGrid from '../components/MaterialGrid';

function HomePage({ books = [], loading, error }) {
  const featuredBook = books[0];
  const [failedCoverUrl, setFailedCoverUrl] = useState('');
  const hasCover = featuredBook?.image && failedCoverUrl !== featuredBook.image;

  return (
    <main>
      <Container fluid className="home-hero-container my-4 my-lg-5">
        <section className="home-hero p-3 p-lg-4 rounded-4">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <p className="eyebrow">Cerita Indonesia, dekat di hati</p>
              <h1 className="display-4 fw-bold lh-sm text-body-emphasis">
                Temukan cerita yang <span className="home-hero__accent">tinggal lama.</span>
              </h1>
              <p className="lead mt-3">
                Pilihan buku Indonesia yang kami suka, dari kisah keluarga dan
                persahabatan sampai cerita yang membuka cara pandang baru.
              </p>
              <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
                <Button href="#buku" size="lg" className="home-hero__button">
                  Jelajahi koleksi
                </Button>
                {featuredBook && (
                  <Button
                    as={Link}
                    to={`/buku/${featuredBook.id}`}
                    variant="outline-dark"
                    size="lg"
                  >
                    Lihat buku pilihan
                  </Button>
                )}
                <span className="home-hero__note">Dibaca, disimpan, diceritakan kembali.</span>
              </div>
            </div>
            <div className="col-lg-5">
              <div
                className="home-hero__visual"
                aria-label={featuredBook ? `Pilihan buku: ${featuredBook.title}` : 'Pilihan buku'}
              >
                {hasCover ? (
                  <img
                    className="home-hero__image"
                    src={featuredBook.image}
                    alt={`Sampul buku ${featuredBook.title} karya ${featuredBook.author}`}
                    onError={() => setFailedCoverUrl(featuredBook.image)}
                  />
                ) : null}
                {featuredBook && hasCover ? (
                  <div className="home-hero__image-caption">
                    <span>Sorotan koleksi</span>
                    <strong>{featuredBook.title}</strong>
                    <span>{featuredBook.author}</span>
                  </div>
                ) : featuredBook ? (
                  <div className="home-hero__cover-placeholder">
                    <span>Sorotan koleksi</span>
                    <strong>{featuredBook.title}</strong>
                    <span>{featuredBook.author}</span>
                  </div>
                ) : (
                  <div className="home-hero__cover-placeholder" aria-hidden="true">
                    <span>Koleksi Worthbook</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </Container>
      <div id="buku">
        <MaterialGrid books={books} loading={loading} error={error} />
      </div>
    </main>
  );
}

export default HomePage;
