'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/validations/user';
import bcrypt from 'bcryptjs';

// Update user profile
export async function updateProfile(userId: string, data: {
  name?: string;
  username?: string;
  bio?: string;
  image?: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (user.id !== userId && user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }

  const validated = updateProfileSchema.parse(data);

  // Check if username is taken
  if (validated.username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: validated.username,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      throw new Error('Username already taken');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: validated,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      role: true,
    },
  });

  // Revalidate profile page
  revalidatePath(`/profile/${updatedUser.username}`);

  return updatedUser;
}

// Change password
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || !dbUser.password) {
    throw new Error('User not found or no password set');
  }

  // Verify current password
  const isCorrectPassword = await bcrypt.compare(
    data.currentPassword,
    dbUser.password
  );

  if (!isCorrectPassword) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(data.newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return { success: true };
}

// Get user profile by username
export async function getUserProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

// Delete user account
export async function deleteAccount(userId: string, password: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (user.id !== userId) {
    throw new Error('Forbidden');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!dbUser || !dbUser.password) {
    throw new Error('User not found or no password set');
  }

  // Verify password
  const isCorrectPassword = await bcrypt.compare(password, dbUser.password);

  if (!isCorrectPassword) {
    throw new Error('Password is incorrect');
  }

  // Delete user (cascading delete will handle related records)
  await prisma.user.delete({
    where: { id: userId },
  });

  return { success: true };
}