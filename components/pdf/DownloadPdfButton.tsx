'use client'
import { BlobProvider } from '@react-pdf/renderer'
import { RentalAgreementDocument } from './RentalAgreementDocument'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export default function DownloadPdfButton({ data }: { data: any }) {
  return (
    <BlobProvider document={<RentalAgreementDocument data={data} />}> 
      {({ url, loading, error }) => (
        <a
          href={url ?? '#'}
          download="rental-agreement.pdf"
          className={cn(buttonVariants({ variant: 'secondary' }), (loading || !url) && 'opacity-50 pointer-events-none')}
        >
          {loading ? 'Preparing…' : 'Download PDF'}
        </a>
      )}
    </BlobProvider>
  )
}