import {
  Application,
  Context,
} from "../mod.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std/testing/asserts.ts";

Deno.test("[ako] application", async function (): Promise<void> {
  const customHeaderkey = "x-ako";
  const customHeaderValue = "ako";
  const body = "Hello, I'm ako 🦕!";
  async function handler(ctx: Context) {
    const headers = new Headers([[customHeaderkey, customHeaderValue]]);
    ctx.req.respond({
      body,
      headers,
    });
  }
  const app = new Application();
  app.use(handler);

  const server = app.listen({ port: 0 });
  const res = await fetch(
    `http://127.0.0.1:${(server.listener.addr as Deno.NetAddr).port!}`,
  );
  assert(res.ok);
  assertEquals(await res.text(), body);
  assertEquals(res.headers.get(customHeaderkey), customHeaderValue);
  server.close();
});
