import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ajbvjnqpxoqsvlmwpxxu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYnZqbnFweG9xc3ZsbXdweHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDA0NjUsImV4cCI6MjA4ODgxNjQ2NX0.1Fqrj3wb9ezl65Yop7AjGoa9_5N5cMG-AenD9xlV75k'
);

async function migrate() {
  // Check if projekty table exists
  const { data: testData, error: testError } = await supabase.from('projekty').select('id').limit(1);

  if (testError && (testError.code === '42P01' || testError.message.includes('does not exist') || testError.message.includes('schema cache'))) {
    console.log('ERROR: Table "projekty" does not exist yet.');
    console.log('Please create it by running the SQL from /home/user/workspace/supabase-migration.sql');
    console.log('in the Supabase Dashboard SQL Editor, then run this script again.');
    process.exit(1);
  }

  if (testError) {
    console.log('Unexpected error checking projekty table:', testError);
    process.exit(1);
  }

  // Check if migration already ran (any projekty exist?)
  if (testData && testData.length > 0) {
    console.log('Migration already ran - projekty table has data. Skipping.');
    process.exit(0);
  }

  // Get all firmy
  const { data: firmy, error: firmaErr } = await supabase.from('firmy').select('*');
  if (firmaErr) {
    console.error('Error fetching firmy:', firmaErr);
    process.exit(1);
  }

  console.log(`Found ${firmy?.length ?? 0} firmy to migrate...`);

  for (const firma of firmy || []) {
    // Create a default projekt for each firma
    const { data: projekt, error } = await supabase.from('projekty').insert({
      firma_id: firma.id,
      user_id: firma.user_id,
      nazev: 'Hlavní projekt',
      stav: firma.stav || 'novy',
      hodnota_dealu: firma.hodnota_dealu || 0,
    }).select().single();

    if (error) {
      console.error(`Error creating projekt for firma ${firma.nazev}:`, error);
      continue;
    }

    // Update followupy to point to the new projekt
    const { error: fuErr } = await supabase.from('followupy')
      .update({ projekt_id: projekt.id })
      .eq('firma_id', firma.id);

    if (fuErr) {
      console.warn(`Warning: Could not update followupy for firma ${firma.nazev}:`, fuErr.message);
    }

    // Update komunikace to point to the new projekt
    const { error: komErr } = await supabase.from('komunikace')
      .update({ projekt_id: projekt.id })
      .eq('firma_id', firma.id);

    if (komErr) {
      console.warn(`Warning: Could not update komunikace for firma ${firma.nazev}:`, komErr.message);
    }

    console.log(`Migrated: ${firma.nazev} → projekt: ${projekt.id} (stav: ${projekt.stav}, hodnota: ${projekt.hodnota_dealu})`);
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
