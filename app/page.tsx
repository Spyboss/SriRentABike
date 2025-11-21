import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">SriRent Bike</h1>
      <div className="flex items-center gap-4">
        <Link className="px-4 py-2 rounded bg-blue-600 text-white" href="/check-in">Guest Check-In</Link>
        <Link className="px-4 py-2 rounded bg-gray-800 text-white" href="/admin">Admin Dashboard</Link>
      </div>
    </div>
  )
}