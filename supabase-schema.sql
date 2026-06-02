-- ============================================================
-- SQL para crear las tablas de SaaS LO en Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. TABLA DE PREDIOS
-- Cada usuario autenticado tiene uno o más predios
CREATE TABLE predios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  comuna TEXT DEFAULT '',
  region TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA DE ANIMALES
-- Cada animal pertenece a un predio
CREATE TABLE animales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  predio_id UUID REFERENCES predios(id) ON DELETE CASCADE NOT NULL,
  diio TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Vaquilla',
  raza TEXT NOT NULL DEFAULT '',
  fecha_nacimiento DATE,
  estado TEXT DEFAULT 'Vacía',
  partos_exitosos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(predio_id, diio)
);

-- 3. TABLA DE EVENTOS REPRODUCTIVOS
-- Historial de cada animal
CREATE TABLE eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id UUID REFERENCES animales(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL,
  detalle TEXT DEFAULT '',
  toro TEXT,
  inseminador TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA DE TOROS
CREATE TABLE toros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  predio_id UUID REFERENCES predios(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  diio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABLA DE POTREROS
CREATE TABLE potreros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  predio_id UUID REFERENCES predios(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo puede ver/modificar SUS propios datos
-- ============================================================

ALTER TABLE predios ENABLE ROW LEVEL SECURITY;
ALTER TABLE animales ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE toros ENABLE ROW LEVEL SECURITY;
ALTER TABLE potreros ENABLE ROW LEVEL SECURITY;

-- Políticas para PREDIOS
CREATE POLICY "predios_select" ON predios FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "predios_insert" ON predios FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "predios_update" ON predios FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "predios_delete" ON predios FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para ANIMALES
CREATE POLICY "animales_select" ON animales FOR SELECT
  USING (predio_id IN (SELECT id FROM predios WHERE user_id = auth.uid()));
CREATE POLICY "animales_insert" ON animales FOR INSERT
  WITH CHECK (predio_id IN (SELECT id FROM predios WHERE user_id = auth.uid()));
CREATE POLICY "animales_update" ON animales FOR UPDATE
  USING (predio_id IN (SELECT id FROM predios WHERE user_id = auth.uid()));
CREATE POLICY "animales_delete" ON animales FOR DELETE
  USING (predio_id IN (SELECT id FROM predios WHERE user_id = auth.uid()));

-- Políticas para EVENTOS
CREATE POLICY "eventos_select" ON eventos FOR SELECT
  USING (animal_id IN (
    SELECT a.id FROM animales a
    JOIN predios p ON a.predio_id = p.id
    WHERE p.user_id = auth.uid()
  ));
CREATE POLICY "eventos_insert" ON eventos FOR INSERT
  WITH CHECK (animal_id IN (
    SELECT a.id FROM animales a
    JOIN predios p ON a.predio_id = p.id
    WHERE p.user_id = auth.uid()
  ));
CREATE POLICY "eventos_update" ON eventos FOR UPDATE
  USING (animal_id IN (
    SELECT a.id FROM animales a
    JOIN predios p ON a.predio_id = p.id
    WHERE p.user_id = auth.uid()
  ));
CREATE POLICY "eventos_delete" ON eventos FOR DELETE
  USING (animal_id IN (
    SELECT a.id FROM animales a
    JOIN predios p ON a.predio_id = p.id
    WHERE p.user_id = auth.uid()
  ));

-- Políticas para TOROS
CREATE POLICY "toros_select" ON toros FOR SELECT
  USING (predio_id IN (SELECT id FROM predios WHERE user_id = auth.uid()));
CREATE POLICY "toros_insert" ON toros FOR INSERT
  WITH CHECK (predio_id IN (SELECT id FROM predios WHERE user_id = auth.uid()));
CREATE POLICY "toros_update" ON toros FOR UPDATE
  USING (predio_id IN (SELECT id FROM predios WHERE user_id = auth.uid()));
CREATE POLICY "toros_delete" ON toros FOR DELETE
  USING (predio_id IN (SELECT id FROM predios WHERE user_id = auth.uid()));

-- Políticas para POTREROS
CREATE POLICY "potreros_select" ON potreros FOR SELECT
  USING (predio_id IN (SELECT id FROM predios WHERE user_id = auth.uid()));
CREATE POLICY "potreros_insert" ON potreros FOR INSERT
  WITH CHECK (predio_id IN (SELECT id FROM predios WHERE user_id = auth.uid()));
CREATE POLICY "potreros_update" ON potreros FOR UPDATE
  USING (predio_id IN (SELECT id FROM predios WHERE user_id = auth.uid()));
CREATE POLICY "potreros_delete" ON potreros FOR DELETE
  USING (predio_id IN (SELECT id FROM predios WHERE user_id = auth.uid()));
