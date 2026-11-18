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
import { groupTransactions } from '../utils/groupTransactions';
import './admin.css';

const emptyRecords = { books: [], genres: [], authors: [] };
const sectionUrl = (section) => `/admin/${section}`;
const sectionTitles = {
  books: 'Kelola buku',
  genres: 'Kelola genre',
  authors: 'Kelola author',
  transactions: 'Daftar pesanan',
  users: 'Pengguna terdaftar',
  messages: 'Pesan dari customer',
};

async function requestCatalog(token) {
  const [books, genres, authors, transactions, users, contactMessages] = await Promise.all([
    apiRequest(sectionUrl('books'), { token }),
    apiRequest(sectionUrl('genres'), { token }),
    apiRequest(sectionUrl('authors'), { token }),
    apiRequest('/admin/transactions', { token }),
    apiRequest('/admin/users', { token }),
    apiRequest('/admin/contact-messages', { token }),
  ]);
  return { books, genres, authors, transactions, users, contactMessages };
}

function AdminPage() {
  const { token, user, logout } = useAuth();
  const [records, setRecords] = useState(emptyRecords);
  const [transactions, setTransactions] = useState([]);
  const [updatingOrderNumber, setUpdatingOrderNumber] = useState(null);
  const [users, setUsers] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
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
      setUsers(catalog.users);
      setContactMessages(catalog.contactMessages);
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
        setUsers(catalog.users);
        setContactMessages(catalog.contactMessages);
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

  const currentSection = sections[activeSection] || null;
  const groupedTransactions = useMemo(() => groupTransactions(transactions), [transactions]);
  const filteredRecords = useMemo(() => {
    if (!currentSection) return [];

    return records[activeSection].filter((record) => {
      const searchableText = `${currentSection.primary(record)} ${currentSection.secondary(record) || ''}`;
      return searchableText.toLowerCase().includes(search.toLowerCase());
    });
  }, [activeSection, currentSection, records, search]);

  function openForm(record = null) {
    if (!currentSection) return;

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

  async function handleAdvanceTransaction(order) {
    const firstItem = order.items[0];
    const nextStatus = firstItem.status === 'menunggu' ? 'diproses' : 'selesai';
    setUpdatingOrderNumber(order.orderNumber);
    setError('');

    try {
      const updatedTransaction = await apiRequest(
        `/admin/transactions/${firstItem.id}/status`,
        { method: 'PATCH', token, body: { status: nextStatus } },
      );
      setTransactions((current) => current.map((item) => (
        item.order_number === updatedTransaction.order_number
          ? { ...item, status: updatedTransaction.status }
          : item
      )));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Status pesanan gagal diperbarui.');
    } finally {
      setUpdatingOrderNumber(null);
    }
  }

  return (
    <main className="admin-console">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          setSearch('');
          setShowForm(false);
          setEditingRecord(null);
          setDeletingRecord(null);
        }}
        onSignOut={handleSignOut}
        records={records}
        transactions={groupedTransactions}
        users={users}
        contactMessages={contactMessages}
        user={user}
      />
      <div className="admin-content">
        <Container fluid>
          <div className="admin-topbar">
            <div>
              <p className="eyebrow mb-1">PANEL ADMIN</p>
              <h1 className="h3 mb-0">{sectionTitles[activeSection]}</h1>
            </div>
            {currentSection && (
              <Button onClick={() => openForm()} variant="dark">Tambah {currentSection.singular}</Button>
            )}
          </div>

          {error && <Alert variant="danger" role="alert">{error}</Alert>}
          <div className="admin-summary-grid">
            <SummaryCard label="Buku" value={records.books.length} icon="B" tone="tone-book" />
            <SummaryCard label="Genre" value={records.genres.length} icon="G" tone="tone-genre" />
            <SummaryCard label="Author" value={records.authors.length} icon="A" tone="tone-author" />
            <SummaryCard label="Transaksi" value={groupedTransactions.length} icon="T" tone="tone-order" />
            <SummaryCard label="Pengguna" value={users.length} icon="U" tone="tone-book" />
            <SummaryCard label="Pesan masuk" value={contactMessages.length} icon="P" tone="tone-genre" />
          </div>

          {currentSection && (
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
          )}

          {activeSection === 'transactions' && (
            <section className="admin-orders-panel">
              <h2 className="h5">Daftar pesanan</h2>
            {groupedTransactions.length === 0 ? (
              <p className="text-muted mb-0">{loading ? 'Memuat transaksi...' : 'Belum ada transaksi.'}</p>
            ) : (
              <div className="d-grid gap-3">
                {groupedTransactions.map((order) => {
                  const firstItem = order.items[0];
                  const status = firstItem.status || 'menunggu';

                  return (
                    <section className="border rounded-3 p-3" key={order.orderNumber}>
                      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                        <div>
                          <h3 className="h6 mb-1">Pesanan {order.orderNumber}</h3>
                          <div className="text-muted small">
                            {firstItem.customer?.name || 'Customer'} · {order.items.length} jenis buku · {order.quantity} buku
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge text-bg-secondary">{status}</span>
                          {status !== 'selesai' && (
                            <Button
                              disabled={updatingOrderNumber !== null}
                              onClick={() => handleAdvanceTransaction(order)}
                              size="sm"
                              variant="outline-dark"
                            >
                              {updatingOrderNumber === order.orderNumber
                                ? 'Menyimpan...'
                                : status === 'diproses'
                                  ? 'Tandai selesai'
                                  : 'Proses pesanan'}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="table-responsive">
                        <table className="table align-middle mb-2">
                          <thead><tr><th>Buku</th><th>Jumlah</th><th>Subtotal</th></tr></thead>
                          <tbody>
                            {order.items.map((item) => (
                              <tr key={item.id}>
                                <td>{item.book?.title || 'Buku'}</td>
                                <td>{item.quantity}</td>
                                <td>{Number(item.total_amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="d-flex flex-wrap justify-content-between gap-2 small">
                        <span className="text-muted">{firstItem.delivery_address || 'Alamat belum tersedia'}</span>
                        <strong>Total: {order.totalAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</strong>
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
            </section>
          )}

          {activeSection === 'users' && (
            <section className="admin-orders-panel">
              <h2 className="h5">Pengguna terdaftar</h2>
            {users.length === 0 ? (
              <p className="text-muted mb-0">{loading ? 'Memuat pengguna...' : 'Belum ada pengguna.'}</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Terdaftar</th></tr></thead>
                  <tbody>
                    {users.map((listedUser) => (
                      <tr key={listedUser.id}>
                        <td>{listedUser.name}</td>
                        <td>{listedUser.email}</td>
                        <td>{listedUser.role}</td>
                        <td>{listedUser.created_at ? new Date(listedUser.created_at).toLocaleDateString('id-ID') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </section>
          )}

          {activeSection === 'messages' && (
            <section className="admin-orders-panel">
              <h2 className="h5">Pesan dari pelanggan</h2>
            {contactMessages.length === 0 ? (
              <p className="text-muted mb-0">{loading ? 'Memuat pesan...' : 'Belum ada pesan.'}</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead><tr><th>Pengirim</th><th>Email</th><th>Subjek</th><th>Pesan</th><th>Dikirim</th></tr></thead>
                  <tbody>
                    {contactMessages.map((message) => (
                      <tr key={message.id}>
                        <td>{message.name}</td>
                        <td>{message.email}</td>
                        <td>{message.subject}</td>
                        <td className="text-break">{message.message}</td>
                        <td>{new Date(message.created_at).toLocaleDateString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </section>
          )}
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
