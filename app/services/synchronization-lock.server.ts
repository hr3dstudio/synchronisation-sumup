import prisma from "../db.server";

export async function withSynchronizationLock<T>(
  shop: string,
  name: string,
  callback: () => Promise<T>,
) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await prisma.synchronizationLock.create({
      data: { shop, name, token, expiresAt },
    });
  } catch {
    throw new Error("Une synchronisation est deja en cours.");
  }

  try {
    return await callback();
  } finally {
    await prisma.synchronizationLock.deleteMany({ where: { shop, name, token } });
  }
}
