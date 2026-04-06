import { redirect } from 'next/navigation'

export default function Home() {
  // Instantly redirect core domain directly to authentication
  redirect('/login')
}
