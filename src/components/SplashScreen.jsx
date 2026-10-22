import ApexMark from "./ApexMark.jsx";

export default function SplashScreen({ exiting = false }) {
  return (
    <main
      className={`splash-screen${exiting ? " is-leaving" : ""}`}
      role="status"
      aria-label="Loading APEX"
    >
      <div className="splash-grain" aria-hidden="true" />
      <div className="splash-content">
        <div className="splash-emblem" aria-hidden="true">
          <span className="splash-ring splash-ring-outer" />
          <span className="splash-ring splash-ring-middle" />
          <span className="splash-ring splash-ring-inner" />
          <span className="splash-scan" />
          <ApexMark />
          <span className="splash-target-dot splash-dot-one" />
          <span className="splash-target-dot splash-dot-two" />
          <span className="splash-target-dot splash-dot-three" />
        </div>
        <div className="splash-wordmark">APEX<span>.</span></div>
        <p className="splash-tagline">FORGED FOR THE ASCENT</p>
        <div className="splash-progress" aria-hidden="true">
          <span />
        </div>
        <p className="splash-loading">INITIALIZING YOUR EDGE</p>
      </div>
      <div className="splash-coordinates" aria-hidden="true">OLYMPUS / 001&nbsp;&nbsp; · &nbsp;&nbsp;NO SHORTCUTS</div>
    </main>
  );
}
