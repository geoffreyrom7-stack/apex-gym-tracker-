import ApexMark from "./ApexMark.jsx";

export default function SplashScreen({ exiting = false }) {
  return (
    <main
      className={`splash-screen${exiting ? " is-leaving" : ""}`}
      role="status"
      aria-label="Loading APEX"
    >
      <div className="splash-grain" aria-hidden="true" />
      <svg className="splash-temple" viewBox="0 0 760 430" fill="none" aria-hidden="true">
        <path d="M92 156 380 48l288 108H92Z" />
        <path d="M118 168h524M132 354h496M108 377h544M142 344V177m82 167V177m82 167V177m82 167V177m82 167V177m82 167V177m82 167V177" />
        <path d="M126 355h508M137 366h486M153 169l12-13m82 13 12-13m82 13 12-13m82 13 12-13m82 13 12-13m82 13 12-13" />
      </svg>
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
