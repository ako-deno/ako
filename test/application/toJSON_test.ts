import {
  Application,
} from "../../mod.ts";
import { describe, it } from "../deps.ts";
import {
  assertEquals,
} from "../deps.ts";

describe("app.toJSON()", () => {
  it("should work", () => {
    const app = new Application();
    const obj = app.toJSON();

    assertEquals({
      subdomainOffset: 2,
      proxy: false,
      env: "development",
    }, obj);
  });
});
