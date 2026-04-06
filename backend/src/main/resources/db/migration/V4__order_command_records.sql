-- Sealed heritage command record (PDF) stored when an order is accepted; re-downloaded from here.
CREATE TABLE order_command_records (
  order_id BIGINT NOT NULL PRIMARY KEY,
  pdf BYTEA NOT NULL,
  filename VARCHAR(255) NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_command_records_order
    FOREIGN KEY (order_id) REFERENCES customer_orders (id) ON DELETE CASCADE
);
