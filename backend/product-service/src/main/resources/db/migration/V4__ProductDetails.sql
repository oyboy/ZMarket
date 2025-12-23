CREATE TABLE product_details (
    product_id VARCHAR(255) PRIMARY KEY,
    main_attachment_key VARCHAR(500)
);

CREATE TABLE file_attachment (
    object_key VARCHAR(500) PRIMARY KEY,
    product_id VARCHAR(255),
    file_name VARCHAR(255),
    content_type VARCHAR(255)
);