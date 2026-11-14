import MaterialGrid from '../components/MaterialGrid';

function BookPage({ books, loading, error }) {
  return (
    <main>
      <MaterialGrid books={books} loading={loading} error={error} />
    </main>
  );
}

export default BookPage;