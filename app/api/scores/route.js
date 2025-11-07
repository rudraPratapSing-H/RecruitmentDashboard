import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/scores - Add a new score
export async function POST(request) {
  try {
    const { 
      candidateName, 
      candidateEmail, 
      contactNumber, 
      vertical, 
      confidence,
      dressing_sense,
      dedication,
      experience,
      preferred_vertical,
      priority,
      interviewer,
      feedback 
    } = await request.json();

    // Validate required fields
    if (!candidateName || !candidateEmail || !interviewer) {
      return NextResponse.json(
        { success: false, error: 'candidateName, candidateEmail, and interviewer are required' },
        { status: 400 }
      );
    }

    // Validate score ranges (1-5 stars, 0 means not rated)
    // Note: preferred_vertical is now a text field, not a score
    const scores = { confidence, dressing_sense, dedication, experience, priority };
    for (const [key, value] of Object.entries(scores)) {
      if (value !== null && value !== undefined && (value < 0 || value > 5)) {
        return NextResponse.json(
          { success: false, error: `${key} must be between 0 and 5 (0 = not rated, 1-5 = star rating)` },
          { status: 400 }
        );
      }
    }
    
    // Check if at least one score is provided (greater than 0)
    const hasAnyScore = Object.values(scores).some(val => val > 0);
    if (!hasAnyScore) {
      return NextResponse.json(
        { success: false, error: 'At least one score must be provided (1-5 stars)' },
        { status: 400 }
      );
    }

    // Create new score entry
    const newScore = await prisma.interview_scores.create({
      data: {
        candidateName,
        candidateEmail,
        contactNumber: contactNumber || null,
        vertical: vertical || null,
        confidence: confidence ? parseInt(confidence) : null,
        dressing_sense: dressing_sense ? parseInt(dressing_sense) : null,
        dedication: dedication ? parseInt(dedication) : null,
        experience: experience ? parseInt(experience) : null,
        preferred_vertical: preferred_vertical || null,
        priority: priority ? parseInt(priority) : null,
        interviewer,
        feedback: feedback || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Score added successfully',
      data: newScore
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add score', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/scores - Get all scores (with optional filters)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateEmail = searchParams.get('email');
    const interviewer = searchParams.get('interviewer');
    const vertical = searchParams.get('vertical');

    // Build where clause based on filters
    const where = {};
    if (candidateEmail) where.candidateEmail = candidateEmail;
    if (interviewer) where.interviewer = { contains: interviewer };
    if (vertical) where.vertical = vertical;

    const scores = await prisma.interview_scores.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      count: scores.length,
      data: scores
    });

  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scores', details: error.message },
      { status: 500 }
    );
  }
}
