// src/middleware.ts
import { NextResponse } from 'next/server';

// Middleware deshabilitado para desarrollo
export function middleware() {
  // TODO: Habilitar autenticación en producción
  return NextResponse.next(); // Permite acceso a todas las rutas
}

// Comentar todo el resto
/*
const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];

export function middleware(request: NextRequest) {
  const currentUser = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  if (protectedRoutes.some(route => pathname.startsWith(route)) && !currentUser) {
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    return response;
  }

  if (currentUser && publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
*/

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};