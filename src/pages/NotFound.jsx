import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found-hero">
      <div className="not-found-bg">
        <img
          src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1925&q=80"
          alt="Lost in space"
          className="not-found-bg-img"
        />
      </div>
      <div className="not-found-gradient"></div>

      <div className="not-found-content">
        <h1 className="not-found-title">Lost your way?</h1>
        <p className="not-found-desc">
          Sorry, we can't find that page. You'll find lots to explore on the
          home page.
        </p>

        <Link to="/" className="not-found-btn">
          Kinshow Home
        </Link>

        <div className="not-found-code">
          <span className="not-found-code-line"></span>
          Error Code <strong>404</strong>
        </div>
      </div>
    </div>
  );
}
