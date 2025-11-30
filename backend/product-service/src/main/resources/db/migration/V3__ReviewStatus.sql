CREATE TABLE IF NOT EXISTS rating_applier_status (
    event_id UUID PRIMARY KEY,
    status VARCHAR(25) NOT NULL,
    pending_status VARCHAR(25) NOT NULL,
    product_uuid UUID NOT NULL,
    user_uuid UUID NOT NULL,
    exit_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_operation_event_id ON rating_applier_status (event_id);
