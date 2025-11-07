import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/candidates/summary?email=candidate@example.com&userId=1 - Get all scores for a candidate
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    // Check authorization - only userId 1 or 2 can access
    if (!userId || (userId !== '1' && userId !== '2')) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to access this page' },
        { status: 403 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Get all scores for this candidate
    const scores = await prisma.interview_scores.findMany({
      where: { candidateEmail: email },
      orderBy: { createdAt: 'desc' }
    });

    if (scores.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scores found for this candidate',
        data: null
      });
    }

    // Calculate statistics for each score type
    const totalScores = scores.length;
    
    // Numeric score types (1-5 stars)
    const numericScoreTypes = ['confidence', 'dressing_sense', 'dedication', 'experience', 'priority'];
    const averages = {};
    const maxScores = {};
    const minScores = {};
    
    // Calculate stats for numeric scores only
    numericScoreTypes.forEach(type => {
      const validScores = scores.filter(s => s[type] !== null && s[type] !== undefined && s[type] > 0).map(s => s[type]);
      if (validScores.length > 0) {
        averages[type] = (validScores.reduce((sum, s) => sum + s, 0) / validScores.length).toFixed(2);
        maxScores[type] = Math.max(...validScores);
        minScores[type] = Math.min(...validScores);
      } else {
        averages[type] = null;
        maxScores[type] = null;
        minScores[type] = null;
      }
    });
    
    // Calculate overall average (average of all 5 star ratings)
    const allAverages = Object.values(averages).filter(v => v !== null).map(v => parseFloat(v));
    const overallAverage = allAverages.length > 0 ? (allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(2) : 0;
    
    // Collect all preferred vertical values (text field)
    const preferredVerticals = scores
      .filter(s => s.preferred_vertical && s.preferred_vertical.trim() !== '')
      .map(s => ({
        vertical: s.preferred_vertical,
        interviewer: s.interviewer,
        createdAt: s.createdAt
      }));

    return NextResponse.json({
      success: true,
      candidate: {
        name: scores[0].candidateName,
        email: scores[0].candidateEmail,
        contactNumber: scores[0].contactNumber,
        vertical: scores[0].vertical
      },
      statistics: {
        totalInterviews: totalScores,
        averageScore: parseFloat(overallAverage),
        averageScores: averages,
        maxScores,
        minScores,
        preferredVerticals: preferredVerticals
      },
      scores: scores
    });

  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch summary', details: error.message },
      { status: 500 }
    );
  }
}
