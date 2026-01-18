-- =====================================================================
-- WealthPath Optimizer - Script Completo de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- =====================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- TABLA: profiles
-- Extensión del usuario de autenticación
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLA: estimators
-- Configuraciones de optimización financiera del usuario
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.estimators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Mi Plan',
    
    -- Parámetros financieros
    initial_capital DECIMAL(15,2) NOT NULL,           -- K_0: Capital inicial
    annual_return DECIMAL(5,4) DEFAULT 0.05,          -- r: Tasa de retorno anual
    discount_rate DECIMAL(5,4) DEFAULT 0.03,          -- ρ: Tasa de preferencia temporal
    risk_aversion DECIMAL(5,2) DEFAULT 2.0,           -- σ: Coeficiente de aversión al riesgo
    life_expectancy INTEGER DEFAULT 85,               -- T: Esperanza de vida
    current_age INTEGER NOT NULL,                     -- t_0: Edad actual
    inheritance_target DECIMAL(15,2) DEFAULT 0,       -- K_T: Herencia objetivo
    
    -- Resultados de optimización (cache)
    optimal_c1 DECIMAL(15,2),                         -- Consumo inicial óptimo
    total_utility DECIMAL(20,6),                      -- Utilidad total descontada
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Restricciones
    CONSTRAINT valid_ages CHECK (life_expectancy > current_age),
    CONSTRAINT valid_capital CHECK (initial_capital >= 0),
    CONSTRAINT valid_inheritance CHECK (inheritance_target >= 0)
);

-- =====================================================================
-- TABLA: optimization_series
-- Series temporales de resultados de optimización
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.optimization_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimator_id UUID NOT NULL REFERENCES public.estimators(id) ON DELETE CASCADE,
    
    -- Datos del período
    period INTEGER NOT NULL,                          -- t: Número de período
    capital DECIMAL(15,2) NOT NULL,                   -- K_t: Capital en período t
    consumption DECIMAL(15,2) NOT NULL,               -- C_t: Consumo en período t
    utility DECIMAL(15,6),                            -- U(C_t): Utilidad del período
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(estimator_id, period)
);

-- =====================================================================
-- TABLA: transactions (NUEVA - Transacciones financieras)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ingreso', 'gasto')),
    category TEXT NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLA: assets (NUEVA - Patrimonio/Activos)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('inmueble', 'vehiculo', 'inversion', 'efectivo', 'otro')),
    value DECIMAL(15,2) NOT NULL,
    acquisition_date DATE,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLA: income_sources (NUEVA - Fuentes de ingreso)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.income_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('salario', 'negocio', 'inversiones', 'alquiler', 'pensión', 'otro')),
    monthly_amount DECIMAL(15,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLA: savings_goals (NUEVA - Metas de ahorro)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    deadline DATE,
    priority TEXT CHECK (priority IN ('alta', 'media', 'baja')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- ÍNDICES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_estimators_user_id ON public.estimators(user_id);
CREATE INDEX IF NOT EXISTS idx_optimization_series_estimator ON public.optimization_series(estimator_id);
CREATE INDEX IF NOT EXISTS idx_optimization_series_period ON public.optimization_series(estimator_id, period);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_user_id ON public.income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);

-- =====================================================================
-- TRIGGER: Actualizar updated_at automáticamente
-- =====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_estimators_updated_at ON public.estimators;
CREATE TRIGGER update_estimators_updated_at
    BEFORE UPDATE ON public.estimators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON public.savings_goals;
CREATE TRIGGER update_savings_goals_updated_at
    BEFORE UPDATE ON public.savings_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para estimators
DROP POLICY IF EXISTS "Users can manage own estimators" ON public.estimators;
CREATE POLICY "Users can manage own estimators" ON public.estimators
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para optimization_series
DROP POLICY IF EXISTS "Users can manage own series" ON public.optimization_series;
CREATE POLICY "Users can manage own series" ON public.optimization_series
    FOR ALL USING (
        estimator_id IN (SELECT id FROM public.estimators WHERE user_id = auth.uid())
    );

-- Políticas para transactions
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para assets
DROP POLICY IF EXISTS "Users can manage own assets" ON public.assets;
CREATE POLICY "Users can manage own assets" ON public.assets
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para income_sources
DROP POLICY IF EXISTS "Users can manage own income" ON public.income_sources;
CREATE POLICY "Users can manage own income" ON public.income_sources
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para savings_goals
DROP POLICY IF EXISTS "Users can manage own goals" ON public.savings_goals;
CREATE POLICY "Users can manage own goals" ON public.savings_goals
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================================
-- TRIGGER: Crear perfil automáticamente al registrarse
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- =====================================================================
-- DATOS DE EJEMPLO (EN ESPAÑOL)
-- =====================================================================
-- =====================================================================

-- Primero creamos un usuario de prueba manualmente
-- (En producción, los usuarios se crean via autenticación)

-- Crear perfil de ejemplo (ID fijo para pruebas)
INSERT INTO public.profiles (id, email, full_name, avatar_url)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'carlos.mendez@ejemplo.com', 'Carlos Méndez García', NULL),
    ('00000000-0000-0000-0000-000000000002', 'maria.gonzalez@ejemplo.com', 'María González López', NULL),
    ('00000000-0000-0000-0000-000000000003', 'juan.rodriguez@ejemplo.com', 'Juan Rodríguez Pérez', NULL)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- ESTIMADORES (Planes de optimización financiera)
