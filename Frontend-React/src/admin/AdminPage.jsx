import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import { useAuth } from '../auth/useAuth';
import { apiRequest } from '../services/api';
import { sections } from './sections';
import AdminSidebar from './components/AdminSidebar';
import CatalogRecordList from './components/CatalogRecordList';
import DeleteRecordModal from './components/DeleteRecordModal';
import RecordFormModal from './components/RecordFormModal';
import SummaryCard from './components/SummaryCard';
import './admin.css';

const emptyRecords = { books: [], genres: [], authors: [] };
const sectionUrl = (section) => `/admin/${section}`;

async function requestCatalog(token) {
  const [books, genres, authors, transactions] = await Promise.all([
    apiRequest(sectionUrl('books'), { token }),
    apiRequest(sectionUrl('genres'), { token }),
    apiRequest(sectionUrl('authors'), { token }),
    apiRequest('/admin/transactions', { token }),
  ]);
  return { books, genres, authors, transactions };
}

function AdminPage() {
  const { token, user, logout } = useAuth();
  const [records, setRecords] = useState(emptyRecords);
  const [transactions, setTransactions] = useState([]);
  const [activeSection, setActiveSection] = useState('books');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const catalog = await requestCatalog(token);
      setRecords({
        books: catalog.books,
        genres: catalog.genres,
        authors: catalog.authors,
      });
      setTransactions(catalog.transactions);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Data admin gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let active = true;

    requestCatalog(token)
      .then((catalog) => {
        if (!active) return;
        setRecords({
          books: catalog.books,
          genres: catalog.genres,
          authors: catalog.authors,
        });
        setTransactions(catalog.transactions);
        setError('');
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Data admin gagal dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const currentSection = sections[activeSection];
  const filteredRecords = useMemo(() => records[activeSection].filter((record) => {
    const searchableText = `${currentSection.primary(record)} ${currentSection.secondary(record) || ''}`;
    return searchableText.toLowerCase().includes(search.toLowerCase());
  }), [activeSection, currentSection, records, search]);

  function openForm(record = null) {
    setEditingRecord(record);
    setShowForm(true);
    setFormError('');
    setFormValues(Object.fromEntries(
      currentSection.fields.map((field) => [field.name, record?.[field.name] ?? '']),
    ));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    const payload = { ...formValues };
    currentSection.fields.forEach((field) => {
      if (field.type === 'number' && payload[field.name] !== '') {
        payload[field.name] = Number(payload[field.name]);
      }
      if (field.required === false && payload[field.name] === '') {
        payload[field.name] = null;
      }
    });

    try {
      const endpoint = sectionUrl(activeSection);
      let method = editingRecord ? 'PUT' : 'POST';
      let body = payload;
      if (activeSection === 'books') {
        const coverFile = payload.cover_photo_file;
        delete payload.cover_photo_file;

        if (coverFile instanceof File) {
          const formData = new FormData();
          Object.entries(payload).forEach(([name, value]) => {
            formData.append(name, value === null ? '' : String(value));
          });
          formData.append('cover_photo_file', coverFile);
          if (editingRecord) {
            formData.append('_method', 'PUT');
            method = 'POST';
          }
          body = formData;
        }
      }

      await apiRequest(editingRecord ? `${endpoint}/${editingRecord.id}` : endpoint, {
        method,
        token,
        body,
      });
      setEditingRecord(null);
      setShowForm(false);
      await loadCatalog();
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Data gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record, replacementId) {
    setDeletingId(record.id);
    setDeleteError('');

    try {
      const body = replacementId ? { replacement_id: replacementId } : undefined;
      await apiRequest(`${sectionUrl(activeSection)}/${record.id}`, {
        method: 'DELETE',
        token,
        body,
      });
      setDeletingRecord(null);
      await loadCatalog();
    } catch (requestError) {
      setDeleteError(requestError instanceof Error ? requestError.message : 'Data gagal dihapus.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSignOut() {
    try {
      await logout();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Logout gagal.');
    }
  }

  return (
    <main className="admin-console">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          setSearch('');
        }}
        onSignOut={handleSignOut}
        records={records}
        user={user}
      />
      <div className="admin-content">
        <Container fluid>
          <div className="admin-topbar">
            <div>
              <p className="eyebrow mb-1">PANEL ADMIN</p>
              <h1 className="h3 mb-0">Kelola katalog</h1>
            </div>
            <Button onClick={() => openForm()} variant="dark">Tambah {currentSection.singular}</Button>
          </div>

          {error && <Alert variant="danger" role="alert">{error}</Alert>}
          <div className="admin-summary-grid">
            <SummaryCard label="Buku" value={records.books.length} icon="B" tone="tone-book" />
            <SummaryCard label="Genre" value={records.genres.length} icon="G" tone="tone-genre" />
            <SummaryCard label="Author" value={records.authors.length} icon="A" tone="tone-author" />
            <SummaryCard label="Transaksi" value={transactions.length} icon="T" tone="tone-order" />
          </div>

          <CatalogRecordList
            activeSection={activeSection}
            currentSection={currentSection}
            deletingId={deletingId}
            error={error}
            filteredRecords={filteredRecords}
            loading={loading}
            onCreate={() => openForm()}
            onDelete={(record) => {
              setDeleteError('');
              setFormValues({});
              setDeletingRecord(record);
            }}
            onEdit={openForm}
            onSearchChange={setSearch}
            records={records}
            search={search}
          />

          <section className="admin-orders-panel">
            <h2 className="h5">Transaksi terbaru</h2>
            {transactions.length === 0 ? (
              <p className="text-muted mb-0">{loading ? 'Memuat transaksi...' : 'Belum ada transaksi.'}</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead><tr><th>Pesanan</th><th>Customer</th><th>Buku</th><th>Jumlah</th><th>Total</th></tr></thead>
                  <tbody>
                    {transactions.slice(0, 5).map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.order_number}</td>
                        <td>{transaction.customer?.name || 'Customer'}</td>
                        <td>{transaction.book?.title || 'Buku'}</td>
                        <td>{transaction.quantity}</td>
                        <td>{Number(transaction.total_amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </Container>
      </div>

      {showForm && (
        <RecordFormModal
          currentSection={currentSection}
          editingRecord={editingRecord}
          error={formError}
          formValues={formValues}
          onClose={() => {
            if (!saving) {
              setShowForm(false);
              setEditingRecord(null);
            }
          }}
          onSubmit={handleSave}
          records={records}
          saving={saving}
          setFormValues={setFormValues}
        />
      )}
      {deletingRecord && (
        <DeleteRecordModal
          activeSection={activeSection}
          currentSection={currentSection}
          deleteError={deleteError}
          deletingId={deletingId}
          deletingRecord={deletingRecord}
          onClose={() => {
            if (deletingId === null) setDeletingRecord(null);
          }}
          onConfirm={handleDelete}
          records={records}
          replacementId={formValues.replacement_id || ''}
          setReplacementId={(replacementId) => setFormValues((previous) => ({ ...previous, replacement_id: replacementId }))}
        />
      )}
    </main>
  );
}

export default AdminPage;
