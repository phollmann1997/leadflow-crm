-- LeadFlow CRM - Supabase tabulky
-- Spusť tento SQL v Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL
);

-- Firmy (leads/companies)
CREATE TABLE IF NOT EXISTS firmy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  nazev text NOT NULL,
  ico text,
  web text,
  obor text NOT NULL DEFAULT 'jine',
  pocet_zamestnancu text,
  popis_podnikani text,
  adresa text,
  poznamky text,
  zdroj text NOT NULL DEFAULT 'jine',
  stav text NOT NULL DEFAULT 'novy',
  hodnota_dealu integer DEFAULT 0,
  tagy text,
  created_at timestamptz DEFAULT now()
);

-- Kontakty (contact persons)
CREATE TABLE IF NOT EXISTS kontakty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id text NOT NULL,
  jmeno text NOT NULL,
  prijmeni text NOT NULL,
  pozice text,
  email text,
  telefon text,
  linkedin text,
  je_primarni boolean DEFAULT true,
  poznamky text,
  created_at timestamptz DEFAULT now()
);

-- Komunikace (communication log)
CREATE TABLE IF NOT EXISTS komunikace (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id text NOT NULL,
  kontakt_id text,
  user_id text NOT NULL,
  typ text NOT NULL,
  smer text NOT NULL DEFAULT 'odchozi',
  predmet text NOT NULL,
  obsah text,
  odpoved text,
  datum timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Follow-upy (reminders/tasks)
CREATE TABLE IF NOT EXISTS followupy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id text NOT NULL,
  user_id text NOT NULL,
  typ text NOT NULL,
  popis text NOT NULL,
  datum_plan timestamptz NOT NULL,
  splneno boolean DEFAULT false,
  splneno_date timestamptz,
  priorita text NOT NULL DEFAULT 'stredni',
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for simplicity (single-user app)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmy ENABLE ROW LEVEL SECURITY;
ALTER TABLE kontakty ENABLE ROW LEVEL SECURITY;
ALTER TABLE komunikace ENABLE ROW LEVEL SECURITY;
ALTER TABLE followupy ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon role (simple setup)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on firmy" ON firmy FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on kontakty" ON kontakty FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on komunikace" ON komunikace FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on followupy" ON followupy FOR ALL USING (true) WITH CHECK (true);

-- Seed demo user
INSERT INTO users (id, username, password, full_name, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'petr', 'heslo123', 'Petr Hollmann', 'petr.hollmann@gmail.com')
ON CONFLICT (username) DO NOTHING;

-- Seed demo firmy
INSERT INTO firmy (id, user_id, nazev, ico, web, obor, pocet_zamestnancu, popis_podnikani, adresa, poznamky, zdroj, stav, hodnota_dealu, tagy) VALUES
('00000000-0000-0000-0000-000000000f01', '00000000-0000-0000-0000-000000000001', 'Transfaktoring a.s.', '28501187', 'https://transfaktoring.cz', 'faktoring', '5-10', 'Faktoringová společnost, zpracovávají velké množství faktur a smluv o postoupení pohledávek.', 'Praha', 'Stávající klient. Platí měsíčně za extrakci faktur. Rozšiřujeme o RAG analýzu smluv.', 'doporuceni', 'zakaznik', 15000, 'aktivní,faktoring,rag'),
('00000000-0000-0000-0000-000000000f02', '00000000-0000-0000-0000-000000000001', 'BNP Paribas Faktoring', '27248186', 'https://factoringkb.cz', 'faktoring', '20-50', 'Dceřiná společnost KB, poskytuje faktoringové služby. Zpracovávají tisíce faktur měsíčně.', 'Praha 1', NULL, 'linkedin', 'osloven', 50000, 'enterprise,faktoring,demo'),
('00000000-0000-0000-0000-000000000f03', '00000000-0000-0000-0000-000000000001', 'Malá účetní s.r.o.', '12345678', NULL, 'ucetnictvi', '3-5', 'Účetní firma pro malé a střední podnikatele, zpracovávají faktury a daňová přiznání.', 'Liberec', NULL, 'cold_email', 'schuzka', 8000, 'účetnictví,liberec'),
('00000000-0000-0000-0000-000000000f04', '00000000-0000-0000-0000-000000000001', 'FastLogistics s.r.o.', '98765432', 'https://fastlogistics.cz', 'logistika', '10-15', 'Logistická firma, zpracovávají CMR listy, celní deklarace a dodací listy.', 'Brno', NULL, 'web', 'novy', 12000, 'logistika,brno'),
('00000000-0000-0000-0000-000000000f05', '00000000-0000-0000-0000-000000000001', 'Broker Capital a.s.', '55667788', NULL, 'makler', '5-10', 'Makléřská firma, zprostředkovávají úvěry a pojištění. Zpracovávají smlouvy a žádosti.', 'Praha 5', NULL, 'linkedin', 'odpovezel', 20000, 'makléř,demo'),
('00000000-0000-0000-0000-000000000f06', '00000000-0000-0000-0000-000000000001', 'Česká správa nemovitostí', '44556677', NULL, 'jine', '8-12', 'Správa bytových domů, zpracovávají nájemní smlouvy a vyúčtování.', 'Plzeň', NULL, 'cold_call', 'nabidka', 25000, 'nemovitosti,plzeň')
ON CONFLICT DO NOTHING;

-- Seed follow-upy
INSERT INTO followupy (firma_id, user_id, typ, popis, datum_plan, priorita) VALUES
('00000000-0000-0000-0000-000000000f04', '00000000-0000-0000-0000-000000000001', 'email', 'Poslat úvodní email Petru Kučerovi', NOW() + interval '0 days', 'stredni'),
('00000000-0000-0000-0000-000000000f02', '00000000-0000-0000-0000-000000000001', 'linkedin', 'Follow-up na LinkedIn zprávu, připomenout se', NOW() + interval '1 day', 'stredni'),
('00000000-0000-0000-0000-000000000f05', '00000000-0000-0000-0000-000000000001', 'telefon', 'Zavolat Martinovi, domluvit termín dema', NOW() + interval '2 days', 'vysoka'),
('00000000-0000-0000-0000-000000000f03', '00000000-0000-0000-0000-000000000001', 'schuzka', 'Schůzka s Janou - demo AlgoMat', NOW() + interval '4 days', 'vysoka'),
('00000000-0000-0000-0000-000000000f06', '00000000-0000-0000-0000-000000000001', 'email', 'Follow-up na cenovou nabídku - ptát se na rozpočet', NOW() + interval '7 days', 'nizka'),
('00000000-0000-0000-0000-000000000f01', '00000000-0000-0000-0000-000000000001', 'schuzka', 'Prezentace RAG analýzy smluv pro TRFA', NOW() + interval '9 days', 'vysoka')
ON CONFLICT DO NOTHING;
