'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from './supabase/client';
import type { Technique } from './types';

export const techniquesKey = ['techniques'] as const;

export function useTechniques() {
  return useQuery({
    queryKey: techniquesKey,
    queryFn: async (): Promise<Technique[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('techniques')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Technique[];
    },
    staleTime: 30_000,
  });
}

export function useTechnique(id: string) {
  return useQuery({
    queryKey: ['technique', id],
    queryFn: async (): Promise<Technique> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('techniques')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Technique;
    },
  });
}

export function useToggleFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; field: 'is_favorite' | 'is_learned'; value: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('techniques')
        .update({ [vars.field]: vars.value })
        .eq('id', vars.id);
      if (error) throw error;
    },
    onMutate: async ({ id, field, value }) => {
      await qc.cancelQueries({ queryKey: techniquesKey });
      const prev = qc.getQueryData<Technique[]>(techniquesKey);
      if (prev) {
        qc.setQueryData<Technique[]>(
          techniquesKey,
          prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(techniquesKey, ctx.prev);
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: techniquesKey });
      qc.invalidateQueries({ queryKey: ['technique', vars.id] });
    },
  });
}

export function useDeleteTechnique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('techniques').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: techniquesKey });
      qc.invalidateQueries({ queryKey: ['technique', id] });
    },
  });
}
