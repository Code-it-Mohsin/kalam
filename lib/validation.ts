// Defines what valid signup and signin data looks like. Reusable in routes and forms.

import { z } from 'zod'

const emailSchema = z.string().trim().toLowerCase().email().max(254)

export const signupSchema = z.object({
    name: z.string().trim().min(1).max(50),
    email: emailSchema,
    password: z.string().min(8).max(128),
    conf_password: z.string()
})

export const signinSchema = z.object({
    email: emailSchema,
    password: z.string().min(8).max(128),
})