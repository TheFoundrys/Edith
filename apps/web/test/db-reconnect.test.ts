import assert from "node:assert/strict";
import test from "node:test";
import { isPrismaUnreachable } from "../lib/db";

test("Prisma unreachable covers P1001, closed connection, and init errors", () => {
  assert.equal(isPrismaUnreachable({ code: "P1001" }), true);
  assert.equal(isPrismaUnreachable({ code: "P1017" }), true);
  assert.equal(
    isPrismaUnreachable({
      message: "Can't reach database server at `192.168.1.3:5432`",
    }),
    true,
  );
  assert.equal(
    isPrismaUnreachable({ message: "Server has closed the connection." }),
    true,
  );
  assert.equal(isPrismaUnreachable({ code: "P2025" }), false);
  assert.equal(isPrismaUnreachable(null), false);
});
