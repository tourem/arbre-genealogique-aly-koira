export default function FicheSkeleton() {
  return (
    <div className="skel-wrap">
      {/* Portrait skeleton */}
      <div className="skel-portrait">
        <div className="skel-circle skel-av" />
        <div className="skel-info">
          <div className="skel-line skel-w70" />
          <div className="skel-line skel-w40 skel-sm" />
        </div>
        <div className="skel-stats">
          <div className="skel-block skel-stat" />
          <div className="skel-block skel-stat" />
        </div>
      </div>

      {/* Parents skeleton */}
      <div className="skel-section">
        <div className="skel-line skel-w30 skel-header" />
        <div className="skel-grid2">
          <div className="skel-card">
            <div className="skel-circle skel-sm-av" />
            <div className="skel-line skel-w60" />
          </div>
          <div className="skel-card">
            <div className="skel-circle skel-sm-av" />
            <div className="skel-line skel-w60" />
          </div>
        </div>
      </div>

      {/* Spouses skeleton */}
      <div className="skel-section">
        <div className="skel-line skel-w30 skel-header" />
        <div className="skel-card skel-full">
          <div className="skel-circle skel-sm-av" />
          <div className="skel-line skel-w50" />
        </div>
        <div className="skel-card skel-full">
          <div className="skel-circle skel-sm-av" />
          <div className="skel-line skel-w50" />
        </div>
      </div>

      {/* Children skeleton */}
      <div className="skel-section">
        <div className="skel-line skel-w30 skel-header" />
        <div className="skel-grid3">
          <div className="skel-card-sm" />
          <div className="skel-card-sm" />
          <div className="skel-card-sm" />
        </div>
      </div>
    </div>
  );
}
