/*

Ported from  https://github.com/jshttp/http-assert/blob/master/index.js

(The MIT License)

https://github.com/jshttp/http-assert/blob/master/LICENSE

Copyright (c) 2014 

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { createError, equal, Props } from "../../deps.ts";

export function assert(value: any, status: number, msg?: string, opts?: Props) {
  if (value) return;
  throw createError(status, msg, opts);
}

assert.equal = function (
  a: any,
  b: any,
  status: number,
  msg?: string,
  opts?: Props,
) {
  assert(a == b, status, msg, opts);
};

assert.notEqual = function (
  a: any,
  b: any,
  status: number,
  msg?: string,
  opts?: Props,
) {
  assert(a != b, status, msg, opts);
};

assert.ok = function (value: any, status: number, msg?: string, opts?: Props) {
  assert(value, status, msg, opts);
};

assert.strictEqual = function (
  a: any,
  b: any,
  status: number,
  msg?: string,
  opts?: Props,
) {
  assert(a === b, status, msg, opts);
};

assert.notStrictEqual = function (
  a: any,
  b: any,
  status: number,
  msg?: string,
  opts?: Props,
) {
  assert(a !== b, status, msg, opts);
};

assert.deepEqual = function (
  a: any,
  b: any,
  status: number,
  msg?: string,
  opts?: Props,
) {
  assert(equal(a, b), status, msg, opts);
};

assert.notDeepEqual = function (
  a: any,
  b: any,
  status: number,
  msg?: string,
  opts?: Props,
) {
  assert(!equal(a, b), status, msg, opts);
};
