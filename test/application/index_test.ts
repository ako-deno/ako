import {
  Application,
} from "../../mod.ts";
import { describe, it } from "../deps.ts";
import { HttpError, createError } from "../../deps.ts";
import { HttpError as AkoHttpError } from "../../mod.ts";
import {
  assert,
  assertEquals,
  assertStrictEquals,
  assertNotEquals,
} from "../deps.ts";

describe("app", () => {
  it("should set development env when DENO_ENV missing", () => {
    const DENO_ENV = Deno.env.get("DENO_ENV");
    Deno.env.set("DENO_ENV", "");
    const app = new Application();
    Deno.env.set("DENO_ENV", DENO_ENV ?? "");
    assertEquals(app.env, "development");
  });

  it("should set env from the constructor", () => {
    const env = "custom";
    const app = new Application({ env });
    assertStrictEquals(app.env, env);
  });

  it("should set proxy flag from the constructor", () => {
    const proxy = true;
    const app = new Application({ proxy });
    assertStrictEquals(app.proxy, proxy);
  });

  // todo
  // it('should set signed cookie keys from the constructor', () => {
  //   const keys = ['customkey'];
  //   const app = new Application({ keys });
  //   assertStrictEquals(app.keys, keys);
  // });

  it("should set subdomainOffset from the constructor", () => {
    const subdomainOffset = 3;
    const app = new Application({ subdomainOffset });
    assertStrictEquals(app.subdomainOffset, subdomainOffset);
  });

  it("should have a exported property `HttpError` from http-errors library", () => {
    assertNotEquals(AkoHttpError, undefined);
    assertEquals(AkoHttpError, HttpError);
    assert(createError(500, "test error") instanceof AkoHttpError);
  });
});
