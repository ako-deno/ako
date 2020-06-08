import {
  Application,
} from "../../mod.ts";
import { describe, it, mm } from "../deps.ts";
import {
  assert,
  assertEquals,
} from "../deps.ts";

describe("app.onerror(err)", () => {
  it("should do nothing if status is 404", () => {
    const app = new Application();
    const err = new Error();

    (err as any).status = 404;

    let called = false;
    (mm as Function)(console, "error", () => {
      called = true;
    });
    app.onerror(err);
    assert(!called);
    (mm as any).restore();
  });

  it("should do nothing if .silent", () => {
    const app = new Application();
    app.silent = true;
    const err = new Error();

    let called = false;
    (mm as Function)(console, "error", () => {
      called = true;
    });
    app.onerror(err);
    assert(!called);
    (mm as any).restore();
  });

  it("should log the error to stderr", () => {
    const app = new Application();
    app.env = "dev";

    const err = new Error();
    err.stack = "Foo";

    let msg = "";
    (mm as Function)(console, "error", (input: string) => {
      if (input) msg = input;
    });
    app.onerror(err);
    assertEquals(msg, "  Foo");
    (mm as any).restore();
  });

  it("should use err.toString() instad of err.stack", () => {
    const app = new Application();
    app.env = "dev";

    const err = new Error("mock stack null");
    (err as any).stack = null;

    app.onerror(err);

    let msg = "";
    (mm as Function)(console, "error", (input: string) => {
      if (input) msg = input;
    });
    app.onerror(err);
    assertEquals(msg, "  Error: mock stack null");
    (mm as any).restore();
  });
});
