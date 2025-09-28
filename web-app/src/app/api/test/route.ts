// src/app/api/test/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello from /api/test' });
}
