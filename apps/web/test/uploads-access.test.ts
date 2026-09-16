import assert from "node:assert/strict";
import test from "node:test";
import { resolveUploadPath } from "@/lib/storage";

test("resolveUploadPath rejects path traversal", () => {
  assert.equal(resolveUploadPath(["private", "..", "etc", "passwd"]), null);
  assert.equal(resolveUploadPath(["public", "..", "secret.png"]), null);
});

test("resolveUploadPath accepts public and private roots", () => {
  const pub = resolveUploadPath(["public", "abc", "hero.png"]);
  assert.ok(pub);
  assert.equal(pub?.kind, "public");
  assert.equal(pub?.relative, "public/abc/hero.png");

  const priv = resolveUploadPath(["private", "abc", "notes.pdf"]);
  assert.ok(priv);
  assert.equal(priv?.kind, "private");
});
