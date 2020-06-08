import {
  Application,
} from "../../mod.ts";
import { superdeno, describe, it } from "../deps.ts";
import {
  assertEquals,
} from "../deps.ts";

describe("app.context", () => {
  const app1 = new Application();
  app1.context.msg = "hello";
  const app2 = new Application();

  it("should merge properties", async () => {
    app1.use((ctx, next) => {
      assertEquals(ctx.msg, "hello");
      ctx.status = 204;
    });

    await superdeno(app1)
      .get("/")
      .expect(204);
  });

  it("should not affect the original prototype", async () => {
    app2.use((ctx, next) => {
      assertEquals(ctx.msg, undefined);
      ctx.status = 204;
    });

    await superdeno(app2)
      .get("/")
      .expect(204);
  });
});
