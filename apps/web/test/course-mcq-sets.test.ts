import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateSetNumbers,
  titleForMcqSet,
} from "@/lib/assessments/course-mcq-sets";

test("allocateSetNumbers fills gaps then continues", () => {
  assert.deepEqual(allocateSetNumbers([], 3), [1, 2, 3]);
  assert.deepEqual(allocateSetNumbers([1, 3], 3), [2, 4, 5]);
});

test("titleForMcqSet suffixes set number when multiple", () => {
  assert.equal(titleForMcqSet("Mid-term", 2, 3), "Mid-term · Set 2");
  assert.equal(titleForMcqSet("Mid-term", 1, 1), "Mid-term");
});
