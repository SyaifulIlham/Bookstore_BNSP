import { sections } from '../sections';
import {
    FaArrowRightFromBracket,
    FaBookOpen,
    FaCircleQuestion,
    FaEnvelope,
    FaPenNib,
    FaReceipt,
    FaShapes,
    FaUsers,
} from 'react-icons/fa6';
import Brand from './Brand';

const sectionIcons = {
    books: FaBookOpen,
    genres: FaShapes,
    authors: FaPenNib,
};

const managementItems = [
    { key: 'transactions', label: 'Transaksi', icon: FaReceipt, countKey: 'transactions' },
    { key: 'users', label: 'Pengguna terdaftar', icon: FaUsers, countKey: 'users' },
    { key: 'messages', label: 'Pesan customer', icon: FaEnvelope, countKey: 'contactMessages' },
];

export default function AdminSidebar({
    activeSection,
    onSectionChange,
    onSignOut,
    records,
    transactions,
    users,
    contactMessages,
    user,
}) {
    const managementCounts = {
        transactions: transactions.length,
        users: users.length,
        contactMessages: contactMessages.length,
    };

    return (
        <aside className="sidebar">
            <Brand />
            <div className="sidebar-label">MENU UTAMA</div>
            <nav className="side-nav" aria-label="Navigasi admin">
                {Object.entries(sections).map(([key, section]) => {
                    const Icon = sectionIcons[key];

                    return (
                        <button
                            aria-current={activeSection === key ? 'page' : undefined}
                            className={`nav-item ${activeSection === key ? 'active' : ''}`}
                            key={key}
                            onClick={() => onSectionChange(key)}
                            type="button"
                        >
                            <span className="nav-icon" aria-hidden="true"><Icon /></span>
                            <span className="nav-item-label">{section.plural}</span>
                            <span className="nav-count">{records[key].length}</span>
                        </button>
                    );
                })}
                {managementItems.map(({ key, label, icon: Icon, countKey }) => (
                    <button
                        aria-current={activeSection === key ? 'page' : undefined}
                        className={`nav-item ${activeSection === key ? 'active' : ''}`}
                        key={key}
                        onClick={() => onSectionChange(key)}
                        type="button"
                    >
                        <span className="nav-icon" aria-hidden="true"><Icon /></span>
                        <span className="nav-item-label">{label}</span>
                        <span className="nav-count">{managementCounts[countKey]}</span>
                    </button>
                ))}
            </nav>
            <div className="sidebar-bottom">
                <div className="help-card">
                    <span className="help-mark" aria-hidden="true"><FaCircleQuestion /></span>
                    <div>
                        <strong>Katalog yang baik</strong>
                        <p>Dimulai dari informasi yang lengkap dan rapi.</p>
                    </div>
                </div>
                <button
                    aria-label="Keluar dari dashboard admin"
                    className="profile-button"
                    onClick={onSignOut}
                    type="button"
                >
                    <span className="profile-avatar" aria-hidden="true">
                        {(user?.name || 'Administrator').slice(0, 1).toUpperCase()}
                    </span>
                    <span className="profile-details">
                        <strong>{user?.name || 'Administrator'}</strong>
                        <small>Administrator</small>
                    </span>
                    <span className="signout-icon" aria-hidden="true"><FaArrowRightFromBracket /></span>
                </button>
            </div>
        </aside>
    );
}
