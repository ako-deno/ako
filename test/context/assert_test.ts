import { describe, it, assertEquals, assertStrictEq } from "../deps.ts";
import { context } from "../helpers/context.ts";

describe("ctx.assert(value, status)", () => {
  it("should throw an error", () => {
    const ctx = context();

    try {
      ctx.assert(false, 404);
      throw new Error("asdf");
    } catch (err) {
      assertEquals(err.status, 404);
      assertStrictEq(err.expose, true);
    }
  });
});
