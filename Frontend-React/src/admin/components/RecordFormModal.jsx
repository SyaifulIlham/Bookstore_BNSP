export default function RecordFormModal({
    currentSection,
    editingRecord,
    error,
    formValues,
    onClose,
    onSubmit,
    records,
    saving,
    setFormValues,
}) {
    return (
        <div
            className="modal-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) {
                    onClose();
                }
            }}
        >
            <section aria-labelledby="create-title" aria-modal="true" className="modal-card" role="dialog">
                <div className="modal-heading">
                    <div>
                        <span className="eyebrow">{editingRecord ? 'PERBARUI KATALOG' : 'KATALOG BARU'}</span>
                        <h2 id="create-title">{editingRecord ? `Edit ${currentSection.singular}` : `Tambah ${currentSection.singular}`}</h2>
                        <p>Lengkapi informasi berikut untuk {editingRecord ? 'memperbarui' : 'menambahkan'} data.</p>
                    </div>
                    <button aria-label="Tutup" className="close-button" disabled={saving} onClick={onClose} type="button">×</button>
                </div>
                <form className="form-stack" onSubmit={onSubmit}>
                    {currentSection.fields.map((field) => (
                        <label key={field.name}>
                            {field.label}
                            {field.type === 'select' ? (
                                <select
                                    onChange={(event) => setFormValues({ ...formValues, [field.name]: event.target.value })}
                                    required={field.required !== false}
                                    value={formValues[field.name] || ''}
                                >
                                    <option value="">Pilih {field.label.toLowerCase()}</option>
                                    {(records[field.options] || []).map((record) => (
                                        <option key={record.id} value={record.id}>{record.title || record.name}</option>
                                    ))}
                                </select>
                            ) : field.type === 'file' ? (
                                <>
                                    {editingRecord?.cover_photo && field.name === 'cover_photo_file' && (
                                        <img
                                            alt={`Sampul ${editingRecord.title}`}
                                            className="admin-cover-preview"
                                            onError={(event) => { event.currentTarget.hidden = true; }}
                                            src={editingRecord.cover_photo}
                                        />
                                    )}
                                    <input
                                        accept={field.accept}
                                        onChange={(event) => setFormValues({ ...formValues, [field.name]: event.target.files?.[0] || '' })}
                                        required={field.required !== false}
                                        type="file"
                                    />
                                    <small className="text-muted">Format JPG, PNG, atau WebP, maksimal 5 MB.</small>
                                </>
                            ) : field.multiline ? (
                                <textarea
                                    onChange={(event) => setFormValues({ ...formValues, [field.name]: event.target.value })}
                                    placeholder={field.placeholder}
                                    required={field.required !== false}
                                    rows={4}
                                    value={formValues[field.name] || ''}
                                />
                            ) : (
                                <input
                                    onChange={(event) => setFormValues({ ...formValues, [field.name]: event.target.value })}
                                    min={field.min}
                                    placeholder={field.placeholder}
                                    required={field.required !== false}
                                    step={field.type === 'number' ? 'any' : undefined}
                                    type={field.type || 'text'}
                                    value={formValues[field.name] || ''}
                                />
                            )}
                        </label>
                    ))}
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <div className="modal-actions">
                        <button className="button button-secondary" disabled={saving} onClick={onClose} type="button">Batal</button>
                        <button className="button button-primary" disabled={saving} type="submit">
                            {saving ? 'Menyimpan...' : editingRecord ? 'Simpan perubahan' : `Simpan ${currentSection.singular}`}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
