import assert from "node:assert/strict";
import test from "node:test";
import {
  filterVisibleModules,
  moduleHasVisibleContent,
} from "@/lib/learning/syllabus-visible";

test("module with summary but no lessons is visible", () => {
  assert.equal(
    moduleHasVisibleContent({
      lessons: [],
      summary: "AI 001 · Certified Professional in AI Research",
    }),
    true,
  );
});

test("filterVisibleModules keeps text-only and lesson modules", () => {
  const modules = [
    { id: "1", title: "Text", summary: "Overview copy", lessons: [] },
    { id: "2", title: "Videos", summary: null, lessons: [{ id: "l1" }] },
    { id: "3", title: "Empty", summary: null, lessons: [] },
  ];
  const visible = filterVisibleModules(modules);
  assert.equal(visible.length, 2);
  assert.equal(visible[0]?.id, "1");
  assert.equal(visible[1]?.id, "2");
});
