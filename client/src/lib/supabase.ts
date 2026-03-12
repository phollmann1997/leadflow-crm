import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajbvjnqpxoqsvlmwpxxu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYnZqbnFweG9xc3ZsbXdweHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDA0NjUsImV4cCI6MjA4ODgxNjQ2NX0.1Fqrj3wb9ezl65Yop7AjGoa9_5N5cMG-AenD9xlV75k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
