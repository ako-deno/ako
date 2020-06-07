/*
Type definitions for koa-compose 3.2
Project: https://github.com/koajs/compose
Definitions by: jKey Lu <https://github.com/jkeylu>
                Anton Astashov <https://github.com/astashov>
Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
*/

/*
(The MIT License)
Copyright (c) 2019 Koa contributors

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

import * as Koa from "./koa_type.ts";

export function compose<T1, U1, T2, U2>(
  middleware: [Koa.Middleware<T1, U1>, Koa.Middleware<T2, U2>],
): Koa.Middleware<T1 & T2, U1 & U2>;

export function compose<T1, U1, T2, U2, T3, U3>(
  middleware: [
    Koa.Middleware<T1, U1>,
    Koa.Middleware<T2, U2>,
    Koa.Middleware<T3, U3>,
  ],
): Koa.Middleware<T1 & T2 & T3, U1 & U2 & U3>;

export function compose<T1, U1, T2, U2, T3, U3, T4, U4>(
  middleware: [
    Koa.Middleware<T1, U1>,
    Koa.Middleware<T2, U2>,
    Koa.Middleware<T3, U3>,
    Koa.Middleware<T4, U4>,
  ],
): Koa.Middleware<T1 & T2 & T3 & T4, U1 & U2 & U3 & U4>;

export function compose<T1, U1, T2, U2, T3, U3, T4, U4, T5, U5>(
  middleware: [
    Koa.Middleware<T1, U1>,
    Koa.Middleware<T2, U2>,
    Koa.Middleware<T3, U3>,
    Koa.Middleware<T4, U4>,
    Koa.Middleware<T5, U5>,
  ],
): Koa.Middleware<T1 & T2 & T3 & T4 & T5, U1 & U2 & U3 & U4 & U5>;

export function compose<T1, U1, T2, U2, T3, U3, T4, U4, T5, U5, T6, U6>(
  middleware: [
    Koa.Middleware<T1, U1>,
    Koa.Middleware<T2, U2>,
    Koa.Middleware<T3, U3>,
    Koa.Middleware<T4, U4>,
    Koa.Middleware<T5, U5>,
    Koa.Middleware<T6, U6>,
  ],
): Koa.Middleware<T1 & T2 & T3 & T4 & T5 & T6, U1 & U2 & U3 & U4 & U5 & U6>;

export function compose<
  T1,
  U1,
  T2,
  U2,
  T3,
  U3,
  T4,
  U4,
  T5,
  U5,
  T6,
  U6,
  T7,
  U7,
>(
  middleware: [
    Koa.Middleware<T1, U1>,
    Koa.Middleware<T2, U2>,
    Koa.Middleware<T3, U3>,
    Koa.Middleware<T4, U4>,
    Koa.Middleware<T5, U5>,
    Koa.Middleware<T6, U6>,
    Koa.Middleware<T7, U7>,
  ],
): Koa.Middleware<
  T1 & T2 & T3 & T4 & T5 & T6 & T7,
  U1 & U2 & U3 & U4 & U5 & U6 & U7
>;

export function compose<
  T1,
  U1,
  T2,
  U2,
  T3,
  U3,
  T4,
  U4,
  T5,
  U5,
  T6,
  U6,
  T7,
  U7,
  T8,
  U8,
>(
  middleware: [
    Koa.Middleware<T1, U1>,
    Koa.Middleware<T2, U2>,
    Koa.Middleware<T3, U3>,
    Koa.Middleware<T4, U4>,
    Koa.Middleware<T5, U5>,
    Koa.Middleware<T6, U6>,
    Koa.Middleware<T7, U7>,
    Koa.Middleware<T8, U8>,
  ],
): Koa.Middleware<
  T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8,
  U1 & U2 & U3 & U4 & U5 & U6 & U7 & U8
>;

export function compose<T>(
  middleware: Array<Middleware<T>>,
): ComposedMiddleware<T>;

export function compose(middleware: Function[]) {
  return function (context: any, next?: Koa.Next) {
    // last called middleware #
    let index = -1;
    return dispatch(0);
    function dispatch(i: number): Promise<any> {
      if (i <= index) {
        return Promise.reject(new Error("next() called multiple times"));
      }
      index = i;
      let fn = middleware[i];
      if (i === middleware.length && next) fn = next;
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}

export type Middleware<T> = (context: T, next: Koa.Next) => any;
export type ComposedMiddleware<T> = (
  context: T,
  next?: Koa.Next,
) => Promise<void>;
