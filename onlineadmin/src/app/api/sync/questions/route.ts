import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import Question from '../../../../models/Question';
import NextCors from 'nextjs-cors';

export async function GET(req: NextRequest) {
  // Enable CORS
  await NextCors(req, {
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    optionsSuccessStatus: 200,
  });

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');
  try {
    const filter: any = { published: true };
    if (subject) {
      filter.subject = subject;
    }
    const questions = await Question.find(filter);
    return NextResponse.json(questions);
  } catch {
    return new Response('Failed to fetch published questions', { status: 500 });
  }
}
