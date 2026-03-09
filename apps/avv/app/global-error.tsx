"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ backgroundColor: "#1a1a1a", color: "#f5e6d3", textAlign: "center", paddingTop: "100px", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: "48px", fontWeight: "bold", color: "#d4a574" }}>Erreur 500</h1>
        <p>Une erreur s'est produite du côté du serveur. Veuillez réessayer plus tard.</p>
        <button onClick={reset} style={{ marginTop: "20px", padding: "10px 20px", backgroundColor: "#d4a574", color: "#1a1a1a", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Réessayer
        </button>
      </body>
    </html>
  );
}
