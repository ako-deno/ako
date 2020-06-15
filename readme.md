# ako

<image src="./ako.svg" width=140>

![ci](https://github.com/ako-deno/ako/workflows/ci/badge.svg?branch=master)
[![HitCount](http://hits.dwyl.com/ako-deno/ako.svg)](http://hits.dwyl.com/ako-deno/ako)

Expressive HTTP middleware framework for deno using async functions. Aiming to port [Koa](https://github.com/koajs/koa) to Deno.

What is ako?
=====

Well, `'node'.split('').sort().join('')` derives `deno`, hence `'koa'.split('').sort().join('')` derives `ako`.

# Usage

```js
import {
  Application,
} from "https://deno.land/x/ako/mod.ts";

const app = new Application();
app.use((ctx) => {
  ctx.body = "Hello Ako!";
});

app.listen({ port: 3000 });
```

# License

[MIT](./LICENSE)
