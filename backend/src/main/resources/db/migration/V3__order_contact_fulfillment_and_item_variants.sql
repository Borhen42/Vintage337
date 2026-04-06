-- Checkout contact / fulfillment snapshot; variant lines for accurate stock deduction
ALTER TABLE customer_orders
  ADD COLUMN customer_phone VARCHAR(64) NULL,
  ADD COLUMN fulfillment VARCHAR(32) NULL;

ALTER TABLE customer_order_items
  ADD COLUMN variant_size VARCHAR(64) NULL,
  ADD COLUMN variant_color VARCHAR(64) NULL;
