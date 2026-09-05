import {NextResponse} from 'next/server';import type {NextRequest} from 'next/server';import {verifySessionToken} from './lib/session-token';
const COOKIE_NAME='expoline_session';
export async function middleware(request:NextRequest){const {pathname}=request.nextUrl;if(pathname==='/login'||pathname.startsWith('/api/auth'))return NextResponse.next();const session=await verifySessionToken(request.cookies.get(COOKIE_NAME)?.value);if(!session){const url=request.nextUrl.clone();url.pathname='/login';url.searchParams.set('callbackUrl',pathname);return NextResponse.redirect(url)}return NextResponse.next()}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
