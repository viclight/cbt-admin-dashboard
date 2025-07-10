import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET: List all results
export async function GET() {
  const client = await clientPromise;
  const db = client.db();
  const results = await db.collection('results').find({}).toArray();
  return NextResponse.json({ results });
}

// POST: Add a new result
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user, subject, score, totalQuestions, timeSpent, completedAt } = body;
  if (!user || !subject || score == null || !totalQuestions || !completedAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection('results').insertOne({ user, subject, score, totalQuestions, timeSpent, completedAt });
  return NextResponse.json({ insertedId: result.insertedId });
}
