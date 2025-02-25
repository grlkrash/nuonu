import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProfileById } from '@/lib/services/profiles'
import ProfileForm from '@/components/profile/profile-form'

export const metadata = {
  title: 'Your Profile | Nuonu',
  description: 'Manage your artist profile to improve opportunity matching',
}

export default async function ProfilePage() {
  const user = await getCurrentUser().catch(() => null)
  
  if (!user) {
    redirect('/signin?redirect=/profile')
  }
  
  const profile = await getProfileById(user.id).catch(() => null)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Your Artist Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Complete your profile to get better opportunity matches
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <ProfileForm user={user} initialProfile={profile} />
        </div>
      </div>
    </div>
  )
} 