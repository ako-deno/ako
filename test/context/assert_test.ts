import { describe, it, assertEquals, assertStrictEquals } from "../deps.ts";
import { context } from "../helpers/context.ts";

describe("ctx.assert(value, status)", () => {
  it("should throw an error", () => {
    const ctx = context();

    try {
      ctx.assert(false, 404);
      throw new Error("asdf");
    } catch (err) {
      assertEquals(err.status, 404);
      assertStrictEquals(err.expose, true);
    }
  });
});
