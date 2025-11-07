import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/users - Get all users
export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    const user = await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
