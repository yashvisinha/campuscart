import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Bell as BellIcon,
} from "lucide-react";
import "./Category.css";

const items = Array.from({ length: 6 }).map((_, i) => ({
  id: i + 1,
  title: `Item ${i + 1}`,
}));

// Header component
function Header() {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <button className="icon-btn" aria-label="settings" onClick={() => navigate('/settings')}>
        <SettingsIcon size={28} />
      </button>

      <div className="search-pill">
        <span className="search-mark">⌕</span>
        <input type="text" placeholder="Search" aria-label="Search" />
      </div>

      <button className="icon-btn" aria-label="notifications">
        <BellIcon size={28} />
      </button>
    </header>
  );
}

export default function Category() {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate('/product', { state: { from: '/category' } });
  };

  return (
    <>
      <Header />

      <section className="hero">
        <h1 className="hero-title">Category</h1>
      </section>

      <section className="category-grid" aria-label="Category items">
        {items.map((it) => (
          <article 
            key={it.id} 
            className="category-card"
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
          >
            <div className="card-inner" />
          </article>
        ))}
      </section>
    </>
  );
}