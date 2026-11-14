
import { FaBookJournalWhills } from 'react-icons/fa6';

export default function Brand() {
    return (
        <div className="brand">
            <span className="brand-mark" aria-hidden="true"><FaBookJournalWhills /></span>
            <span className="brand-name">
                Worthbook
                <small>ADMIN CONSOLE</small>
            </span>
        </div>
    );
}