-- =====================================================================
INSERT INTO public.estimators (user_id, name, initial_capital, annual_return, discount_rate, risk_aversion, life_expectancy, current_age, inheritance_target)
VALUES 
    -- Carlos Méndez - 45 años, plan conservador
    ('00000000-0000-0000-0000-000000000001', 'Plan de Retiro Conservador', 850000.00, 0.04, 0.02, 2.5, 85, 45, 150000.00),
    ('00000000-0000-0000-0000-000000000001', 'Plan de Retiro Agresivo', 850000.00, 0.08, 0.03, 1.5, 90, 45, 50000.00),
    
    -- María González - 35 años, profesional joven
    ('00000000-0000-0000-0000-000000000002', 'Plan Horizonte 2055', 320000.00, 0.06, 0.025, 2.0, 90, 35, 200000.00),
    ('00000000-0000-0000-0000-000000000002', 'Plan Educación Hijos', 50000.00, 0.05, 0.02, 3.0, 53, 35, 0.00),
    
    -- Juan Rodríguez - 55 años, cerca del retiro
    ('00000000-0000-0000-0000-000000000003', 'Plan Retiro Inmediato', 1200000.00, 0.035, 0.02, 3.5, 85, 55, 300000.00)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- TRANSACCIONES (Ingresos y gastos recientes)
-- =====================================================================
INSERT INTO public.transactions (user_id, description, amount, type, category, transaction_date)
VALUES 
    -- Carlos Méndez - Transacciones
    ('00000000-0000-0000-0000-000000000001', 'Salario mensual - Empresa ABC', 4500.00, 'ingreso', 'salario', '2026-01-15'),
    ('00000000-0000-0000-0000-000000000001', 'Bono anual', 9000.00, 'ingreso', 'salario', '2026-01-10'),
    ('00000000-0000-0000-0000-000000000001', 'Supermercado Carrefour', 285.50, 'gasto', 'alimentación', '2026-01-14'),
    ('00000000-0000-0000-0000-000000000001', 'Factura de luz', 95.30, 'gasto', 'servicios', '2026-01-12'),
    ('00000000-0000-0000-0000-000000000001', 'Factura de gas', 45.00, 'gasto', 'servicios', '2026-01-12'),
    ('00000000-0000-0000-0000-000000000001', 'Netflix + Spotify', 25.99, 'gasto', 'entretenimiento', '2026-01-05'),
    ('00000000-0000-0000-0000-000000000001', 'Gasolina', 65.00, 'gasto', 'transporte', '2026-01-11'),
    ('00000000-0000-0000-0000-000000000001', 'Restaurante El Buen Sabor', 78.50, 'gasto', 'alimentación', '2026-01-13'),
    ('00000000-0000-0000-0000-000000000001', 'Dividendos acciones', 125.00, 'ingreso', 'inversiones', '2026-01-08'),
    ('00000000-0000-0000-0000-000000000001', 'Seguro del auto', 180.00, 'gasto', 'seguros', '2026-01-01'),
    
    -- María González - Transacciones
    ('00000000-0000-0000-0000-000000000002', 'Salario mensual - Consultora XYZ', 3800.00, 'ingreso', 'salario', '2026-01-15'),
    ('00000000-0000-0000-0000-000000000002', 'Freelance diseño web', 850.00, 'ingreso', 'negocio', '2026-01-10'),
    ('00000000-0000-0000-0000-000000000002', 'Alquiler departamento', 1200.00, 'gasto', 'vivienda', '2026-01-01'),
    ('00000000-0000-0000-0000-000000000002', 'Supermercado Mercadona', 195.00, 'gasto', 'alimentación', '2026-01-14'),
    ('00000000-0000-0000-0000-000000000002', 'Gimnasio mensual', 45.00, 'gasto', 'salud', '2026-01-01'),
    ('00000000-0000-0000-0000-000000000002', 'Curso online programación', 199.00, 'gasto', 'educación', '2026-01-08'),
    ('00000000-0000-0000-0000-000000000002', 'Farmacia', 32.50, 'gasto', 'salud', '2026-01-09'),
    ('00000000-0000-0000-0000-000000000002', 'Ropa Zara', 85.00, 'gasto', 'ropa', '2026-01-12'),
    
    -- Juan Rodríguez - Transacciones  
    ('00000000-0000-0000-0000-000000000003', 'Pensión mensual', 2800.00, 'ingreso', 'pensión', '2026-01-05'),
    ('00000000-0000-0000-0000-000000000003', 'Alquiler local comercial', 1500.00, 'ingreso', 'alquiler', '2026-01-03'),
    ('00000000-0000-0000-0000-000000000003', 'Intereses plazo fijo', 320.00, 'ingreso', 'inversiones', '2026-01-15'),
    ('00000000-0000-0000-0000-000000000003', 'Hipoteca mensual', 650.00, 'gasto', 'vivienda', '2026-01-05'),
    ('00000000-0000-0000-0000-000000000003', 'Medicamentos', 120.00, 'gasto', 'salud', '2026-01-10'),
    ('00000000-0000-0000-0000-000000000003', 'Comunidad de vecinos', 85.00, 'gasto', 'vivienda', '2026-01-01'),
    ('00000000-0000-0000-0000-000000000003', 'Seguro de vida', 95.00, 'gasto', 'seguros', '2026-01-01')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- ACTIVOS (Patrimonio)
