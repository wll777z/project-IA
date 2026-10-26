import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { readLimited, apiError } from "@/lib/http";
export const runtime = "nodejs";
const handlers = toNextJsHandler(auth);
export const GET = handlers.GET;
export async function POST(request: Request) {
  try {
    const body = await readLimited(request, 16 * 1024);
    return await handlers.POST(
      new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: new Uint8Array(body),
      }),
    );
  } catch (e) {
    return apiError(e);
  }
}
