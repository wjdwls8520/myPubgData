// Suppress the mirrored scroll event so two cards cannot drive each other in a loop.
const mirroredOffsets = new WeakMap<HTMLElement, number>();

export function syncDetailScroll(source: HTMLElement) {
  const card = source.closest<HTMLElement>(".physical");
  if (card?.dataset.state !== "detail") {
    mirroredOffsets.delete(source);
    return;
  }
  const top = source.scrollTop;
  card.dataset.scrolled = String(top > 1);
  const mirrored = mirroredOffsets.get(source);
  mirroredOffsets.delete(source);
  if (mirrored !== undefined && Math.abs(mirrored - top) < 1) return;

  const layer = card.parentElement!;
  layer
    .querySelectorAll<HTMLElement>(
      '.physical[data-state="detail"] .physical-details',
    )
    .forEach((peer) => {
      if (peer === source) return;
      const peerCard = peer.closest<HTMLElement>(".physical")!;
      peerCard.dataset.scrolled = String(top > 1);
      // Matching pixels keep common sections aligned; clamp only at the shorter card's end.
      const next = Math.min(
        top,
        Math.max(0, peer.scrollHeight - peer.clientHeight),
      );
      if (Math.abs(peer.scrollTop - next) < 1) return;
      peer.scrollTop = next;
      mirroredOffsets.set(peer, peer.scrollTop);
    });
}
