export function Loader({ label = "Loading Eventrix..." }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

// Reserve event-card space while event data is still loading.
export function EventSkeletons({ count = 3 }) {
  return (
    <div className="event-grid">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index} aria-hidden="true">
          <div className="skeleton skeleton-image" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-line wide" />
            <div className="skeleton skeleton-line medium" />
          </div>
        </div>
      ))}
    </div>
  );
}
