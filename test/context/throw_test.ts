import { describe, it, assertEquals, assertStrictEquals } from "../deps.ts";
import { context } from "../helpers/context.ts";

describe("ctx.throw(err)", () => {
  it("should set .status to 500", () => {
    const ctx = context();
    const err = new Error("test");

    try {
      ctx.throw(err);
    } catch (err) {
      assertEquals(err.status, 500);
      assertEquals(err.message, "test");
      assertEquals(err.expose, false);
    }
  });
});

describe("ctx.throw(status, msg)", () => {
  it("should throw an error", () => {
    const ctx = context();

    try {
      ctx.throw(400, "name required");
    } catch (err) {
      assertEquals(err.message, "name required");
      assertEquals(400, err.status);
      assertEquals(true, err.expose);
    }
  });
});

describe("ctx.throw(status)", () => {
  it("should throw an error", () => {
    const ctx = context();

    try {
      ctx.throw(400);
    } catch (err) {
      assertEquals(err.message, "Bad Request");
      assertEquals(err.status, 400);
      assertEquals(err.expose, true);
    }
  });

  describe("when not valid status", () => {
    it("should not expose", () => {
      const ctx = context();

      try {
        const err = new Error("some error");
        (err as any).status = -1;
        ctx.throw(err);
      } catch (err) {
        assertEquals(err.message, "some error");
        assertEquals(err.expose, false);
      }
    });
  });
});

describe("ctx.throw(status, msg, props)", () => {
  it("should mixin props", () => {
    const ctx = context();

    try {
      ctx.throw(400, "msg", { prop: true });
    } catch (err) {
      assertEquals(err.message, "msg");
      assertEquals(err.status, 400);
      assertEquals(err.expose, true);
      assertEquals(err.prop, true);
    }
  });

  describe("when props include status", () => {
    it("should be ignored", () => {
      const ctx = context();

      try {
        ctx.throw(400, "msg", {
          prop: true,
          status: -1,
        });
      } catch (err) {
        assertEquals(err.message, "msg");
        assertEquals(err.status, 400);
        assertEquals(err.expose, true);
        assertEquals(err.prop, true);
      }
    });
  });
});

describe("ctx.throw(status, props)", () => {
  it("should mixin props", () => {
    const ctx = context();

    try {
      ctx.throw(400, { prop: true });
    } catch (err) {
      assertEquals(err.message, "Bad Request");
      assertEquals(err.status, 400);
      assertEquals(err.expose, true);
      assertEquals(err.prop, true);
    }
  });
});

describe("ctx.throw(err, props)", () => {
  it("should mixin props", () => {
    const ctx = context();

    try {
      ctx.throw(new Error("test"), { prop: true });
    } catch (err) {
      assertEquals(err.message, "test");
      assertEquals(err.status, 500);
      assertEquals(err.expose, false);
      assertEquals(err.prop, true);
    }
  });
});
