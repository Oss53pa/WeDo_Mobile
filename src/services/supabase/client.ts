/**
 * Supabase Client
 * Configured for React Native with AsyncStorage session persistence
 */

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SCHEMA} from '@config/appConfig';

// WeDo lives in its own `wedo` Postgres schema (isolated from other apps sharing
// this Supabase project), so all `from()`/`rpc()` calls target that schema.
// Client kept untyped (queries return `any`) — generate types with
// `supabase gen types typescript --schema wedo` if strict typing is wanted.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: {schema: SUPABASE_SCHEMA},
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
