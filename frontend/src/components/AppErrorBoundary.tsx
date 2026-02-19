import React from "react";

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export default class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    const message = error instanceof Error ? error.message : "Unknown render error";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    console.error("App render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "24px", fontFamily: "sans-serif", color: "#b91c1c" }}>
          <h2 style={{ marginBottom: "8px" }}>Frontend runtime error</h2>
          <p style={{ marginBottom: "0" }}>{this.state.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
