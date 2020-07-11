import { describe, it, assertEquals } from "../deps.ts";
import { context } from "../helpers/context.ts";

describe("req.stale", () => {
  it("should be the inverse of req.fresh", () => {
    const ctx = context();
    ctx.status = 200;
    ctx.method = "GET";
    ctx.req.headers.set("if-none-match", '"123"');
    ctx.set("ETag", '"123"');
    assertEquals(ctx.fresh, true);
    assertEquals(ctx.stale, false);
  });
});
