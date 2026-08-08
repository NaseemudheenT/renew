/**
 * CinematicOverlay — a fixed, non-interactive film layer above the atmosphere
 * and below content: a soft focus vignette and ultra-fine grain. Theme-aware
 * via CSS. Server component (pure markup) so it costs nothing on the client.
 */
export function CinematicOverlay() {
  return (
    <div aria-hidden className="cinematic-overlay">
      <div className="cinematic-vignette" />
      <div className="cinematic-grain" />
    </div>
  );
}
