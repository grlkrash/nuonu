import { NextResponse } from 'next/server'
import { checkApplicationStatus } from '@/lib/services/browser-base'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { artistId, opportunityId, submissionId } = body

    // Verify that the authenticated user is the artist
    if (session.user.id !== artistId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Check the application status using Browser Base
    const result = await checkApplicationStatus(
      artistId,
      opportunityId,
      submissionId
    )

    // Return the result
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in check-status API route:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'unknown'
      },
      { status: 500 }
    )
  }
} 