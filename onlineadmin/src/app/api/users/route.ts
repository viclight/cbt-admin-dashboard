import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET: List all users
export async function GET() {
  const client = await clientPromise;
  const db = client.db();
  const users = await db.collection('users').find({}).toArray();
  return NextResponse.json({ users });
}

// POST: Add a new user
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, className, role } = body;
  if (!name || !email || !className || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection('users').insertOne({ name, email, className, role });
  return NextResponse.json({ insertedId: result.insertedId });
}
