import { useMemo, useState } from 'react';
import MaterialGrid from '../components/MaterialGrid';

function BookPage({ books, loading, error }) {
  const [search, setSearch] = useState('');
  const filteredBooks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id');
    if (!query) return books;

    return books.filter((book) => (
      [book.title, book.author, book.genre, book.description]
        .some((value) => String(value || '').toLocaleLowerCase('id').includes(query))
    ));
  }, [books, search]);

  return (
    <main>
      <MaterialGrid
        books={filteredBooks}
        loading={loading}
        error={error}
        search={search}
        onSearchChange={setSearch}
      />
    </main>
  );
}

export default BookPage;