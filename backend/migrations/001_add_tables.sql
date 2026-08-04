-- ============================================================
-- CampusCart2 Migration 001 — New Tables, uploader_id & product.status
-- Run this in your Supabase SQL Editor (or via psql)
-- ============================================================

-- 1. Add uploader_id and status columns to products (safe to run multiple times)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS uploader_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'sold'));

-- 2. Wishlist join table
CREATE TABLE IF NOT EXISTS wishlists (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    TEXT        NOT NULL,
  product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 3. Orders / deals table
CREATE TABLE IF NOT EXISTS orders (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID        NOT NULL REFERENCES products(id),
  buyer_id   TEXT        NOT NULL,
  seller_id  TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            TEXT        NOT NULL,
  type               TEXT        NOT NULL,
  related_product_id UUID        REFERENCES products(id) ON DELETE SET NULL,
  related_order_id   UUID        REFERENCES orders(id)   ON DELETE SET NULL,
  status             TEXT        NOT NULL DEFAULT 'unread'
                       CHECK (status IN ('unread', 'read')),
  extra_data         JSONB,
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS wishlists_user_idx         ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS orders_buyer_idx           ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS orders_seller_idx          ON orders(seller_id);
CREATE INDEX IF NOT EXISTS notifications_user_idx     ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_order_idx    ON notifications(related_order_id);
CREATE INDEX IF NOT EXISTS products_status_idx        ON products(status);
CREATE INDEX IF NOT EXISTS products_uploader_idx      ON products(uploader_id);
