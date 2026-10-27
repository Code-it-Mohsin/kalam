// Protects the module 
import "server-only"

import * as argon2 from "argon2" // Password Hashing library
import { SignJWT, jwtVerify } from "jose" // Check and issue JWT token
import { randomBytes, createHash } from "node:crypto" // To generate random data and to hash any data

/*
GOALS OF THIS FILE
Password Security
Access Token - Check if user is authenticated
Refresh Token - Regenerate Access Token when it expires
*/


// => Load the secret from .env and validate the existence and its length

const secret = process.env.ACCESS_TOKEN_SECRET

if (!secret || secret.length < 32) {
	throw new Error("Access token configured is invalid")
}

// => convert the secret into bytes, algorithyms run of byte not on strings

const secretBytes = new TextEncoder().encode(secret)

const ISSUER = "kalam"
const AUDIENCE = "kalam-api"

// func to hash the argon2 password
export async function hashPassword(password: string) {
	return await argon2.hash(password)
}

// DUMMY PASSWORD
export function getDummy() {
	return argon2.hash(randomBytes(12).toString("hex"))
}

// VERIFY PASSWORD
export async function verifyPassword(hashPassFromDB: string | null | undefined, password: string) {
	try {
		if (!hashPassFromDB) {
			let dummyPass = await getDummy()
			await argon2.verify(dummyPass, password)
			return false
		} // intentional delay for empty passwords
		return await argon2.verify(hashPassFromDB, password)

	}
	catch (error) { return false }
}

// CREATE ACCESS TOKEN
export async function createAccessToken(userId: string, sidFromLogin: string) {
	return new SignJWT({ sid: sidFromLogin }) // creating token using session Id for multiple sessions can have different access Token
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(userId)
		.setIssuer(ISSUER)
		.setAudience(AUDIENCE)
		.setIssuedAt()
		.setExpirationTime(process.env.TTL_SEC_ACCESS_TOKENS!)
		.sign(secretBytes)
}

// VERIFY ACCESS TOKEN
export async function verifyAccessToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, secretBytes, {
			algorithms: ["HS256"],
			issuer: ISSUER,
			audience: AUDIENCE,
		})
		if (!payload.sub) return null

		return {
			userId: payload.sub,
			sessionId: typeof payload.sid === "string" ? payload.sid : null,
		}
	} catch (error) {
		console.log(error)
		return null
	}
}

// CREATING REFRESH TOKEN
export async function createRefreshToken() {
	return randomBytes(32).toString("base64url")
}

// HASH REFRESH TOKEN
export async function hashRefreshToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}

/*
LEARNINGS
=> Algorithyms used for these libraries are one way, and generate an output which countless other combinations can produce
=> Argon2 is slow by design to make it difficult for hacker to crack password
=> SHA-256 - Refresh Tokens are already long, random and unpredictable so fast hash
=> Create issuer and audience ----> Because the payments gateway will generate its own Access Token, so that a stolen Access token doesn't effect the payments, etc
*/