-- =====================================================================
INSERT INTO public.assets (user_id, name, type, value, acquisition_date, notes)
VALUES 
    -- Carlos Méndez - Patrimonio
    ('00000000-0000-0000-0000-000000000001', 'Vivienda principal - Madrid', 'inmueble', 380000.00, '2015-06-15', 'Piso 3 habitaciones, Barrio Salamanca'),
    ('00000000-0000-0000-0000-000000000001', 'Volkswagen Golf 2022', 'vehiculo', 28000.00, '2022-03-20', 'Financiado, quedan 15 cuotas'),
    ('00000000-0000-0000-0000-000000000001', 'Cuenta de ahorros BBVA', 'efectivo', 45000.00, NULL, 'Fondo de emergencia'),
    ('00000000-0000-0000-0000-000000000001', 'Cartera acciones ETF', 'inversion', 85000.00, '2019-01-10', 'ETF S&P 500 y MSCI Europe'),
    ('00000000-0000-0000-0000-000000000001', 'Plan de pensiones', 'inversion', 120000.00, '2010-05-01', 'Aportación mensual de 300€'),
    
    -- María González - Patrimonio
    ('00000000-0000-0000-0000-000000000002', 'Cuenta corriente Santander', 'efectivo', 8500.00, NULL, 'Cuenta nómina'),
    ('00000000-0000-0000-0000-000000000002', 'Fondo indexado Vanguard', 'inversion', 25000.00, '2021-08-15', 'Aportación mensual automática'),
    ('00000000-0000-0000-0000-000000000002', 'Criptomonedas (Bitcoin/Ethereum)', 'inversion', 5500.00, '2022-01-01', 'Inversión especulativa'),
    ('00000000-0000-0000-0000-000000000002', 'Seat Ibiza 2020', 'vehiculo', 12000.00, '2020-09-10', 'Pagado al contado'),
    
    -- Juan Rodríguez - Patrimonio
    ('00000000-0000-0000-0000-000000000003', 'Vivienda principal - Barcelona', 'inmueble', 520000.00, '2005-04-20', 'Chalet adosado, hipoteca casi pagada'),
    ('00000000-0000-0000-0000-000000000003', 'Local comercial alquilado', 'inmueble', 280000.00, '2012-11-30', 'Alquilado a tienda de ropa'),
    ('00000000-0000-0000-0000-000000000003', 'Depósito a plazo fijo', 'inversion', 150000.00, '2024-01-01', 'Renovación anual, 3.5% TAE'),
    ('00000000-0000-0000-0000-000000000003', 'Bonos del Estado', 'inversion', 80000.00, '2023-06-15', 'Vencimiento 2028'),
    ('00000000-0000-0000-0000-000000000003', 'Cuenta ahorro ING', 'efectivo', 35000.00, NULL, 'Liquidez inmediata'),
    ('00000000-0000-0000-0000-000000000003', 'Mercedes Clase C 2021', 'vehiculo', 42000.00, '2021-05-01', 'Pagado al contado')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- FUENTES DE INGRESO
