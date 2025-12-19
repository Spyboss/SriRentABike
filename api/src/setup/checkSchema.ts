import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function checkSchema() {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  console.log('🔎 Checking Supabase schema...')
  const tables = ['users', 'tourists', 'bikes', 'agreements', 'guest_links', 'audit_events']
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1)
    if (error) {
      console.log(`❌ Table "${t}" not accessible: ${error.message}`)
    } else {
      console.log(`✅ Table "${t}" OK (${data?.length ?? 0} rows sample)`)
    }
  }

  // Check bucket existence via a small list
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets()
  if (bucketErr) {
    console.log(`❌ Storage buckets not accessible: ${bucketErr.message}`)
  } else {
    const names = buckets?.map(b => b.name) || []
    console.log(`🗃️ Buckets: ${names.join(', ') || '(none)'}`)
  }
}

checkSchema().then(() => {
  console.log('✅ Supabase integration check complete')
}).catch(err => {
  console.error('Supabase integration check failed:', err)
  process.exit(1)
})

