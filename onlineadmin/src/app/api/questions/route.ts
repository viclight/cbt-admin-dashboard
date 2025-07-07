import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET: List all questions
export async function GET() {
  const client = await clientPromise;
  const db = client.db();
  const questions = await db.collection('questions').find({}).toArray();
  return NextResponse.json({ questions });
}

// POST: Add a new question
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subject, questionText, options, correctAnswer, difficulty } = body;
  if (!subject || !questionText || !options || !correctAnswer) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection('questions').insertOne({ subject, questionText, options, correctAnswer, difficulty });
  return NextResponse.json({ insertedId: result.insertedId });
}

// DELETE: Remove a question by ID
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  await db.collection('questions').deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ success: true });
}

// PUT: Update a question by ID
export async function PUT(req: NextRequest) {
  const { id, ...update } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  await db.collection('questions').updateOne({ _id: new ObjectId(id) }, { $set: update });
  return NextResponse.json({ success: true });
}
