'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadMenuImage } from '@/lib/admin-actions'
import { toast } from 'sonner'

interface Props {
  value?: string
  onChange: (url: string | undefined) => void
}

/** Shared dish-photo uploader used by both the Add and Edit menu forms. */
export function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  const pick = () => inputRef.current?.click()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    if (!/^image\/(jpe?g|png|webp|gif)$/.test(file.type)) {
      return toast.error('Please choose a JPG, PNG, WebP or GIF image')
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image must be 5MB or smaller')
    }
    setUploading(true)
    try {
      const { url } = await uploadMenuImage(file)
      onChange(url)
      toast.success('Photo uploaded')
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />

      {value ? (
        <div className="flex items-start gap-4">
          {loadFailed ? (
            <div className="w-32 h-32 rounded-xl border border-red-200 bg-red-50 flex flex-col items-center justify-center text-center px-2">
              <X className="w-5 h-5 text-red-500 mb-1" />
              <span className="text-[10px] text-red-600 leading-tight">Image won&apos;t load — re-upload</span>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={value}
              alt="Dish preview"
              onError={() => setLoadFailed(true)}
              className="w-32 h-32 object-cover rounded-xl border border-border bg-muted"
            />
          )}
          <div className="space-y-2">
            <Button size="sm" variant="outline" onClick={() => { setLoadFailed(false); pick() }} loading={uploading}>
              Replace photo
            </Button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-brand-red/40 transition-colors cursor-pointer disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-3 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          )}
          <p className="text-sm font-medium text-foreground">
            {uploading ? 'Uploading…' : 'Upload dish photo'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP up to 5MB</p>
        </button>
      )}
    </div>
  )
}
