import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import Question from '../../../../models/Question';

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const questions = await Question.find({ published: true });
    return NextResponse.json(questions);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
