-- WealthPath Optimizer Database Schema
-- Run this migration in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Extension of Supabase auth.users
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ESTIMATORS TABLE
-- User's financial optimization configurations
-- ============================================
CREATE TABLE IF NOT EXISTS estimators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Mi Plan',
    
    -- Financial parameters
    initial_capital DECIMAL(15,2) NOT NULL,           -- K_0: Initial wealth
    annual_return DECIMAL(5,4) DEFAULT 0.05,          -- r: Annual return rate
    discount_rate DECIMAL(5,4) DEFAULT 0.03,          -- ρ: Time preference
    risk_aversion DECIMAL(5,2) DEFAULT 2.0,           -- σ: CRRA coefficient
    life_expectancy INTEGER DEFAULT 85,                -- T: Expected lifespan
    current_age INTEGER NOT NULL,                      -- t_0: Current age
    inheritance_target DECIMAL(15,2) DEFAULT 0,        -- K_T: Bequest target
    
    -- Optimization results (cached)
    optimal_c1 DECIMAL(15,2),                          -- Optimal initial consumption
    total_utility DECIMAL(20,6),                       -- Total discounted utility
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_ages CHECK (life_expectancy > current_age),
    CONSTRAINT valid_capital CHECK (initial_capital >= 0),
    CONSTRAINT valid_inheritance CHECK (inheritance_target >= 0)
);

CREATE TRIGGER update_estimators_updated_at
    BEFORE UPDATE ON estimators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index for faster user queries
CREATE INDEX idx_estimators_user_id ON estimators(user_id);

-- ============================================
-- OPTIMIZATION_SERIES TABLE
-- Time series of optimization results
-- ============================================
CREATE TABLE IF NOT EXISTS optimization_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimator_id UUID NOT NULL REFERENCES estimators(id) ON DELETE CASCADE,
    
    -- Period data
    period INTEGER NOT NULL,                           -- t: Period number
    capital DECIMAL(15,2) NOT NULL,                    -- K_t: Capital at period t
    consumption DECIMAL(15,2) NOT NULL,                -- C_t: Consumption at period t
    utility DECIMAL(15,6),                             -- U(C_t): Period utility
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint per estimator-period combination
    UNIQUE(estimator_id, period)
);

-- Index for faster series queries
CREATE INDEX idx_optimization_series_estimator ON optimization_series(estimator_id);
CREATE INDEX idx_optimization_series_period ON optimization_series(estimator_id, period);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure users can only access their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimators ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_series ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Estimators policies
CREATE POLICY "Users can view own estimators"
    ON estimators FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own estimators"
    ON estimators FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own estimators"
    ON estimators FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own estimators"
    ON estimators FOR DELETE
    USING (auth.uid() = user_id);

-- Optimization series policies
CREATE POLICY "Users can view own optimization series"
    ON optimization_series FOR SELECT
    USING (
        estimator_id IN (
            SELECT id FROM estimators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own optimization series"
    ON optimization_series FOR INSERT
    WITH CHECK (
        estimator_id IN (
            SELECT id FROM estimators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own optimization series"
    ON optimization_series FOR DELETE
    USING (
        estimator_id IN (
            SELECT id FROM estimators WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SAMPLE DATA (for development/testing)
-- Comment out in production
-- ============================================
-- INSERT INTO estimators (user_id, name, initial_capital, current_age, inheritance_target)
-- VALUES 
--     ('YOUR-USER-UUID', 'Plan de Retiro', 1000000, 35, 200000),
--     ('YOUR-USER-UUID', 'Plan Conservador', 500000, 40, 100000);
