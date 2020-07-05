import {
  Application,
} from "../../mod.ts";
import { superdeno, describe, it } from "../deps.ts";
import {
  assertEquals,
  assertStrictEq,
} from "../deps.ts";

describe("app.response", () => {
  const app1 = new Application();
  (app1.response as any).msg = "hello";
  const app2 = new Application();
  const app3 = new Application();
  const app4 = new Application();
  const app5 = new Application();

  it("should merge properties", async () => {
    app1.use((ctx, next) => {
      assertEquals((app1.response as any).msg, "hello");
      ctx.status = 204;
    });

    await superdeno(app1)
      .get("/")
      .expect(204);
  });

  it("should not affect the original prototype", async () => {
    app2.use((ctx, next) => {
      assertEquals((app2.response as any).msg, undefined);
      ctx.status = 204;
    });

    await superdeno(app2)
      .get("/")
      .expect(204);
  });

  it("should not include status message in body for http2", (done) => {
    app3.use((ctx, next) => {
      ctx.req.protoMajor = 2;
      ctx.status = 404;
    });
    superdeno(app3)
      .get("/")
      .expect(404, done);
  });

  it("should set ._explicitNullBody correctly", async () => {
    app4.use((ctx, next) => {
      ctx.body = null;
      assertStrictEq(ctx.response._explicitNullBody, true);
    });

    await superdeno(app4)
      .get("/")
      .expect(204);
  });

  it("should not set ._explicitNullBody incorrectly", async () => {
    app5.use((ctx, next) => {
      ctx.body = undefined;
      assertStrictEq(ctx.response._explicitNullBody, undefined);
      ctx.body = "";
      assertStrictEq(ctx.response._explicitNullBody, undefined);
      ctx.body = false;
      assertStrictEq(ctx.response._explicitNullBody, undefined);
    });

    await superdeno(app5)
      .get("/")
      .expect(204);
  });
});
