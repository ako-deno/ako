import { describe, it, assertEquals } from "../deps.ts";
import { context } from "../helpers/context.ts";

describe("ctx.accepts(types)", () => {
  describe("with no arguments", () => {
    describe("when Accept is populated", () => {
      it("should return all accepted types", () => {
        const ctx = context();
        ctx.req.headers.set(
          "accept",
          "application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain",
        );
        assertEquals(
          ctx.accepts(),
          ["text/html", "text/plain", "image/jpeg", "application/*"],
        );
      });
    });
  });

  describe("with no valid types", () => {
    describe("when Accept is populated", () => {
      it("should return false", () => {
        const ctx = context();
        ctx.req.headers.set(
          "accept",
          "application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain",
        );
        assertEquals(ctx.accepts(["image/png", "image/tiff"]), false);
      });
    });

    describe("when Accept is not populated", () => {
      it("should return the first type", () => {
        const ctx = context();
        assertEquals(
          ctx.accepts(
            ["text/html", "text/plain", "image/jpeg", "application/*"],
          ),
          "text/html",
        );
      });
    });
  });

  describe("when extensions are given", () => {
    it("should convert to mime types", () => {
      const ctx = context();
      ctx.req.headers.set(
        "accept",
        "text/plain, text/html",
      );
      assertEquals(ctx.accepts(["html"]), "html");
      assertEquals(ctx.accepts(".html"), ".html");
      assertEquals(ctx.accepts("txt"), "txt");
      assertEquals(ctx.accepts(".txt"), ".txt");
      assertEquals(ctx.accepts("png"), false);
    });
  });

  describe("when an array is given", () => {
    it("should return the first match", () => {
      const ctx = context();
      ctx.req.headers.set(
        "accept",
        "text/plain, text/html",
      );
      assertEquals(ctx.accepts(["png", "text", "html"]), "text");
      assertEquals(ctx.accepts(["png", "html"]), "html");
    });
  });

  describe("when present in Accept as an exact match", () => {
    it("should return the type", () => {
      const ctx = context();
      ctx.req.headers.set(
        "accept",
        "text/plain, text/html",
      );
      assertEquals(ctx.accepts("text/html"), "text/html");
      assertEquals(ctx.accepts("text/plain"), "text/plain");
    });
  });

  describe("when present in Accept as a type match", () => {
    it("should return the type", () => {
      const ctx = context();
      ctx.req.headers.set(
        "accept",
        "application/json, */*",
      );
      assertEquals(ctx.accepts("text/html"), "text/html");
      assertEquals(ctx.accepts("text/plain"), "text/plain");
      assertEquals(ctx.accepts("image/png"), "image/png");
    });
  });

  describe("when present in Accept as a subtype match", () => {
    it("should return the type", () => {
      const ctx = context();
      ctx.req.headers.set(
        "accept",
        "application/json, text/*",
      );
      assertEquals(ctx.accepts("text/html"), "text/html");
      assertEquals(ctx.accepts("text/plain"), "text/plain");
      assertEquals(ctx.accepts("image/png"), false);
      assertEquals(ctx.accepts("png"), false);
    });
  });
});
