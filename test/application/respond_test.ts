"use strict";

import {
  Application,
} from "../../mod.ts";
import {
  superdeno,
  describe,
  it,
  setImmediate,
  path,
  readJson,
} from "../deps.ts";
import {
  assert,
  assertEquals,
} from "../deps.ts";

function isFileClosed(r: Deno.File): boolean {
  try {
    r.readSync(new Uint8Array(1));
    return false;
  } catch (e) {
    return true;
  }
}

describe("app.respond", () => {
  describe("when ctx.respond === false", () => {
    it("should function (ctx)", async () => {
      const app = new Application();

      app.use((ctx) => {
        ctx.body = "Hello";
        ctx.respond = false;

        const res = ctx.res;
        res.status = 200;
        setImmediate(() => {
          res.headers!.set("Content-Type", "text/plain");
          res.headers!.set("Content-Length", "3");
          ctx.req.respond(Object.assign({}, res, { body: "lol" }));
        });
      });

      const server = app.listen();

      await superdeno(server)
        .get("/")
        .expect(200)
        .expect("lol");
    });

    it("should ignore set header after header sent", async () => {
      const app = new Application();
      app.use((ctx) => {
        ctx.body = "Hello";
        ctx.respond = false;

        const res = ctx.res;
        res.status = 200;
        res.headers!.set("Content-Type", "text/plain");
        res.headers!.set("Content-Length", "3");
        ctx.req.respond(Object.assign({}, res, { body: "lol" }));
        ctx.set("foo", "bar");
      });

      const server = app.listen();

      await superdeno(server)
        .get("/")
        .expect(200)
        .expect("lol")
        .expect((res) => {
          assert(!res.headers.foo);
        });
    });

    it("should ignore set status after header sent", async () => {
      const app = new Application();
      app.use((ctx) => {
        ctx.body = "Hello";
        ctx.respond = false;

        const res = ctx.res;
        res.status = 200;
        res.headers!.set("Content-Type", "text/plain");
        res.headers!.set("Content-Length", "3");
        ctx.req.respond(Object.assign({}, res, { body: "lol" }));
        ctx.status = 201;
      });

      const server = app.listen();

      await superdeno(server)
        .get("/")
        .expect(200)
        .expect("lol");
    });
  });

  describe("when this.type === null", () => {
    it("should not send Content-Type header", async () => {
      const app = new Application();

      app.use((ctx) => {
        ctx.body = "";
        ctx.type = null;
      });

      const server = app.listen();

      const res = await superdeno(server)
        .get("/")
        .expect(200);

      assertEquals((res as any).headers.hasOwnProperty("Content-Type"), false);
    });
  });

  describe("when HEAD is used", () => {
    it("should not respond with the body", async () => {
      const app = new Application();

      app.use((ctx) => {
        ctx.body = "Hello";
      });

      const server = app.listen();

      const res = await superdeno(server)
        .head("/")
        .expect(200)
        .expect("content-type", "text/plain; charset=utf-8")
        .expect("content-length", "5");

      assert(!(res as any).text);
    });

    it("should keep json headers", async () => {
      const app = new Application();

      app.use((ctx) => {
        ctx.body = { hello: "world" };
      });

      const server = app.listen();

      const res = await superdeno(server)
        .head("/")
        .expect(200)
        .expect("content-type", "application/json; charset=utf-8")
        .expect("content-length", "17");

      assert(!(res as any).text);
    });

    it("should keep string headers", async () => {
      const app = new Application();

      app.use((ctx) => {
        ctx.body = "hello world";
      });

      const server = app.listen();

      const res = await superdeno(server)
        .head("/")
        .expect(200)
        .expect("content-type", "text/plain; charset=utf-8")
        .expect("content-length", "11");

      assert(!(res as any).text);
    });

    it("should keep buffer headers", async () => {
      const app = new Application();

      app.use((ctx) => {
        const buf = new Deno.Buffer(
          new Uint8Array(
            [41, 52],
          ),
        );
        ctx.body = buf;
      });

      const server = app.listen();

      const res = await superdeno(server)
        .head("/")
        .expect(200)
        .expect("content-type", "application/octet-stream");

      assert(!(res as any).text);
    });

    it("should keep Uint8Array headers", async () => {
      const app = new Application();

      app.use((ctx) => {
        const buf = new Uint8Array(
          [41, 52],
        );
        ctx.body = buf;
      });

      const server = app.listen();

      const res = await superdeno(server)
        .head("/")
        .expect(200)
        .expect("content-type", "application/octet-stream")
        .expect("content-length", "2");

      assert(!(res as any).text);
    });

    it("should keep stream header if set manually", async () => {
      const app = new Application();
      const filename = path.join(Deno.cwd(), "/test/__fixtures/hugeJSON.json");
      const { size } = await Deno.stat(filename);
      const file = await Deno.open(filename);

      app.use((ctx) => {
        ctx.length = size;
        ctx.body = file;
      });

      const server = app.listen();

      const res = await superdeno(server)
        .head("/")
        .expect(200)
        .expect("content-type", "application/octet-stream")
        .expect("content-length", "" + size);

      assert(!(res as any).text);
      assert(isFileClosed(file));
    });

    it("should respond with a 404 if no body was set", (done) => {
      const app = new Application();

      app.use((ctx) => {
      });

      const server = app.listen();

      superdeno(server)
        .head("/")
        .expect(404, done);
    });

    it('should respond with a 200 if body = ""', async () => {
      const app = new Application();

      app.use((ctx) => {
        ctx.body = "";
      });

      const server = app.listen();

      await superdeno(server)
        .head("/")
        .expect(200);
    });

    it("should not overwrite the content-type", async () => {
      const app = new Application();

      app.use((ctx) => {
        ctx.status = 200;
        ctx.type = "application/javascript";
      });

      const server = app.listen();

      await superdeno(server)
        .head("/")
        .expect("content-type", /application\/javascript/)
        .expect(200);
    });
  });

  describe("when no middleware are present", () => {
    it("should 404", (done) => {
      const app = new Application();

      const server = app.listen();
      superdeno(server)
        .head("/")
        .expect(404, done);
    });
  });

  describe("when .body is missing", () => {
    describe("with status=400", () => {
      it("should respond with the associated status message", (done) => {
        const app = new Application();

        app.use((ctx) => {
          ctx.status = 400;
        });

        const server = app.listen();

        superdeno(server)
          .get("/")
          .expect(400)
          .expect("Content-Length", "11")
          .expect("Bad Request", done);
      });
    });

    describe("with status=204", () => {
      it("should respond without a body", async () => {
        const app = new Application();

        app.use((ctx) => {
          ctx.status = 204;
        });

        const server = app.listen();

        const res = await superdeno(server)
          .get("/")
          .expect(204)
          .expect("content-length", "0")
          .expect("");
        assertEquals((res as any).headers["content-type"], undefined);
      });
    });

    describe("with status=205", () => {
      it("should respond without a body", async () => {
        const app = new Application();

        app.use((ctx) => {
          ctx.status = 205;
        });

        const server = app.listen();

        const res = await superdeno(server)
          .get("/")
          .expect(205)
          .expect("content-length", "0")
          .expect("");

        assertEquals((res as any).headers["content-type"], undefined);
      });
    });

    describe("with status=304", () => {
      it("should respond without a body", (done) => {
        const app = new Application();

        app.use((ctx) => {
          ctx.status = 304;
        });

        const server = app.listen();

        superdeno(server)
          .get("/")
          .expect(304)
          .expect("content-length", "0")
          .expect("", done);
      });
    });
  });

  describe("when .body is a null", () => {
    it("should respond 204 by default", async () => {
      const app = new Application();

      app.use((ctx) => {
        ctx.body = null;
      });

      const server = app.listen();

      const res = await superdeno(server)
        .get("/")
        .expect(204)
        .expect("content-length", "0")
        .expect("");

      assertEquals((res as any).headers["content-type"], undefined);
    });

    it("should respond 204 with status=200", async () => {
      const app = new Application();

      app.use((ctx) => {
        ctx.status = 200;
        ctx.body = null;
      });

      const server = app.listen();

      const res = await superdeno(server)
        .get("/")
        .expect(204)
        .expect("content-length", "0")
        .expect("");

      assertEquals((res as any).headers["content-type"], undefined);
    });

    it("should respond 205 with status=205", async () => {
      const app = new Application();

      app.use((ctx) => {
        ctx.status = 205;
        ctx.body = null;
      });

      const server = app.listen();

      const res = await superdeno(server)
        .get("/")
        .expect(205)
        .expect("content-length", "0")
        .expect("");

      assertEquals((res as any).headers["content-type"], undefined);
    });

    it("should respond 304 with status=304", (done) => {
      const app = new Application();

      app.use((ctx) => {
        ctx.status = 304;
        ctx.body = null;
      });

      const server = app.listen();

      superdeno(server)
        .get("/")
        .expect(304)
        .expect("content-length", "0")
        .expect("", done);
    });
  });

  describe("when .body is a string", () => {
    it("should respond", async () => {
      const app = new Application();

      app.use((ctx) => {
        ctx.body = "Hello";
      });

      const server = app.listen();

      await superdeno(server)
        .get("/")
        .expect("Hello");
    });
  });

  describe("when .body is a Uint8Array", () => {
    it("should respond", async () => {
      const app = new Application();

      const data = new Uint8Array(
        [41, 52],
      );
      app.use((ctx) => {
        ctx.body = data;
      });

      const server = app.listen();

      const r = await superdeno(server)
        .get("/")
        .expect(200)
        .expect("content-length", "2")
        .expect("content-type", "application/octet-stream")
        .expect(")4");
    });
  });

  describe("when .body is a Reader", () => {
    it("should respond", async () => {
      const app = new Application();

      const data = new Uint8Array(
        [41, 52],
      );
      const buf = new Deno.Buffer(data);
      app.use((ctx) => {
        ctx.body = buf;
      });

      const server = app.listen();

      await superdeno(server)
        .get("/")
        .expect(200)
        .expect("content-type", "application/octet-stream")
        .expect(")4");
    });

    it("should strip content-length when overwriting", async () => {
      const app = new Application();

      const filename = path.join(Deno.cwd(), "/test/__fixtures/hugeJSON.json");
      const hugeJSON = await readJson(filename);
      const file = await Deno.open(filename);

      app.use((ctx) => {
        ctx.body = "hello";
        ctx.body = file;
        ctx.set("Content-Type", "application/json; charset=utf-8");
      });

      const server = app.listen();

      const res = await superdeno(server)
        .get("/")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect("Transfer-Encoding", "chunked");

      assertEquals(hugeJSON, (res as any).body);
      assert(isFileClosed(file));
    });

    it("should keep content-length if not overwritten", async () => {
      const app = new Application();
      const filename = path.join(Deno.cwd(), "/test/__fixtures/hugeJSON.json");
      const hugeJSON = await readJson(filename);
      const { size } = await Deno.stat(filename);
      const file = await Deno.open(filename);

      app.use(async (ctx) => {
        ctx.length = size;
        ctx.body = file;
        ctx.set("Content-Type", "application/json; charset=utf-8");
      });

      const server = app.listen();

      const res = await superdeno(server)
        .get("/")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect("content-length", "" + size);

      assertEquals(hugeJSON, (res as any).body);
      assert(isFileClosed(file));
    });

    it("should keep content-length if overwritten with the same stream", async () => {
      const app = new Application();
      const filename = path.join(Deno.cwd(), "/test/__fixtures/hugeJSON.json");
      const hugeJSON = await readJson(filename);
      const { size } = await Deno.stat(filename);
      const file = await Deno.open(filename);

      app.use(async (ctx) => {
        ctx.length = size;
        ctx.body = file;
        ctx.body = file;
        ctx.set("Content-Type", "application/json; charset=utf-8");
      });

      const server = app.listen();

      const res = await superdeno(server)
        .get("/")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect("content-length", "" + size);

      assertEquals(hugeJSON, (res as any).body);
      assert(isFileClosed(file));
    });
  });

  describe("when .body is an Object", () => {
    it("should respond with json", async () => {
      const app = new Application();

      app.use((ctx) => {
        ctx.body = { hello: "world" };
      });

      const server = app.listen();

      await superdeno(server)
        .get("/")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect("Content-Length", "17")
        .expect('{"hello":"world"}');
    });
  });

  describe("when an error occurs", () => {
    it('should emit "error" on the app', (done) => {
      const app = new Application();
      let isErrHandled = false;

      app.use((ctx) => {
        throw new Error("boom");
      });

      app.on("error", (err: any) => {
        assertEquals(err.message, "boom");
        isErrHandled = true;
      });

      superdeno(app)
        .get("/")
        .expect(500, done);
    });

    describe("with an .expose property", () => {
      it("should expose the message", (done) => {
        const app = new Application();

        app.use((ctx) => {
          const err = new Error("sorry!");
          (err as any).status = 403;
          (err as any).expose = true;
          throw err;
        });

        superdeno(app)
          .get("/")
          .expect(403, done);
      });
    });

    describe("with a .status property", () => {
      it("should respond with .status", (done) => {
        const app = new Application();

        app.use((ctx) => {
          const err = new Error("s3 explodes");
          (err as any).status = 403;
          throw err;
        });

        superdeno(app)
          .get("/")
          .expect(403, done);
      });
    });

    it("should respond with 500", (done) => {
      const app = new Application();

      app.use((ctx) => {
        throw new Error("boom!");
      });

      const server = app.listen();

      superdeno(server)
        .get("/")
        .expect(500)
        .expect("Internal Server Error", done);
    });

    it("should be catchable", async () => {
      const app = new Application();

      app.use((ctx, next) => {
        return next().then(() => {
          ctx.body = "Hello";
        }).catch(() => {
          ctx.body = "Got error";
        });
      });

      app.use((ctx, next) => {
        throw new Error("boom!");
      });

      const server = app.listen();

      await superdeno(server)
        .get("/")
        .expect(200, "Got error");
    });

    describe("when status and body property", () => {
      it("should 200", async () => {
        const app = new Application();

        app.use((ctx) => {
          ctx.status = 304;
          ctx.body = "hello";
          ctx.status = 200;
        });

        const server = app.listen();

        await superdeno(server)
          .get("/")
          .expect(200)
          .expect("hello");
      });

      it("should 204", async () => {
        const app = new Application();

        app.use((ctx) => {
          ctx.status = 200;
          ctx.body = "hello";
          ctx.set("content-type", "text/plain; charset=utf8");
          ctx.status = 204;
        });

        const server = app.listen();

        const res = await superdeno(server)
          .get("/")
          .expect(204);

        assert(!(res as any).headers["content-type"]);
        assertEquals((res as any).text, "");
        assert(!(res as any).body);
      });
    });

    describe("with explicit null body", () => {
      it("should preserve given status", (done) => {
        const app = new Application();

        app.use((ctx) => {
          ctx.body = null;
          ctx.status = 404;
        });

        const server = app.listen();

        superdeno(server)
          .get("/")
          .expect(404)
          .expect("", done);
      });

      it("should respond with correct headers", (done) => {
        const app = new Application();

        app.use((ctx) => {
          ctx.body = null;
          ctx.status = 401;
        });

        const server = app.listen();

        superdeno(server)
          .get("/")
          .expect(401)
          .expect("", done);
      });
    });
  });
});
