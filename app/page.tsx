export default function Home() {
  return (
    <main className="min-h-screen bg-white p-8">
      <h1 className="font-display text-6xl tracking-wide text-dark">FORMER <em className="not-italic text-teal">POUR</em> AGIR</h1>
      <p className="font-sans text-muted mt-4">Test design tokens</p>
      <div className="mt-4 flex gap-2">
        <span className="bg-teal text-white px-3 py-1">teal</span>
        <span className="bg-orange text-white px-3 py-1">orange</span>
        <span className="bg-light text-dark px-3 py-1">light</span>
        <span className="bg-dark text-white px-3 py-1">dark</span>
      </div>
    </main>
  );
}
