import { describe, it, assertEquals } from "../deps.ts";
import { context } from "../helpers/context.ts";

describe("ctx.acceptsLanguages(langs)", () => {
  describe("with no arguments", () => {
    describe("when Accept-Language is populated", () => {
      it("should return accepted types", () => {
        const ctx = context();
        ctx.req.headers.set(
          "accept-language",
          "en;q=0.8, es, pt",
        );
        assertEquals(ctx.acceptsLanguages(), ["es", "pt", "en"]);
      });
    });
  });

  describe("with an array", () => {
    describe("when Accept-Language is populated", () => {
      describe("if any types types match", () => {
        it("should return the best fit", () => {
          const ctx = context();
          ctx.req.headers.set(
            "accept-language",
            "en;q=0.8, es, pt",
          );
          assertEquals(ctx.acceptsLanguages(["es", "en"]), "es");
        });
      });

      describe("if no types match", () => {
        it("should return false", () => {
          const ctx = context();
          ctx.req.headers.set(
            "accept-language",
            "en;q=0.8, es, pt",
          );
          assertEquals(ctx.acceptsLanguages(["fr", "au"]), false);
        });
      });
    });

    describe("when Accept-Language is not populated", () => {
      it("should return the first type", () => {
        const ctx = context();
        assertEquals(ctx.acceptsLanguages(["es", "en"]), "es");
      });
    });
  });
});
