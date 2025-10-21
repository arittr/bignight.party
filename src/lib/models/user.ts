import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";

export async function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function exists(id: string) {
  const user = await prisma.user.findUnique({
    select: { id: true },
    where: { id },
  });
  return user !== null;
}

export async function findByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function create(data: Prisma.UserCreateInput) {
  return prisma.user.create({
    data,
  });
}

export async function update(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    data,
    where: { id },
  });
}

export async function deleteById(id: string) {
  return prisma.user.delete({
    where: { id },
  });
}
