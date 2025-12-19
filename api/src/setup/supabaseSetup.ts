import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const BUCKET_NAME = 'rental-agreements'

async function ensureBucket() {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data: buckets, error: listErr } = await supabase.storage.listBuckets()
  if (listErr) {
    console.error('Failed to list buckets:', listErr.message)
    process.exit(1)
  }

  const exists = buckets?.some(b => b.name === BUCKET_NAME)
  if (exists) {
    console.log(`✅ Storage bucket "${BUCKET_NAME}" already exists`)
    return
  }

  const { data: created, error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: '20MB',
    allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf']
  })

  if (createErr) {
    console.error('Failed to create bucket:', createErr.message)
    process.exit(1)
  }

  console.log(`✅ Created public storage bucket "${created?.name}"`)
}

async function main() {
  console.log('🚀 Supabase setup starting...')
  await ensureBucket()
  console.log('🎉 Supabase setup completed successfully')
}

main().catch(err => {
  console.error('Supabase setup error:', err)
  process.exit(1)
})

