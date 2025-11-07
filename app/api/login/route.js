import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


// POST /api/login - Verify user credentials
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

   

    // Check if user exists
    if (!user) {
        console.log('User not found for email:', email);
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if password matches (plain text comparison)
    if (user.password !== password) {
         console.log(email, password);
        console.log('Invalid password for email:', email);
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Credentials are correct
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
        
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed', details: error.message },
      { status: 500 }
    );
  }
}
