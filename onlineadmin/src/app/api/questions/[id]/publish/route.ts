import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/dbConnect';
import Question from '../../../../../../models/Question';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;
  try {
    const question = await Question.findByIdAndUpdate(id, { published: true }, { new: true });
    if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, question });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
