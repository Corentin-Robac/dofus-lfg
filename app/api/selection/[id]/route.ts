// app/api/selection/[id]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Petit helper: accepte soit un objet, soit une Promise d'objet
async function unwrapParams<T>(maybePromise: T | Promise<T>): Promise<T> {
  return typeof (maybePromise as any)?.then === "function"
    ? await (maybePromise as Promise<T>)
    : (maybePromise as T);
}

export async function DELETE(
  _req: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  // ✅ Next 16: params peut être une Promise → on l’unwrap proprement
  const params = await unwrapParams((context as any).params);
  const id = params?.id;

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Vérifie que l’inscription appartient bien à un de MES personnages
  const sel = await prisma.selection.findUnique({
    where: { id },
    include: { character: { select: { userId: true } } },
  });

  if (!sel) {
    return new Response("Not found", { status: 404 });
  }
  if (sel.character.userId !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  await prisma.selection.delete({ where: { id } });
  return new Response("Deleted", { status: 200 });
}
