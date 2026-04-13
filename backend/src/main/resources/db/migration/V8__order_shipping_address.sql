-- Delivery address snapshot at checkout (required for shipment options)
ALTER TABLE customer_orders
  ADD COLUMN shipping_address VARCHAR(500) NULL,
  ADD COLUMN postal_code VARCHAR(32) NULL;
