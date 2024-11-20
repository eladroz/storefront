import type { AstroCookies } from 'astro';
import jwt from 'jsonwebtoken';

type TokenPayload =
	| undefined
	| {
			loggedIn: boolean;
	  };

const BASIC_PASSWORD = import.meta.env.BASIC_PASSWORD;
const JWT_SECRET = import.meta.env.JWT_SECRET;
const SESSION_COOKIE_NAME = 'basic_session';

const validations = [
	{ k: 'JWT_SECRET', v: JWT_SECRET, minLength: 32 },
	{ k: 'BASIC_PASSWORD', v: BASIC_PASSWORD, minLength: 8 },
];

export function authConfigError() {
	for (const { k, v, minLength } of validations) {
		const actualLength = v?.length || 0;
		if (actualLength < minLength) {
			return `${k} should be at least ${minLength} characters long, is ${actualLength} characters`;
		}
	}
	return undefined;
}

export function verifyPassword(input: string): boolean {
	if (authConfigError()) return false;
	return input === BASIC_PASSWORD;
}

export function verifySession(cookies: AstroCookies) {
	if (authConfigError()) return false;
	const token = cookies.get(SESSION_COOKIE_NAME)?.value;
	if (!token) return false;

	const decoded = jwt.verify(token, JWT_SECRET!) as TokenPayload;
	const result = !!decoded && decoded.loggedIn === true;
	console.log('Session verified:', result);
	return result;
}

export function createVerifiedSession(cookies: AstroCookies) {
	if (authConfigError()) return;

	const info: TokenPayload = { loggedIn: true };
	const token = jwt.sign(info, JWT_SECRET!, {
		expiresIn: '24h',
	});
	cookies.set(SESSION_COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
	});
}

export function clearSession(cookies: AstroCookies) {
	cookies.delete(SESSION_COOKIE_NAME);
}
