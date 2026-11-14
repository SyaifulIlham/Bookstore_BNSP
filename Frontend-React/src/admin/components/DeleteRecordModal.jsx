export default function DeleteRecordModal({
    activeSection,
    currentSection,
    deleteError,
    deletingId,
    deletingRecord,
    onClose,
    onConfirm,
    records,
    replacementId,
    setReplacementId,
}) {
    const availableRecords = records[activeSection].filter((record) => record.id !== deletingRecord.id);
    const hasLinkedBooks = activeSection !== 'books' && deletingRecord.books_count > 0;

    return (
        <div className="modal-backdrop">
            <section aria-labelledby="delete-title" aria-modal="true" className="modal-card" role="dialog">
                <div className="modal-heading">
                    <div>
                        <span className="eyebrow">{hasLinkedBooks ? 'PEMINDAHAN BUKU' : 'KONFIRMASI HAPUS'}</span>
                        <h2 id="delete-title">{hasLinkedBooks ? 'Pindahkan buku terkait?' : `Hapus ${currentSection.singular}?`}</h2>
                        <p>
                            {hasLinkedBooks
                                ? `${deletingRecord.books_count} buku memakai ${currentSection.singular} "${currentSection.primary(deletingRecord)}". Pilih pengganti sebelum menghapusnya.`
                                : `Yakin ingin menghapus ${currentSection.singular} "${currentSection.primary(deletingRecord)}"?`}
                        </p>
                    </div>
                    <button
                        aria-label="Tutup"
                        className="close-button"
                        disabled={deletingId !== null}
                        onClick={onClose}
                        type="button"
                    >
                        ×
                    </button>
                </div>
                <form
                    className="form-stack"
                    onSubmit={(event) => {
                        event.preventDefault();
                        onConfirm(deletingRecord, hasLinkedBooks ? Number(replacementId) : null);
                    }}
                >
                    {hasLinkedBooks && availableRecords.length > 0 ? (
                        <label>
                            {currentSection.label} pengganti
                            <select
                                onChange={(event) => setReplacementId(event.target.value)}
                                required
                                value={replacementId}
                            >
                                <option value="">Pilih {currentSection.singular} pengganti</option>
                                {availableRecords.map((record) => (
                                    <option key={record.id} value={record.id}>{record.name}</option>
                                ))}
                            </select>
                        </label>
                    ) : hasLinkedBooks ? (
                        <p className="form-error">
                            Tambahkan {currentSection.singular} lain terlebih dahulu untuk memindahkan buku.
                        </p>
                    ) : null}
                    {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
                    <div className="modal-actions">
                        <button
                            className="button button-secondary"
                            disabled={deletingId !== null}
                            onClick={onClose}
                            type="button"
                        >
                            Batal
                        </button>
                        <button
                            className="button button-primary"
                            disabled={deletingId !== null || (hasLinkedBooks && (!replacementId || availableRecords.length === 0))}
                            type="submit"
                        >
                            {deletingId === deletingRecord.id ? 'Memindahkan dan menghapus...' : 'Pindahkan & hapus'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
