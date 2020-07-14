import { describe, it, assert, assertEquals } from "../deps.ts";
import { context, request } from "../helpers/context.ts";
import {
  Accepts,
} from "../../deps.ts";

describe("ctx.accept", () => {
  it("should return an Accept instance", () => {
    const ctx = context();
    ctx.req.headers.set(
      "accept",
      "application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain",
    );
    assert(ctx.accept instanceof Accepts);
  });
});

describe("ctx.accept=", () => {
  it("should replace the accept object", () => {
    const ctx = context();
    ctx.req.headers.set(
      "accept",
      "text/plain",
    );
    assertEquals(ctx.accepts(), ["text/plain"]);

    const req = request();
    req.headers.set(
      "accept",
      "application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain",
    );
    ctx.accept = new Accepts(req.header);
    assertEquals(
      ctx.accepts(),
      ["text/html", "text/plain", "image/jpeg", "application/*"],
    );
  });
});
