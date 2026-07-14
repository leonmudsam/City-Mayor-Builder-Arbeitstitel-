// Lightweight feedback hook (v0.21). A single seam the UI calls on notable
// moments (activity done, decision made, target delivered). Today it's a no-op
// placeholder; when sound/haptics land, only this file changes — callers stay
// the same. Kept out of src/game/** on purpose (it's a UI/service concern).

export type FeedbackKind = 'activity_start' | 'activity_progress' | 'activity_done' | 'decision' | 'error';

/** Play a short feedback cue. No-op until sounds/haptics are wired in. */
export function playFeedback(_kind: FeedbackKind): void {
  // Intentionally empty for MVP2 — reserved seam for later audio/haptics.
}
