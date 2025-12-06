import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export default function HomePage() {
  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative h-56 md:h-full">
              <Image src="/SriRent%20Bike.jpg" alt="SriRent Bike" fill priority className="object-cover" />
            </div>
            <div className="p-6 md:p-10 flex flex-col justify-center gap-4">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">SriRent Bike</h1>
              <p className="text-sm md:text-base text-muted-foreground">Scan, check in, and ride. Digital agreements with fast admin review and PDF export.</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link href="/check-in" className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}>Start Guest Check-In</Link>
                <Link href="/admin" className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }))}>Admin Dashboard</Link>
              </div>
              <div className="text-xs text-muted-foreground">Tip: Place a QR code in-store that links to <span className="font-mono">/check-in</span>.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
