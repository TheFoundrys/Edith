"use client";

/**
 * React 19 + third-party embeds (YouTube/Vimeo) can leave nodes detached while
 * React still tries removeChild during commit. Ignore no-op removals.
 */
let patched = false;

export function patchReactDomSafe() {
  if (patched || typeof window === "undefined") return;
  patched = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return originalInsertBefore.call(this, newNode, null);
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}

patchReactDomSafe();
