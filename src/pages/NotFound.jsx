import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main id="content" tabIndex={-1} className="not-found">
      <div className="not-found-content">
        <div className="error-code">404</div>

        <h1>Oops! You Took a Wrong Turn 🚀</h1>

        <p>
          The page you're looking for doesn't exist, has moved,
          or maybe it went on vacation.
        </p>

        <Link to="/" className="home-btn">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
