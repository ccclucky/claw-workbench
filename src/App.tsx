const phases = [
  'Discover workspace',
  'Shape behavior profile',
  'Generate BuildPlan',
  'Review diffs',
  'Apply safely',
  'Validate results',
];

export default function App() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">ClawWorkbench</p>
        <h1>Shape the dragon, not just the config.</h1>
        <p className="lede">
          Local-first workspace control for OpenClaw. Define the style, habits, and end state you
          want, then preview, apply, and validate each change.
        </p>
      </section>

      <section className="panel">
        <h2>Phase 1 loop</h2>
        <ul className="phase-list">
          {phases.map((phase, index) => (
            <li key={phase}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{phase}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel muted">
        <h2>Current status</h2>
        <p>
          Workspace discovery, behavior profiles, BuildPlans, diff review, apply, rollback, and
          validation are the first supported loop.
        </p>
      </section>
    </main>
  );
}
