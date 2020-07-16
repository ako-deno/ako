import { describe, it, assertEquals } from "../deps.ts";
import { context } from "../helpers/context.ts";

describe("ctx.acceptsEncodings()", () => {
  describe("with no arguments", () => {
    describe("when Accept-Encoding is populated", () => {
      it("should return accepted types", () => {
        const ctx = context();
        ctx.req.headers.set(
          "accept-encoding",
          "gzip, compress;q=0.2",
        );
        assertEquals(ctx.acceptsEncodings(), ["gzip", "compress", "identity"]);
        assertEquals(ctx.acceptsEncodings(["gzip", "compress"]), "gzip");
      });
    });

    describe("when Accept-Encoding is not populated", () => {
      it("should return identity", () => {
        const ctx = context();
        assertEquals(ctx.acceptsEncodings(), ["identity"]);
        assertEquals(
          ctx.acceptsEncodings(["gzip", "deflate", "identity"]),
          "identity",
        );
      });
    });
  });

  describe("with an array", () => {
    it("should return the best fit", () => {
      const ctx = context();
      ctx.req.headers.set(
        "accept-encoding",
        "gzip, compress;q=0.2",
      );
      assertEquals(ctx.acceptsEncodings(["compress", "gzip"]), "gzip");
      assertEquals(ctx.acceptsEncodings(["gzip", "compress"]), "gzip");
    });
  });
});
