import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_IPS = ['210.217.92.1']

export function middleware(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    ''

  if (!ALLOWED_IPS.includes(ip)) {
    return new NextResponse('Access Denied', { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
