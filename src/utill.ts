import {
  encoder,
} from "../deps.ts";

export function byteLength(str: string): number {
  return encoder.encode(str).byteLength;
}

export const statusEmpty: { [key: number]: boolean } = {
  204: true,
  205: true,
  304: true,
};

export const statusRedirect: { [key: number]: boolean } = {
  300: true,
  301: true,
  302: true,
  303: true,
  305: true,
  307: true,
  308: true,
};

export function isReader(value: any): value is Deno.Reader {
  return typeof value === "object" && "read" in value &&
    typeof value.read === "function";
}

export function closeReader(reader?: any) {
  if (reader && isReader(reader) && (reader as any).close) {
    try {
      (reader as any).close();
    } catch (e) {
    }
  }
}
