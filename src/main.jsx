import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled React render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fatal-screen">
          <div className="fatal-card">
            <div className="boot-logo">TK</div>
            <h1>Trader Kavach could not render this screen.</h1>
            <p>
              The app caught the error instead of showing a blank page.
              Check the browser console for the technical details.
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function start() {
  try {
    const rootElement = document.getElementById('root');

    if (!rootElement) {
      throw new Error('Root element #root was not found.');
    }

    createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Application bootstrap failed:', error);
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div class="fatal-screen">
          <div class="fatal-card">
            <div class="boot-logo">TK</div>
            <h1>Trader Kavach failed to start.</h1>
            <p>Check the browser console, then reload the application.</p>
            <button class="btn btn-primary" onclick="location.reload()">Reload App</button>
          </div>
        </div>
      `;
    }
  }
}

start();
