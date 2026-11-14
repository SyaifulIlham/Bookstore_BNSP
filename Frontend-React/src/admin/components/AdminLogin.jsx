import Brand from './Brand';
import { Link } from 'react-router-dom';

export default function AdminLogin({ error, onSubmit, saving }) {
    return (
        <main className="login-page">
            <section className="login-card">
                <Brand />
                <div className="login-heading">
                    <h1>Masuk sebagai admin</h1>
                    <p>Masuk untuk mengelola buku, genre, author, dan transaksi.</p>
                </div>
                <form className="form-stack" onSubmit={onSubmit}>
                    <label>
                        Email
                        <input name="email" type="email" placeholder="admin@booksales.com" autoComplete="username" required />
                    </label>
                    <label>
                        Password
                        <input name="password" type="password" placeholder="Masukkan password" autoComplete="current-password" required />
                    </label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <button className="button button-primary button-wide" type="submit" disabled={saving}>
                        {saving ? 'Memeriksa...' : 'Masuk ke dashboard'}
                        <span aria-hidden="true">→</span>
                    </button>
                </form>
                <p className="login-footnote">
                    Akses khusus untuk administrator BookSales.
                    <br />
                    Customer? <Link to="/login">Masuk di sini</Link>.
                </p>
            </section>
            <aside className="login-aside">
                <div className="aside-orbit orbit-one" />
                <div className="aside-orbit orbit-two" />
                <div className="aside-copy">
                    <span className="eyebrow">CERITA DIMULAI DI SINI</span>
                    <h2>Ruang untuk cerita-cerita hebat.</h2>
                    <p>Jaga katalog tetap hidup dengan genre yang tepat dan penulis yang menginspirasi.</p>
                    <div className="book-stack" aria-hidden="true">
                        <span /><span /><span />
                    </div>
                </div>
                <span className="aside-caption">BOOKSALES · ADMIN CONSOLE</span>
            </aside>
        </main>
    );
}