-- =====================================================================
INSERT INTO public.income_sources (user_id, name, type, monthly_amount, is_active, start_date, end_date)
VALUES 
    -- Carlos Méndez
    ('00000000-0000-0000-0000-000000000001', 'Salario Empresa ABC S.A.', 'salario', 4500.00, TRUE, '2018-03-01', NULL),
    ('00000000-0000-0000-0000-000000000001', 'Dividendos cartera ETF', 'inversiones', 125.00, TRUE, '2019-01-01', NULL),
    
    -- María González
    ('00000000-0000-0000-0000-000000000002', 'Salario Consultora XYZ', 'salario', 3800.00, TRUE, '2021-09-01', NULL),
    ('00000000-0000-0000-0000-000000000002', 'Freelance diseño/desarrollo', 'negocio', 600.00, TRUE, '2020-01-01', NULL),
    
    -- Juan Rodríguez
    ('00000000-0000-0000-0000-000000000003', 'Pensión Seguridad Social', 'pensión', 2800.00, TRUE, '2021-01-01', NULL),
    ('00000000-0000-0000-0000-000000000003', 'Alquiler local comercial', 'alquiler', 1500.00, TRUE, '2013-01-01', NULL),
    ('00000000-0000-0000-0000-000000000003', 'Intereses depósito plazo fijo', 'inversiones', 437.50, TRUE, '2024-01-01', '2025-01-01')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- METAS DE AHORRO
-- =====================================================================
INSERT INTO public.savings_goals (user_id, name, target_amount, current_amount, deadline, priority)
VALUES 
    -- Carlos Méndez
    ('00000000-0000-0000-0000-000000000001', 'Fondo de emergencia (12 meses)', 54000.00, 45000.00, '2026-06-30', 'alta'),
    ('00000000-0000-0000-0000-000000000001', 'Viaje a Japón', 8000.00, 2500.00, '2027-03-01', 'baja'),
    ('00000000-0000-0000-0000-000000000001', 'Renovar cocina', 15000.00, 3000.00, '2026-12-31', 'media'),
    
    -- María González
    ('00000000-0000-0000-0000-000000000002', 'Entrada para piso', 60000.00, 25000.00, '2028-01-01', 'alta'),
    ('00000000-0000-0000-0000-000000000002', 'Máster en Business Analytics', 12000.00, 4000.00, '2026-09-01', 'alta'),
    ('00000000-0000-0000-0000-000000000002', 'Fondo de emergencia (6 meses)', 15000.00, 8500.00, '2026-06-01', 'alta'),
    
    -- Juan Rodríguez
    ('00000000-0000-0000-0000-000000000003', 'Reforma baño casa', 12000.00, 8000.00, '2026-04-01', 'media'),
    ('00000000-0000-0000-0000-000000000003', 'Fondo para nietos', 30000.00, 15000.00, '2028-12-31', 'media'),
    ('00000000-0000-0000-0000-000000000003', 'Crucero por el Mediterráneo', 5000.00, 3500.00, '2026-08-01', 'baja')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- SERIES DE OPTIMIZACIÓN (Ejemplo para Carlos - Plan Conservador)
-- Primeros 10 períodos de una simulación
-- =====================================================================
DO $$
DECLARE
    estimator_uuid UUID;
BEGIN
    -- Obtener el ID del primer estimador de Carlos
    SELECT id INTO estimator_uuid 
    FROM public.estimators 
    WHERE user_id = '00000000-0000-0000-0000-000000000001' 
    AND name = 'Plan de Retiro Conservador'
    LIMIT 1;
    
    IF estimator_uuid IS NOT NULL THEN
        INSERT INTO public.optimization_series (estimator_id, period, capital, consumption, utility)
        VALUES 
            (estimator_uuid, 0, 850000.00, 0, 0),
            (estimator_uuid, 1, 850000.00, 42500.00, -0.000024),
            (estimator_uuid, 2, 839800.00, 43350.00, -0.000023),
            (estimator_uuid, 3, 828632.00, 44217.00, -0.000023),
            (estimator_uuid, 4, 816418.93, 45101.34, -0.000022),
            (estimator_uuid, 5, 803078.23, 46003.37, -0.000022),
            (estimator_uuid, 6, 788524.06, 46923.44, -0.000021),
            (estimator_uuid, 7, 772665.58, 47861.91, -0.000021),
            (estimator_uuid, 8, 755405.72, 48819.15, -0.000020),
            (estimator_uuid, 9, 736641.94, 49795.53, -0.000020),
            (estimator_uuid, 10, 716265.77, 50791.44, -0.000020)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================================
-- VERIFICACIÓN: Contar registros insertados
-- =====================================================================
SELECT 'profiles' as tabla, COUNT(*) as registros FROM public.profiles
UNION ALL
SELECT 'estimators', COUNT(*) FROM public.estimators
UNION ALL
SELECT 'transactions', COUNT(*) FROM public.transactions
UNION ALL
SELECT 'assets', COUNT(*) FROM public.assets
UNION ALL
SELECT 'income_sources', COUNT(*) FROM public.income_sources
UNION ALL
SELECT 'savings_goals', COUNT(*) FROM public.savings_goals
UNION ALL
SELECT 'optimization_series', COUNT(*) FROM public.optimization_series;
