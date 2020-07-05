import {
  Application,
} from "../../mod.ts";
import { superdeno, describe, it } from "../deps.ts";
import {
  assert,
  assertEquals,
} from "../deps.ts";

describe("ctx.onerror(err)", () => {
  it("should respond", async () => {
    const app = new Application();

    app.use((ctx, next) => {
      ctx.body = "something else";
      ctx.throw(418, "boom");
    });

    const server = app.listen();

    const res = await superdeno(server)
      .head("/")
      .expect(418)
      .expect("Content-Length", "4")
      .expect("Content-Type", "text/plain; charset=utf-8");

    // TODO: https://github.com/asos-craigmorten/superdeno/issues/11
    // assertEquals(res.text, "boom");
  });

  it("should unset all headers", async () => {
    const app = new Application();

    app.use((ctx, next) => {
      ctx.set("Vary", "Accept-Encoding");
      ctx.set("X-CSRF-Token", "asdf");
      ctx.body = "response";

      ctx.throw(418, "boom");
    });

    const server = app.listen();

    const res = await superdeno(server)
      .head("/")
      .expect(418)
      .expect("Content-Length", "4")
      .expect("Content-Type", "text/plain; charset=utf-8");
    // TODO: https://github.com/asos-craigmorten/superdeno/issues/11
    // assertEquals(res.text, "boom");
    assert(!(res as any).headers.vary);
    assert(!(res as any).headers["x-csrf-token"]);
  });

  it("should set headers specified in the error", async () => {
    const app = new Application();

    app.use((ctx, next) => {
      ctx.set("Vary", "Accept-Encoding");
      ctx.set("X-CSRF-Token", "asdf");
      ctx.body = "response";

      throw Object.assign(new Error("boom"), {
        status: 418,
        expose: true,
        headers: {
          "X-New-Header": "Value",
        },
      });
    });

    const server = app.listen();

    const res = await superdeno(server)
      .head("/")
      .expect(418)
      .expect("Content-Length", "4")
      .expect("Content-Type", "text/plain; charset=utf-8")
      .expect("X-New-Header", "Value");

    // TODO: https://github.com/asos-craigmorten/superdeno/issues/11
    // assertEquals(res.text, "boom");
    assert(!(res as any).headers.vary);
    assert(!(res as any).headers["x-csrf-token"]);
    assert((res as any).headers["x-new-header"]);
  });

  it("should set status specified in the error using statusCode", (done) => {
    const app = new Application();

    app.use((ctx, next) => {
      ctx.body = "something else";
      const err = new Error("Not found");
      (err as any).statusCode = 404;
      throw err;
    });

    const server = app.listen();
    superdeno(server)
      .head("/")
      .expect(404)
      .expect("Content-Type", "text/plain; charset=utf-8", done);
    // TODO: https://github.com/asos-craigmorten/superdeno/issues/11
    //.expect("Not Found", done)
  });

  describe("when invalid err.status", () => {
    describe("not number", () => {
      it("should respond 500", (done) => {
        const app = new Application();

        app.use((ctx, next) => {
          ctx.body = "something else";
          const err = new Error("some error");
          (err as any).status = "notnumber";
          throw err;
        });

        const server = app.listen();
        superdeno(server)
          .head("/")
          .expect(500)
          .expect("Content-Type", "text/plain; charset=utf-8", done);
        // TODO: https://github.com/asos-craigmorten/superdeno/issues/11
        // .expect("Internal Server Error")
      });
    });
    describe("when ENOENT error", () => {
      it("should respond 404", (done) => {
        const app = new Application();

        app.use((ctx, next) => {
          ctx.body = "something else";
          const err = new Error("test for ENOENT");
          (err as any).code = "ENOENT";
          throw err;
        });

        const server = app.listen();

        superdeno(server)
          .head("/")
          .expect(404)
          .expect("Content-Type", "text/plain; charset=utf-8", done);
        // TODO: https://github.com/asos-craigmorten/superdeno/issues/11
        // .expect("Not Found")
      });
    });
    describe("not http status code", () => {
      it("should respond 500", (done) => {
        const app = new Application();

        app.use((ctx, next) => {
          ctx.body = "something else";
          const err = new Error("some error");
          (err as any).status = 9999;
          throw err;
        });

        const server = app.listen();

        superdeno(server)
          .head("/")
          .expect(500)
          .expect("Content-Type", "text/plain; charset=utf-8", done);
        // TODO: https://github.com/asos-craigmorten/superdeno/issues/11
        // .expect("Internal Server Error")
      });
    });
  });

  describe("when non-error thrown", () => {
    it("should response non-error thrown message", (done) => {
      const app = new Application();

      app.use((ctx, next) => {
        throw "string error"; // eslint-disable-line no-throw-literal
      });

      const server = app.listen();
      superdeno(server)
        .head("/")
        .expect(500)
        .expect("Content-Type", "text/plain; charset=utf-8", done);
      // TODO: https://github.com/asos-craigmorten/superdeno/issues/11
      // .expect("Internal Server Error")
    });

    /*
    // TODO: This test causes OOM, need more investigation.
    it("should stringify error if it is an object", (done) => {
      const app = new Application();

      app.on("error", (err: any) => {
        assertEquals(err, 'Error: non-error thrown: {"key":"value"}');
        // done();
      });

      app.use(async (ctx) => {
        throw { key: "value" };
      });

      const server = app.listen();

      superdeno(server)
        .head("/")
        .expect(500, done);
      // TODO: https://github.com/asos-craigmorten/superdeno/issues/11
      // .expect("Internal Server Error")
    });
    */
  });
});
