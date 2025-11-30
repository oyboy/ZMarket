CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    product_uuid UUID NOT NULL UNIQUE,
    seller_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(15,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0
);