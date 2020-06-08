import {
  Application,
} from "../mod.ts";
import { assertEquals, superdeno, describe, it } from "./deps.ts";

describe("Ako", () => {
  it("single middleware", async function (): Promise<void> {
    const body = "Hello, I'm ako 🦕!";
    const app = new Application();
    app.use((ctx) => {
      ctx.body = body;
    });

    await superdeno(app)
      .get("/")
      .expect(200)
      .expect(body);
  });

  it("double middleware", async function (): Promise<void> {
    const customHeaderkey = "x-ako";
    const customHeaderValue = "ako";
    const body = "Hello, I'm ako 🦕!";
    const app = new Application();
    app.use((ctx, next) => {
      ctx.val = 123;
      return next!();
    });
    app.use((ctx) => {
      assertEquals(ctx.val, 123);
      ctx.body = body;
      ctx.set(customHeaderkey, customHeaderValue);
    });

    await superdeno(app)
      .get("/")
      .expect(200)
      .expect(body)
      .expect(customHeaderkey, customHeaderValue);
  });
});
