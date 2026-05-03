import React, { Component, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16, padding: 32,
        }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Something went wrong</h2>
          <p style={{ color: "#64748b", margin: 0 }}>
            {(this.state.error as Error).message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              padding: "10px 20px", borderRadius: 12, border: "1px solid #cbd5e1",
              background: "#fff", fontWeight: 700, cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
