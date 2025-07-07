import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import Question from '../../../../models/Question';

export async function GET() {
  await dbConnect();
  try {
    const questions = await Question.find({ published: true });
    return NextResponse.json(questions);
  } catch {
    return new Response('Failed to fetch published questions', { status: 500 });
  }
}
