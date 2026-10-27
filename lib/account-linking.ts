// Decides which user in your database a Google identity belongs to: find, link, or create.
// Uses db only.

import "server-only"

import { Prisma } from "@/lib/generated/prisma/client"
import { db } from "@/lib/db"
import type { GoogleIdentity } from "@/lib/google-oauth"

async function resolveUserId(identity: GoogleIdentity): Promise<string> {
	const existingAccount = await db.account.findUnique({
		where: {
			provider_providerAccountId: {
				provider: "google",
				providerAccountId: identity.googleId,
			}
		}
	})
	if (existingAccount) return existingAccount.userId

	const existingUser = await db.user.findUnique({ where: { email: identity.email } })
	if (existingUser) {
		await db.account.create({
			data: {
				userId: existingUser.id,
				provider: "google",
				providerAccountId: identity.googleId,
			}
		})
		return existingUser.id
	}

	const user = await db.user.create({
		data: {
			email: identity.email,
			name: identity.name,
			image: identity.picture,
			accounts: {
				create: { provider: "google", providerAccountId: identity.googleId },
			},
			select: { id: true },
		}
	})
	return user.id
}

export async function findOrCreateUserForGoogle(identity: GoogleIdentity) {
	try {
		return await resolveUserId(identity)
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return resolveUserId(identity)
		throw error
	}
}