import { auth } from "@/lib/auth";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireOrigin(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000").origin
  )
    throw new HttpError(403, "Origem não permitida.");
}
export async function requireUser(request: Request, mutation = false) {
  if (mutation) requireOrigin(request);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new HttpError(401, "Entre na sua conta para continuar.");
  return session.user;
}
export async function readLimited(request: Request, limit: number) {
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw new HttpError(413, "Arquivo ou pedido muito grande.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Conteúdo ausente.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, "Arquivo ou pedido muito grande.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export async function readJSON(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "Use JSON.");
  try {
    return JSON.parse((await readLimited(request, 64 * 1024)).toString("utf8"));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "JSON inválido.");
  }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  if (error instanceof ZodError)
    return Response.json(
      { error: error.issues[0]?.message || "Confira os dados." },
      { status: 400 },
    );
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
    return Response.json(
      { error: "Esse username já está em uso. Escolha outro." },
      { status: 409 },
    );
  console.error(
    "Falha interna na API",
    error instanceof Error ? error.name : "UnknownError",
  );
  return Response.json(
    { error: "Não foi possível concluir. Tente novamente." },
    { status: 500 },
  );
}
