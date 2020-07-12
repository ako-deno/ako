import { context as prototype } from "../../src/context.ts";
import { describe, it, assertEquals, assertStrictEquals } from "../deps.ts";
import { context } from "../helpers/context.ts";

describe("ctx.inspect()", () => {
  it("should return a json representation", () => {
    const ctx = context();
    const toJSON = ctx.toJSON();
    assertEquals(Deno.inspect(toJSON), Deno.inspect(ctx));
  });

  it("should not crash when called on the prototype", () => {
    assertEquals(
      prototype.inspect(),
      Deno.inspect(prototype),
    );
  });
});
