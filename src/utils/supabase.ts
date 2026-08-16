import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueueItem, ServiceItem, PitItem, StoreSettings } from '../types.ts';

const SUPABASE_STORAGE_KEY = 'antrean_supabase_creds_v1';

export interface StoredSupabaseCreds {
  url: string;
  anonKey: string;
}

export function getSupabaseCredentials(): StoredSupabaseCreds {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = (metaEnv.VITE_SUPABASE_URL as string) || '';
  const envKey = (metaEnv.VITE_SUPABASE_ANON_KEY as string) || '';

  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey
      };
    }
  } catch (err) {
    console.warn('Failed to read Supabase credentials from local storage', err);
  }

  return { url: envUrl, anonKey: envKey };
}

export function saveSupabaseCredentials(creds: StoredSupabaseCreds) {
  try {
    localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(creds));
    cachedClient = null; // reset client cache
  } catch (err) {
    console.error('Failed to save Supabase credentials', err);
  }
}

let cachedClient: SupabaseClient | null = null;
let lastClientUrl = '';
let lastClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const creds = getSupabaseCredentials();
  if (!creds.url || !creds.anonKey) {
    return null;
  }

  // Sanitize URL to ensure valid protocol
  let sanitizedUrl = creds.url.trim();
  if (!sanitizedUrl.startsWith('http://') && !sanitizedUrl.startsWith('https://')) {
    sanitizedUrl = `https://${sanitizedUrl}`;
  }

  if (cachedClient && lastClientUrl === sanitizedUrl && lastClientKey === creds.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(sanitizedUrl, creds.anonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    lastClientUrl = sanitizedUrl;
    lastClientKey = creds.anonKey;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; tablesCount?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'URL atau Anon Key Supabase belum diisi.' };
  }

  try {
    // Try querying queues table with limit 1
    const { error } = await client.from('queues').select('id').limit(1);
    if (error) {
      // If table does not exist, let user know schema is required
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: 'Terhubung ke Supabase, namun tabel belum dibuat. Silakan jalankan script SQL Schema.'
        };
      }
      return { success: false, message: `Error Supabase: ${error.message}` };
    }

    return { success: true, message: 'Koneksi ke Supabase Realtime aktif dan berhasil!' };
  } catch (err: any) {
    return { success: false, message: `Gagal terhubung: ${err?.message || 'Periksa koneksi internet / kredensial'}` };
  }
}

// ----------------- DATA SYNC APIS -----------------

export async function syncQueuesFromSupabase(): Promise<QueueItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('queues')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as QueueItem[]) || [];
  } catch (err) {
    console.warn('Sync queues from Supabase error:', err);
    return null;
  }
}

export async function upsertQueueToSupabase(item: QueueItem): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('queues').upsert(item, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Upsert queue to Supabase error:', err);
    return false;
  }
}

export async function deleteQueueFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('queues').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Delete queue from Supabase error:', err);
    return false;
  }
}

export async function syncServicesFromSupabase(): Promise<ServiceItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('services').select('*');
    if (error) throw error;
    return (data as ServiceItem[]) || [];
  } catch (err) {
    console.warn('Sync services from Supabase error:', err);
    return null;
  }
}

export async function upsertServiceToSupabase(item: ServiceItem): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('services').upsert(item, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Upsert service to Supabase error:', err);
    return false;
  }
}

export async function deleteServiceFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('services').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Delete service from Supabase error:', err);
    return false;
  }
}

export async function syncPitsFromSupabase(): Promise<PitItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('pits').select('*');
    if (error) throw error;
    return (data as PitItem[]) || [];
  } catch (err) {
    console.warn('Sync pits from Supabase error:', err);
    return null;
  }
}

export async function upsertPitToSupabase(item: PitItem): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('pits').upsert(item, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Upsert pit to Supabase error:', err);
    return false;
  }
}

export async function deletePitFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('pits').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Delete pit from Supabase error:', err);
    return false;
  }
}

export async function syncSettingsFromSupabase(): Promise<StoreSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('store_settings').select('*').limit(1).single();
    if (error) throw error;
    if (data) {
      return {
        nama_usaha: data.nama_usaha || 'ANTREAN',
        tagline: data.tagline || '',
        alamat: data.alamat || '',
        telepon: data.telepon || '',
        footer_struk: data.footer_struk || '',
        auto_voice: data.auto_voice ?? true
      };
    }
    return null;
  } catch (err) {
    console.warn('Sync settings from Supabase error:', err);
    return null;
  }
}

export async function upsertSettingsToSupabase(settings: StoreSettings): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const payload = {
      id: 'main_settings',
      ...settings
    };
    const { error } = await client.from('store_settings').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Upsert settings to Supabase error:', err);
    return false;
  }
}

// ----------------- SQL SCHEMA HELPER -----------------
export const SUPABASE_SQL_SCHEMA = `-- 1. Buat Tabel Antrean (Queues)
CREATE TABLE IF NOT EXISTS queues (
  id TEXT PRIMARY KEY,
  nomor_antrian TEXT NOT NULL,
  nama_pemohon TEXT NOT NULL,
  tipe_motor TEXT NOT NULL,
  layanan_id TEXT NOT NULL,
  total_biaya NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  pit_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  washed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  cashier_name TEXT
);

-- 2. Buat Tabel Layanan & Tarif (Services)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  nama_layanan TEXT NOT NULL,
  deskripsi TEXT,
  harga_kecil NUMERIC NOT NULL DEFAULT 0,
  harga_besar NUMERIC NOT NULL DEFAULT 0,
  harga_mobil NUMERIC NOT NULL DEFAULT 0,
  durasi_menit INT NOT NULL DEFAULT 20,
  badge TEXT
);

-- 3. Buat Tabel Pit Cuci (Pits)
CREATE TABLE IF NOT EXISTS pits (
  id TEXT PRIMARY KEY,
  nama_pit TEXT NOT NULL,
  tipe_pit TEXT DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'tersedia',
  keterangan TEXT
);

-- 4. Buat Tabel Pengaturan Toko (Store Settings)
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'main_settings',
  nama_usaha TEXT NOT NULL DEFAULT 'ANTREAN',
  tagline TEXT,
  alamat TEXT,
  telepon TEXT,
  footer_struk TEXT,
  auto_voice BOOLEAN DEFAULT TRUE
);

-- 5. Aktifkan Row Level Security (RLS) & Berikan Akses Publik
ALTER TABLE queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pits ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access queues" ON queues;
CREATE POLICY "Public access queues" ON queues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access services" ON services;
CREATE POLICY "Public access services" ON services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access pits" ON pits;
CREATE POLICY "Public access pits" ON pits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access store_settings" ON store_settings;
CREATE POLICY "Public access store_settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);

-- 6. Aktifkan Supabase Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE queues;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE pits;
ALTER PUBLICATION supabase_realtime ADD TABLE store_settings;
`;
