import { describe, expect, it } from "vitest";
import { can, isStaffRole } from "@shared/constants/roles";
import { slugify } from "@shared/utils/string";

describe("roles", () => {
  it("grants pricing to admin", () => {
    expect(can("SUPER_ADMIN", "managePricing")).toBe(true);
    expect(can("STUDENT", "managePricing")).toBe(false);
  });

  it("detects staff", () => {
    expect(isStaffRole("COUNSELOR")).toBe(true);
    expect(isStaffRole("STUDENT")).toBe(false);
  });
});

describe("slugify", () => {
  it("normalizes titles", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });
});
