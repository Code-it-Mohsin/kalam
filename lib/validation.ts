// Defines what valid signup and signin data looks like. Reusable in routes and forms.

import { z } from 'zod'

const emailSchema = z.string().trim().toLowerCase().email().max(254)

const passwordSchema = z.string().min(8).max(128)

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different",
  path: ["newPassword"],
});

export const signupSchema = z.object({
    name: z.string().trim().min(1).max(50),
    email: emailSchema,
    password: passwordSchema,
    conf_password: z.string()
})

export const signinSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
})

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  parentId: z.string().cuid().nullable().optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  username: z.string().trim().min(3).max(30).optional(),
  image: z.string().url().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0);

export const settingsSchema = z.object({
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
  emailNotifications: z.boolean().optional(),
  publicProfile: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0);

const basePostSchema = z.object({
    title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).optional().nullable(),
  content: z.string().max(100000),
  coverImage: z.string().url().optional().nullable(),
})

export const createPostSchema = z.object({
  ...basePostSchema.shape,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  subjectIds: z.array(z.string().cuid()).optional().default([]),
});

export const postSchema = z.object({
  ...basePostSchema.shape,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  subjectIds: z.array(z.string().cuid()).optional(),
});