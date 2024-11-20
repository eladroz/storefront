import type { APIContext, AstroCookies } from 'astro';
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

export function verifyAPICall(context: APIContext) {
	const BEARER_TOKEN_REGEX = /^bearer\s+(?<token>[^\s]+)$/i;
	const authHeaderValue = context.request.headers.get('Authorization');
	if (authHeaderValue) {
		const bearerToken = authHeaderValue.trim().match(BEARER_TOKEN_REGEX)?.groups?.token;
		return verifyToken(bearerToken);
	} else {
		return verifySession(context.cookies);
	}
}

export function verifySession(cookies: AstroCookies) {
	if (authConfigError()) return false;
	const token = cookies.get(SESSION_COOKIE_NAME)?.value;
	const result = verifyToken(token);
	console.log('Session verified:', result);
	return result;
}

function verifyToken(token?: string) {
	if (!token) return false;
	try {
		const decoded = jwt.verify(token, JWT_SECRET!) as TokenPayload;
		const result = !!decoded && decoded.loggedIn === true;
		return result;
	} catch (e) {
		console.error(`verifyToken: ${(e as Error).message}`);
		return false;
	}
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
