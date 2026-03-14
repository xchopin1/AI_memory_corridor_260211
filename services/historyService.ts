import { supabase } from './supabaseClient';
import { AnalysisResult } from '../types';

export interface AnalysisRecord {
    id: string;
    user_id: string;
    title: string;
    theme: string;
    summary: string;
    content_snippet: string;
    full_result: AnalysisResult;
    created_at: string;
}

/**
 * Creates the required 'analysis_history' table. Note: Ideally this is run via the Supabase Dashboard SQL Editor once.
 * 
 * -- SQL for Supabase Editor --
 * create table if not exists public.analysis_history (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users not null,
 *   title text not null,
 *   theme text not null,
 *   summary text not null,
 *   content_snippet text not null,
 *   full_result jsonb not null,
 *   created_at timestamptz default now()
 * );
 * 
 * alter table public.analysis_history enable row level security;
 * 
 * create policy "Individuals can view their own history"
 *   on public.analysis_history for select
 *   using (auth.uid() = user_id);
 * 
 * create policy "Individuals can create their own history"
 *   on public.analysis_history for insert
 *   with check (auth.uid() = user_id);
 * 
 * create policy "Individuals can update their own history"
 *   on public.analysis_history for update
 *   using (auth.uid() = user_id);
 * 
 * create policy "Individuals can delete their own history"
 *   on public.analysis_history for delete
 *   using (auth.uid() = user_id);
 */

export const saveAnalysis = async (
    userId: string,
    originalContent: string,
    result: AnalysisResult
): Promise<{ data: AnalysisRecord | null; error: any }> => {
    const { data, error } = await supabase
        .from('analysis_history')
        .insert({
            user_id: userId,
            title: result.zh?.title || result.en?.title || result.title || 'Untitled',
            theme: result.theme,
            summary: result.zh?.summary || result.en?.summary || result.summary || '',
            content_snippet: originalContent.substring(0, 500),
            full_result: result,
        })
        .select()
        .single();

    return { data, error };
};

export const getAnalysisHistory = async (
    userId: string
): Promise<{ data: AnalysisRecord[] | null; error: any }> => {
    const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data, error };
};

export const getAnalysisById = async (
    id: string
): Promise<{ data: AnalysisRecord | null; error: any }> => {
    const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('id', id)
        .single();

    return { data, error };
};

export const deleteAnalysis = async (
    id: string
): Promise<{ error: any }> => {
    const { error } = await supabase
        .from('analysis_history')
        .delete()
        .eq('id', id);

    return { error };
};
