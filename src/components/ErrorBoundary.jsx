import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Kinshow error:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Something went wrong</h2>
            <p style={{ color: '#999', marginBottom: '1.5rem' }}>An unexpected error occurred. Please try again.</p>
            <Link to="/" className="btn btn--primary">Go Home</Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
