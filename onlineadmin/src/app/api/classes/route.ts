import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET: List all classes
export async function GET() {
  const client = await clientPromise;
  const db = client.db();
  const classes = await db.collection('classes').find({}).toArray();
  return NextResponse.json({ classes });
}

// POST: Add a new class
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description } = body;
  if (!name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection('classes').insertOne({ name, description });
  return NextResponse.json({ insertedId: result.insertedId });
}

// PUT: Update a class by ID
export async function PUT(req: NextRequest) {
  const { id, ...update } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  await db.collection('classes').updateOne({ _id: new ObjectId(id) }, { $set: update });
  return NextResponse.json({ success: true });
}

// DELETE: Remove a class by ID
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  await db.collection('classes').deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ success: true });
}
