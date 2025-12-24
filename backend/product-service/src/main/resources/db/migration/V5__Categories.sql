CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id BIGINT REFERENCES categories(id),
    slug VARCHAR(255) UNIQUE
);

ALTER TABLE products
    ADD COLUMN category_id BIGINT REFERENCES categories(id);

ALTER TABLE products
    ADD COLUMN attributes JSONB;
