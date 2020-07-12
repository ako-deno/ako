import {
  Application,
} from "../../mod.ts";
import {
  describe,
  it,
  superdeno,
  assertEquals,
} from "../deps.ts";

describe("ctx.state", () => {
  it("should provide a ctx.state namespace", async () => {
    const app = new Application();

    app.use((ctx) => {
      assertEquals(ctx.state, {});
    });

    const server = app.listen();

    await superdeno(server)
      .get("/")
      .expect(404);
  });
});
