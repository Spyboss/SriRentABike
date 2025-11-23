import CheckInForm from '@/components/forms/CheckInForm'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function CheckInPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm transition duration-200">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Guest Check-In</h2>
        </CardHeader>
        <CardContent>
          <CheckInForm />
        </CardContent>
      </Card>
    </div>
  )
}