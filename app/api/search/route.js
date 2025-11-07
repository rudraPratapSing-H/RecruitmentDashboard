import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/search?name=searchTerm - Search recruitment_submissions table
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Name parameter is required' },
        { status: 400 }
      );
    }

    // Search only in recruitment_submissions table
    const candidates = await prisma.recruitment_submissions.findMany({
      where: { name: { contains: name } }
    });

    return NextResponse.json({
      query: name,
      results: {
        recruitment_submissions: candidates
      },
      totalResults: candidates.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search', details: error.message },
      { status: 500 }
    );
  }
}