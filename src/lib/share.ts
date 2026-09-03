// Wraps the Web Share API so buttons can offer "share to any app" (LINE,
// Messages, etc.) alongside the existing clipboard-copy buttons. `canShare`
// lets call sites hide the share button entirely on browsers that don't
// support it (desktop Chrome/Firefox) rather than showing a button that
// would just fail.
export const canShare = typeof navigator !== "undefined" && !!navigator.share;

export async function shareText(data: { title?: string; text: string }): Promise<void> {
  if (!navigator.share) return;
  try {
    await navigator.share(data);
  } catch (err) {
    // AbortError just means the user closed the share sheet without picking
    // an app — not a failure worth surfacing.
    if ((err as Error)?.name === "AbortError") return;
  }
}
