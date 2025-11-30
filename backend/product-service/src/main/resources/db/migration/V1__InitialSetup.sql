CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    product_uuid UUID NOT NULL UNIQUE,
    seller_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(15,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0
);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_title ON products USING gin (to_tsvector('russian', title));