import {
  Application,
} from "../../mod.ts";
import { describe, it } from "../deps.ts";
import {
  assertEquals,
} from "../deps.ts";

describe("app.inspect()", () => {
  const app = new Application();

  it("should return a json representation", () => {
    assertEquals(
      { subdomainOffset: 2, proxy: false, env: "development" },
      app.inspect(),
    );
  });
});
