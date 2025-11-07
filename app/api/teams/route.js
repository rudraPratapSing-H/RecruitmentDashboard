import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/teams?name=searchTerm - Search for teams by name
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Team name parameter is required' },
        { status: 400 }
      );
    }

    // Search for teams in ppt_submissions table
    const teams = await prisma.ppt_submissions.findMany({
      where: {
        team_name: {
          contains: name
        }
      }
    });

    return NextResponse.json({
      query: name,
      results: teams,
      totalResults: teams.length
    });
  } catch (error) {
    console.error('Team search error:', error);
    return NextResponse.json(
      { error: 'Failed to search teams', details: error.message },
      { status: 500 }
    );
  }
}
