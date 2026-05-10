import { createPublicClient } from '@/lib/supabase/public';

export interface Secteur {
  code: string;
  label: string;
  ordre: number;
  actif: boolean;
}

export async function getAllSecteurs(): Promise<Secteur[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('secteurs_activite')
    .select('code, label, ordre, actif')
    .eq('actif', true)
    .order('ordre');
  return (data ?? []) as Secteur[];
}
