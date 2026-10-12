import Button from './Button';
import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Kinshow error:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Auto-reset when the route changes so a crash on one page
    // does not leave the boundary stuck for the whole session.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main id="content" tabIndex={-1} className="error-card-wrap">
          <div className="error-card" role="alert">
            <h2 className="error-card__title">Something went wrong</h2>
            <p className="error-card__text">
              An unexpected error occurred. Please try again.
            </p>
            <div className="error-card__actions">
              <Button
                type="button"
                variant="primary"
                onClick={() => window.location.reload()}
              >
                Reload
              </Button>
              <Button as={Link}
                to="/"
                variant="ghost"
                onClick={this.handleReset}
              >
                Go Home
              </Button>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
