import {NextResponse} from 'next/server';

export function GET() {
  return NextResponse.json({message: 'Welcome to your backend API'});
}
