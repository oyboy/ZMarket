CREATE TABLE IF NOT EXISTS product_reviews(
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    rating INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    uploaded_at TIMESTAMP,
    comment TEXT,
    status VARCHAR(25) NOT NULL,
    CONSTRAINT product_reviews_products_fk FOREIGN KEY (product_id) REFERENCES products(product_uuid) ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS outbox (
    id              UUID PRIMARY KEY,
    aggregate_id    UUID NOT NULL,
    aggregate_type  VARCHAR(100) NOT NULL,
    type            VARCHAR(100) NOT NULL,
    payload         JSONB NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);