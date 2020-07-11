import { describe, it, assertEquals } from "../deps.ts";
import { context } from "../helpers/context.ts";

describe("ctx.fresh", () => {
  describe("the request method is not GET and HEAD", () => {
    it("should return false", () => {
      const ctx = context();
      ctx.req.method = "POST";
      assertEquals(ctx.fresh, false);
    });
  });

  describe("the response is non-2xx", () => {
    it("should return false", () => {
      const ctx = context();
      ctx.status = 404;
      ctx.req.method = "GET";
      ctx.req.headers.set("if-none-match", "123");
      ctx.set("ETag", "123");
      assertEquals(ctx.fresh, false);
    });
  });

  describe("the response is 2xx", () => {
    describe("and etag matches", () => {
      it("should return true", () => {
        const ctx = context();
        ctx.status = 200;
        ctx.req.method = "GET";
        ctx.req.headers.set("if-none-match", "123");
        ctx.set("ETag", "123");
        assertEquals(ctx.fresh, true);
      });
    });

    describe("and etag do not match", () => {
      it("should return false", () => {
        const ctx = context();
        ctx.status = 200;
        ctx.req.method = "GET";
        ctx.req.headers.set("if-none-match", "123");
        ctx.set("ETag", "hey");
        assertEquals(ctx.fresh, false);
      });
    });
  });
});
