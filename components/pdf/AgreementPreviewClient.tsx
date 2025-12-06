'use client'
import { PDFViewer } from '@react-pdf/renderer'
import { RentalAgreementDocument } from './RentalAgreementDocument'
import DownloadPdfButton from './DownloadPdfButton'
import { Button } from '@/components/ui/button'
import ErrorBoundary from './ErrorBoundary'

export default function AgreementPreviewClient({ data }: { data: any }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div />
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()}>Print</Button>
          <DownloadPdfButton data={data} />
        </div>
      </div>
      <div className="h-[85vh]">
        <ErrorBoundary>
          <PDFViewer width="100%" height="100%">
            <RentalAgreementDocument data={data} />
          </PDFViewer>
        </ErrorBoundary>
      </div>
    </div>
  )
}
