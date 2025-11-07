import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/searchVertical?vertical=Marketing - Search by vertical in recruitment_submissions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vertical = searchParams.get('vertical');

    if (!vertical) {
      return NextResponse.json(
        { success: false, error: 'Vertical parameter is required' },
        { status: 400 }
      );
    }

    // Search across all vertical fields (MySQL doesn't support mode: 'insensitive', so we use contains which is case-insensitive by default in MySQL)
    const candidates = await prisma.recruitment_submissions.findMany({
      where: {
        OR: [
          { vertical_1: { contains: vertical } },
          { vertical_2: { contains: vertical } },
          { vertical_2_2: { contains: vertical } },
          { vertical_2_3: { contains: vertical } },
          { vertical_2_4: { contains: vertical } },
          { vertical_2_5: { contains: vertical } },
          { vertical_2_6: { contains: vertical } },
          { vertical_2_7: { contains: vertical } },
          { vertical_2_8: { contains: vertical } },
          { vertical_2_9: { contains: vertical } }
        ]
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      query: vertical,
      results: candidates,
      totalResults: candidates.length
    });

  } catch (error) {
    console.error('Vertical search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search by vertical', details: error.message },
      { status: 500 }
    );
  }
}
