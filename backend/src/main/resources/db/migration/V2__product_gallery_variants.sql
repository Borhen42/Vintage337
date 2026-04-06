-- Gallery (JSON array of URLs) and size/color/stock variants (JSON array of objects)
ALTER TABLE products
  ADD COLUMN gallery_json TEXT NULL,
  ADD COLUMN variants_json TEXT NULL;
