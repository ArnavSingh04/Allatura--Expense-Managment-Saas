import { NextResponse } from 'next/server'

export function routeRedirect(redirectURL: string) {
  return new NextResponse(
    JSON.stringify({ redirectURL: redirectURL }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
};

export function toResponse(data: unknown) {
  return new NextResponse(
    JSON.stringify({ data: data }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
}
