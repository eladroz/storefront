import type { AstroCookies } from 'astro';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, BASIC_PASSWORD } from 'astro:env/server';

const SESSION_COOKIE_NAME = 'session';
const JWT_SECRET_MIN_LENGTH = 16;
const PASSWORD_MIN_LENGTH = 6;

type TokenPayload =
	| undefined
	| {
			loggedIn: boolean;
	  };

export function authConfigError() {
	if (!JWT_SECRET || JWT_SECRET.length < JWT_SECRET_MIN_LENGTH) {
		return `JWT_SECRET should be set to at least ${JWT_SECRET_MIN_LENGTH} characters`;
	} else if (!BASIC_PASSWORD || BASIC_PASSWORD.length < PASSWORD_MIN_LENGTH) {
		return `BASIC_PASSWORD should be set to at least ${PASSWORD_MIN_LENGTH} characters`;
	} else {
		return;
	}
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
