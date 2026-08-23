import { lazy, Suspense } from 'react'

const ArViewerLazy = lazy(() =>
  import('@/components/ArViewer').then((m) => ({ default: m.ArViewer })),
)

type LazyArViewerProps = {
  isOpen: boolean
  onClose: () => void
  imageSrc: string | null
}

export function LazyArViewer(props: LazyArViewerProps) {
  if (!props.isOpen) return null
  return (
    <Suspense fallback={null}>
      <ArViewerLazy {...props} />
    </Suspense>
  )
}
