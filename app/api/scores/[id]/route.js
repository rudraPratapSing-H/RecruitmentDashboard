import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/scores/[id] - Get a specific score by ID
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);

    const score = await prisma.interview_scores.findUnique({
      where: { id }
    });

    if (!score) {
      return NextResponse.json(
        { success: false, error: 'Score not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: score
    });

  } catch (error) {
    console.error('Error fetching score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch score', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/scores/[id] - Update an existing score
export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const { score, feedback, vertical, contactNumber } = await request.json();

    // Build update data
    const updateData = {};
    if (score !== undefined) {
      if (score < 1 || score > 10) {
        return NextResponse.json(
          { success: false, error: 'Score must be between 1 and 10' },
          { status: 400 }
        );
      }
      updateData.score = parseInt(score);
    }
    if (feedback !== undefined) updateData.feedback = feedback;
    if (vertical !== undefined) updateData.vertical = vertical;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;

    const updatedScore = await prisma.interview_scores.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Score updated successfully',
      data: updatedScore
    });

  } catch (error) {
    console.error('Error updating score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update score', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/scores/[id] - Delete a score
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);

    await prisma.interview_scores.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Score deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete score', details: error.message },
      { status: 500 }
    );
  }
}
