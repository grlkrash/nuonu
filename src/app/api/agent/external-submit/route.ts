import { NextResponse } from 'next/server'
import { submitExternalGrantApplication } from '@/lib/services/ai-agent'
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
    const { artistId, opportunityId, applicationData } = body

    // Verify that the authenticated user is the artist
    if (session.user.id !== artistId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Submit the external application using Browser Base
    const result = await submitExternalGrantApplication(
      artistId,
      opportunityId,
      applicationData
    )

    // Return the result
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in external-submit API route:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    )
  }
} 