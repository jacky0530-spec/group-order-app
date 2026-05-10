"use client";
export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#F9FAFB",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛍️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          團購訂單系統
        </h1>
        <p style={{ color: "#6B7280", marginBottom: 24 }}>前台建置中...</p>
        <a href="/admin" style={{
          padding: "10px 24px",
          background: "#111827",
          color: "#fff",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 14
        }}>
          進入後台管理 →
        </a>
      </div>
    </main>
  );
}