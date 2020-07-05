import {
  Application,
} from "../../mod.ts";
import { superdeno, describe, it } from "../deps.ts";
import {
  assertEquals,
} from "../deps.ts";

describe("app.use(fn)", () => {
  it("should compose middleware", (done) => {
    const app = new Application();
    const calls: number[] = [];

    app.use((ctx, next) => {
      calls.push(1);
      return next().then(() => {
        calls.push(6);
      });
    });

    app.use((ctx, next) => {
      calls.push(2);
      return next().then(() => {
        calls.push(5);
      });
    });

    app.use((ctx, next) => {
      calls.push(3);
      return next().then(() => {
        calls.push(4);
      });
    });

    const server = app.listen();

    superdeno(server)
      .get("/")
      .expect(404, done);
  });

  // https://github.com/koajs/koa/pull/530#issuecomment-148138051
  it("should catch thrown errors in non-async functions", (done) => {
    const app = new Application();

    app.use((ctx) => ctx.throw(404, "Not Found"));

    superdeno(app)
      .get("/")
      .expect(404, done);
  });
});
