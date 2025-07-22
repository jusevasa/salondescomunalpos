-- Enable RLS (Row Level Security) globally
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA PUBLIC REVOKE ALL ON TABLES FROM PUBLIC;

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('admin', 'waiter');
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'delivered', 'paid', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Profiles/Users table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(active);

-- Menu categories
CREATE TABLE menu_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Menu items
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    base_price DECIMAL(10,2),
    category_id INTEGER NOT NULL REFERENCES menu_categories(id),
    active BOOLEAN DEFAULT true,
    tax DECIMAL(5,2) DEFAULT 0,
    fee DECIMAL(10,2) DEFAULT 0,
    author VARCHAR(255) NOT NULL,
    has_cooking_point BOOLEAN DEFAULT false,
    has_sides BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_menu_items_active ON menu_items(active);

-- Sides
CREATE TABLE sides (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Item sides relationship
CREATE TABLE item_sides (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
    side_id INTEGER NOT NULL REFERENCES sides(id),
    max_quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cooking points
CREATE TABLE cooking_points (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tables
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    number VARCHAR(10) NOT NULL UNIQUE,
    capacity INTEGER DEFAULT 4,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment methods
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    table_id INTEGER NOT NULL REFERENCES tables(id),
    profile_id UUID NOT NULL REFERENCES profiles(id),
    diners_count INTEGER NOT NULL,
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    change_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_profile_id ON orders(profile_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Order items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    cooking_point_id INTEGER REFERENCES cooking_points(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Order item sides
CREATE TABLE order_item_sides (
    id SERIAL PRIMARY KEY,
    order_item_id INTEGER NOT NULL REFERENCES order_items(id),
    side_id INTEGER NOT NULL REFERENCES sides(id),
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),
    amount DECIMAL(10,2) NOT NULL,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    tip_percentage DECIMAL(5,2),
    total_paid DECIMAL(10,2) NOT NULL,
    received_amount DECIMAL(10,2),
    change_amount DECIMAL(10,2) DEFAULT 0,
    reference_number VARCHAR(100),
    status payment_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sides ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_sides ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_sides ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (
    id = auth.uid()
);

CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for menu_categories
CREATE POLICY "Anyone can view active categories" ON menu_categories FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage categories" ON menu_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for menu_items
CREATE POLICY "Anyone can view active menu items" ON menu_items FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage menu items" ON menu_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for sides
CREATE POLICY "Anyone can view active sides" ON sides FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage sides" ON sides FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for item_sides
CREATE POLICY "Anyone can view item sides" ON item_sides FOR SELECT USING (true);
CREATE POLICY "Admins can manage item sides" ON item_sides FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for cooking_points
CREATE POLICY "Anyone can view active cooking points" ON cooking_points FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage cooking points" ON cooking_points FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for tables
CREATE POLICY "Anyone can view active tables" ON tables FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage tables" ON tables FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for payment_methods
CREATE POLICY "Anyone can view active payment methods" ON payment_methods FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage payment methods" ON payment_methods FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for orders
CREATE POLICY "Users can view orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'waiter'))
);

CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'waiter'))
);

CREATE POLICY "Users can update orders" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'waiter'))
);

-- RLS Policies for order_items
CREATE POLICY "Users can view order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'waiter'))
);

CREATE POLICY "Users can manage order items" ON order_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'waiter'))
);

-- RLS Policies for order_item_sides
CREATE POLICY "Users can view order item sides" ON order_item_sides FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'waiter'))
);

CREATE POLICY "Users can manage order item sides" ON order_item_sides FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'waiter'))
);

-- RLS Policies for payments
CREATE POLICY "Users can view payments" ON payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'waiter'))
);

CREATE POLICY "Users can manage payments" ON payments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'waiter'))
);

-- Insert initial data
INSERT INTO payment_methods (name, code, display_order) VALUES
('Efectivo', 'CASH', 1),
('Nequi', 'NEQUI', 2),
('Daviplata', 'DAVIPLATA', 3),
('Bancolombia', 'BANCOLOMBIA', 4),
('Tarjeta Débito', 'DEBIT_CARD', 5),
('Tarjeta Crédito', 'CREDIT_CARD', 6);

INSERT INTO cooking_points (name, display_order) VALUES
('Poco hecho', 1),
('Término medio', 2),
('Bien hecho', 3);

INSERT INTO sides (name, display_order) VALUES
('Papas fritas', 1),
('Ensalada', 2),
('Arroz', 3),
('Yuca', 4),
('Plátano', 5); 