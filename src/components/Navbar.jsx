export default function Navbar({ user, onLogin, onLogout, onHome }) {
  return (
    <header className="navbar">
      <button className="brand-button" onClick={onHome} aria-label="Trader Kavach home">
        <span className="brand-mark">TK</span>
        <span>
          <strong>Trader Kavach</strong>
          <small>Risk before reward.</small>
        </span>
      </button>

      <nav className="nav-actions">
        {user ? (
          <>
            <span className="user-chip">{user.displayName || user.email}</span>
            <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onLogin}>Login</button>
        )}
      </nav>
    </header>
  );
}
