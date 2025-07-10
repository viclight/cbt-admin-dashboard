import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  const { action, email, password, fullName, role: reqRole } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db();
  const admins = db.collection('admins');

  if (action === 'register') {
    const existing = await admins.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 409 });
    }
    const hash = await bcrypt.hash(password, 10);
    const role = reqRole || 'admin';
    await admins.insertOne({ email, password: hash, fullName, role });
    return NextResponse.json({ message: 'Admin registered' });
  }

  if (action === 'login') {
    const admin = await admins.findOne({ email });
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = jwt.sign({ adminId: admin._id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '1d' });
    return NextResponse.json({ token, admin: { email: admin.email, fullName: admin.fullName, role: admin.role } });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
