const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, ".env"),
  override: true,
});
const { createClient } = require("@supabase/supabase-js");
const { buildProductPayload } = require("./productService");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseKey,
);

// Use dbClient for database operations (uses service role key when configured to bypass RLS)
const dbClient = supabaseServiceRoleKey ? supabaseAdmin : supabase;

const DEFAULT_CATEGORY_NAMES = [
  "Clothes",
  "Snacks",
  "Accessories",
  "Fresher's items",
  "College Essentials",
  "Electronics",
  "Books",
];

async function ensureCategoriesExist() {
  try {
    const { data, error } = await dbClient.from("categories").select("*");
    if (!error && (!data || data.length === 0)) {
      console.log(
        "Categories table in Supabase is empty. Attempting auto-seed...",
      );
      const { data: inserted, error: insertErr } = await dbClient
        .from("categories")
        .insert(DEFAULT_CATEGORY_NAMES.map((name) => ({ name })))
        .select();

      if (insertErr) {
        console.error(
          "Auto-seed categories failed (RLS enabled on categories table):",
          insertErr.message,
        );
      } else {
        console.log(
          "Categories successfully seeded into Supabase:",
          inserted?.length,
          "rows.",
        );
      }
    }
  } catch (err) {
    console.error("ensureCategoriesExist exception:", err);
  }
}

// Auto-seed categories on server startup
ensureCategoriesExist();

// GET /api/categories
app.get("/api/categories", async (req, res) => {
  try {
    let { data, error } = await dbClient
      .from("categories")
      .select("*")
      .order("name");

    if (error || !data || data.length === 0) {
      await ensureCategoriesExist();
      const retry = await dbClient.from("categories").select("*").order("name");
      if (retry.data && retry.data.length > 0) {
        data = retry.data;
      }
    }

    res.json(data || []);
  } catch (err) {
    console.error("Categories API exception:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────

// GET /api/products — public feed, excludes sold items
app.get("/api/products", async (req, res) => {
  const { category_id } = req.query;
  try {
    let query = supabase.from("products").select("*");

    if (category_id) {
      query = query
        .eq("category_id", category_id)
        .order("created_at", { ascending: false });
    } else {
      // For home page, return recent items ordered by newest first
      query = query.order("created_at", { ascending: false }).limit(1000);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // Exclude items explicitly marked as sold (NULL or 'available' are shown)
    const available = (data || []).filter((p) => p.status !== "sold");

    // Ensure newest items are first regardless of DB ordering oddities
    const sorted = available.slice().sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return db - da;
    });

    if (category_id) {
      return res.json(sorted);
    }

    // home: return top N recent items
    res.json(sorted.slice(0, 30));
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/search?q=term — MUST come before /api/products/:id
app.get("/api/products/search", async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);
  const term = q.trim().toLowerCase();

  try {
    const [prodRes, catRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*"),
    ]);

    if (prodRes.error)
      return res.status(500).json({ error: prodRes.error.message });

    const categories = catRes.data || [];
    const catMap = {};
    categories.forEach((c) => {
      catMap[c.id] = c.name ? c.name.toLowerCase() : "";
    });

    const filtered = (prodRes.data || []).filter((p) => {
      if (p.status === "sold") return false;

      const nameMatch = p.name && p.name.toLowerCase().includes(term);
      const descMatch =
        p.description && p.description.toLowerCase().includes(term);
      const catName = p.category_id ? catMap[p.category_id] : "";
      const catMatch = catName && catName.includes(term);

      return nameMatch || descMatch || catMatch;
    });

    res.json(filtered);
  } catch (err) {
    console.error("Search API exception:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Product not found" });
  res.json(data);
});

// POST /api/products
app.post("/api/products", async (req, res) => {
  try {
    const {
      title,
      details,
      price,
      category,
      location,
      imageData,
      imageName,
      uploader_id,
    } = req.body;

    if (!title || !price || !category || !location) {
      return res
        .status(400)
        .json({ error: "Title, price, category, and location are required." });
    }

    let imageUrl = null;

    if (imageData && imageName) {
      try {
        const extension = imageName.split(".").pop()?.toLowerCase() || "jpg";
        const contentType =
          extension === "png"
            ? "image/png"
            : extension === "webp"
              ? "image/webp"
              : "image/jpeg";
        const fileName = `${Date.now()}-${imageName.replace(/\s+/g, "-")}`;

        // Use admin client for storage upload when possible
        const storageClient = supabaseServiceRoleKey ? supabaseAdmin : supabase;

        let uploadRes = await storageClient.storage
          .from("products")
          .upload(fileName, Buffer.from(imageData, "base64"), {
            contentType,
            upsert: false,
          });

        // If bucket not found and we have a service role key, try to create the bucket then retry
        if (
          uploadRes.error &&
          uploadRes.error.message &&
          uploadRes.error.message.toLowerCase().includes("bucket not found") &&
          supabaseServiceRoleKey
        ) {
          try {
            console.log("Creating missing storage bucket: products");
            const createRes = await supabaseAdmin.storage.createBucket(
              "products",
              { public: true },
            );
            if (createRes.error) {
              console.error("Bucket creation failed:", createRes.error);
            } else {
              // retry upload
              uploadRes = await storageClient.storage
                .from("products")
                .upload(fileName, Buffer.from(imageData, "base64"), {
                  contentType,
                  upsert: false,
                });
            }
          } catch (createErr) {
            console.error("Bucket creation exception:", createErr);
          }
        }

        if (uploadRes.error) {
          console.error(
            "Image upload error (using Data URL fallback):",
            uploadRes.error.message || uploadRes.error,
          );
          imageUrl = `data:${contentType};base64,${imageData}`;
        } else {
          // getPublicUrl returns { data: { publicUrl } }
          const publicRes = storageClient.storage
            .from("products")
            .getPublicUrl(fileName);
          imageUrl =
            publicRes?.data?.publicUrl ||
            `data:${contentType};base64,${imageData}`;
        }
      } catch (storageError) {
        console.error(
          "Image upload exception (using Data URL fallback):",
          storageError,
        );
        imageUrl = `data:image/jpeg;base64,${imageData}`;
      }
    }

    let categoryId = null;
    try {
      // Fetch existing categories from Supabase
      let { data: existingCats } = await dbClient
        .from("categories")
        .select("id, name");

      if (!existingCats || existingCats.length === 0) {
        await ensureCategoriesExist();
        const retry = await dbClient.from("categories").select("id, name");
        existingCats = retry.data || [];
      }

      if (Array.isArray(existingCats) && existingCats.length > 0) {
        const match = existingCats.find(
          (c) =>
            (c.name &&
              c.name.toLowerCase() === String(category).toLowerCase()) ||
            c.id === category,
        );
        if (match) {
          categoryId = match.id;
        } else {
          // Try inserting new category
          const { data: newCat } = await dbClient
            .from("categories")
            .insert({ name: category })
            .select()
            .maybeSingle();

          if (newCat?.id) {
            categoryId = newCat.id;
          } else {
            // Fallback to first existing category ID
            categoryId = existingCats[0].id;
          }
        }
      }
    } catch (catErr) {
      console.error("Category resolution exception:", catErr);
    }

    const productPayload = buildProductPayload({
      title,
      details,
      price,
      categoryId,
      location,
      imageUrl,
    });

    // attach uploader if provided (now always sent from post.jsx)
    if (uploader_id) productPayload.uploader_id = String(uploader_id);

    const { data, error } = await dbClient
      .from("products")
      .insert(productPayload)
      .select()
      .single();

    if (error) {
      console.error("Product insert error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ product: data });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id — owner-only edit
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { title, details, price, category_id, uploader_id, status } = req.body;

  if (!uploader_id) {
    return res.status(400).json({ error: "uploader_id is required" });
  }

  // Verify ownership — use maybeSingle so duplicate rows don't crash
  const { data: existing, error: fetchErr } = await supabase
    .from("products")
    .select("uploader_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return res.status(500).json({ error: fetchErr.message });
  if (!existing) return res.status(404).json({ error: "Product not found" });
  if (String(existing.uploader_id) !== String(uploader_id)) {
    return res
      .status(403)
      .json({ error: "Not authorized to edit this product" });
  }

  const updates = {};
  if (title !== undefined) updates.name = title.trim();
  if (details !== undefined) updates.description = details.trim();
  if (price !== undefined && !isNaN(parseFloat(price))) {
    updates.price = parseFloat(price);
  }
  if (category_id !== undefined && category_id !== "") {
    updates.category_id = category_id;
  }
  if (status !== undefined && ["available", "sold"].includes(status)) {
    updates.status = status;
  }

  // Use .select() without .single() — return first updated row
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ product: Array.isArray(data) ? data[0] : data });
});

// DELETE /api/products/:id — owner-only delete
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { uploader_id } = req.body;

  if (!uploader_id) {
    return res.status(400).json({ error: "uploader_id is required" });
  }

  // Verify ownership — maybeSingle handles duplicate rows gracefully
  const { data: existing, error: fetchErr } = await supabase
    .from("products")
    .select("uploader_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return res.status(500).json({ error: fetchErr.message });
  if (!existing) return res.status(404).json({ error: "Product not found" });
  if (String(existing.uploader_id) !== String(uploader_id)) {
    return res
      .status(403)
      .json({ error: "Not authorized to delete this product" });
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ ok: true });
});

// GET /api/users/:id/products — all products for this user (including sold)
app.get("/api/users/:id/products", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("uploader_id", id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (err) {
    console.error("Fetch user products error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── WISHLIST API ─────────────────────────────────────────────────────

// GET /api/wishlist/:userId — fetch DB-persisted wishlist
app.get("/api/wishlist/:userId", async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from("wishlists")
    .select("product_id, products(*)")
    .eq("user_id", userId);

  if (error) return res.status(500).json({ error: error.message });
  // Return flat array of product objects
  const products = (data || []).map((w) => w.products).filter(Boolean);
  res.json(products);
});

// POST /api/wishlist — add product to wishlist
app.post("/api/wishlist", async (req, res) => {
  const { user_id, product_id } = req.body;
  if (!user_id || !product_id) {
    return res
      .status(400)
      .json({ error: "user_id and product_id are required" });
  }

  const { data, error } = await supabase
    .from("wishlists")
    .upsert(
      { user_id: String(user_id), product_id },
      { onConflict: "user_id,product_id" },
    )
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/wishlist/:userId/:productId — remove from wishlist
app.delete("/api/wishlist/:userId/:productId", async (req, res) => {
  const { userId, productId } = req.params;
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── ORDERS API ───────────────────────────────────────────────────────

// GET /api/orders/user/:userId — all deals (buyer or seller)
// MUST come before /api/orders/:id to avoid route collision
app.get("/api/orders/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from("orders")
    .select("*, products(id, name, image_url, price)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// POST /api/orders — buyer creates a purchase request
app.post("/api/orders", async (req, res) => {
  const { product_id, buyer_id, seller_id } = req.body;
  if (!product_id || !buyer_id || !seller_id) {
    return res
      .status(400)
      .json({ error: "product_id, buyer_id, and seller_id are required" });
  }
  if (String(buyer_id) === String(seller_id)) {
    return res.status(400).json({ error: "You cannot buy your own product" });
  }

  // Confirm product is still available
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("name, status")
    .eq("id", product_id)
    .single();

  if (prodErr) return res.status(500).json({ error: prodErr.message });
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.status === "sold") {
    return res
      .status(409)
      .json({ error: "This product has already been sold" });
  }

  // Create the order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      product_id,
      buyer_id: String(buyer_id),
      seller_id: String(seller_id),
      status: "pending",
    })
    .select()
    .single();

  if (orderErr) return res.status(500).json({ error: orderErr.message });

  // Notify the seller
  await supabase.from("notifications").insert({
    user_id: String(seller_id),
    type: "purchase_request",
    related_product_id: product_id,
    related_order_id: order.id,
    status: "unread",
    extra_data: { buyer_id: String(buyer_id), product_name: product.name },
  });

  res.status(201).json({ order });
});

// PUT /api/orders/:id — seller accepts or declines
app.put("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["accepted", "declined"].includes(status)) {
    return res
      .status(400)
      .json({ error: "status must be 'accepted' or 'declined'" });
  }

  // Fetch the order first
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr) return res.status(500).json({ error: fetchErr.message });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "pending") {
    return res.status(409).json({ error: "Order has already been resolved" });
  }

  // Update order status
  const { data: updatedOrder, error: updateErr } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  // If accepted: mark product as sold
  if (status === "accepted") {
    await supabase
      .from("products")
      .update({ status: "sold" })
      .eq("id", order.product_id);
  }

  // Fetch product name for buyer notification
  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("id", order.product_id)
    .single();

  // Notify the buyer
  await supabase.from("notifications").insert({
    user_id: String(order.buyer_id),
    type: status === "accepted" ? "purchase_accepted" : "purchase_declined",
    related_product_id: order.product_id,
    related_order_id: id,
    status: "unread",
    extra_data: {
      seller_id: String(order.seller_id),
      product_name: product?.name,
    },
  });

  res.json({ order: updatedOrder });
});

// ─── NOTIFICATIONS API ────────────────────────────────────────────────

// GET /api/notifications/:userId
app.get("/api/notifications/:userId", async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from("notifications")
    .select("*, products(id, name, image_url, price)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// PUT /api/notifications/:id/read — mark a notification as read
app.put("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("notifications")
    .update({ status: "read" })
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── AUTH / DAuth ─────────────────────────────────────────────────────

async function exchangeDAuthCode(code, redirectUri) {
  const clientId = process.env.DAUTH_CLIENT_ID;
  const clientSecret = process.env.DAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "DAuth client credentials are not configured on the backend.",
    );
  }

  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  let tokenRes = await fetch("https://auth.delta.nitt.edu/api/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();

    if (err.includes("invalid_client")) {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64",
      );
      const fallbackParams = new URLSearchParams({
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      });

      tokenRes = await fetch("https://auth.delta.nitt.edu/api/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: fallbackParams,
      });
    }
  }

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  const userRes = await fetch(
    "https://auth.delta.nitt.edu/api/resources/user",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!userRes.ok) {
    const err = await userRes.text();
    throw new Error(`User fetch failed: ${err}`);
  }

  const userData = await userRes.json();
  return { userData, accessToken };
}

// POST /api/auth/dauth/callback
app.post("/api/auth/dauth/callback", async (req, res) => {
  const { code, redirectUri } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const resolvedRedirectUri = redirectUri || process.env.DAUTH_REDIRECT_URI;

    if (!resolvedRedirectUri) {
      return res
        .status(500)
        .json({ error: "DAuth redirect URI is not configured." });
    }

    const { userData, accessToken } = await exchangeDAuthCode(
      code,
      resolvedRedirectUri,
    );

    res.json({ user: userData, token: accessToken });
  } catch (error) {
    console.error("DAuth Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/dauth/callback
app.get("/api/auth/dauth/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({ error: String(error) });
  }

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    const targetRedirectUri = process.env.DAUTH_REDIRECT_URI || "https://campuscart-frontend-92d1.onrender.com/auth/callback";
    const { userData, accessToken } = await exchangeDAuthCode(
      code,
      targetRedirectUri,
    );

    const frontendCallback = new URL(targetRedirectUri);
    frontendCallback.searchParams.set("token", accessToken);
    frontendCallback.searchParams.set("user", JSON.stringify(userData));

    return res.redirect(302, frontendCallback.toString());
  } catch (error) {
    console.error("DAuth Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/dauth/url
app.get("/api/auth/dauth/url", (req, res) => {
  const clientId = process.env.DAUTH_CLIENT_ID;
  const redirectUri = req.query.redirectUri || process.env.DAUTH_REDIRECT_URI;
  const state = Math.random().toString(36).substring(7); // Simple random state

  if (!clientId || !redirectUri) {
    return res
      .status(500)
      .json({ error: "DAuth credentials not configured on backend." });
  }

  // Common DAuth scopes: email, profile, user, openid, oidc
  const authUrl = `https://auth.delta.nitt.edu/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent("email profile user oidc")}&state=${state}&nonce=${state}`;

  res.json({ url: authUrl });
});

// ─── MESSAGES API ────────────────────────────────────────────────────

// GET /api/messages/chats/:userId
// Returns the list of people this user has chatted with + the last message
app.get("/api/messages/chats/:userId", async (req, res) => {
  const { userId } = req.params;

  // Fetch all messages where this user is sender OR receiver
  let { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq."${userId}",receiver_id.eq."${userId}"`)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Group messages by the OTHER person in the conversation
  const chatMap = {};

  for (const msg of data) {
    let sender = msg.sender_id;
    let receiver = msg.receiver_id;

    const otherUser = sender === userId ? receiver : sender;
    if (!chatMap[otherUser]) {
      chatMap[otherUser] = {
        userId: otherUser,
        lastMessage: msg.content,
        time: msg.created_at,
        unread: receiver === userId && !msg.read,
      };
    }
  }

  res.json(Object.values(chatMap));
});

// GET /api/messages/conversation/:user1/:user2
// Returns all messages between two users, sorted oldest to newest
app.get("/api/messages/conversation/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;

  let { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq."${user1}",receiver_id.eq."${user2}"),and(sender_id.eq."${user2}",receiver_id.eq."${user1}")`,
    )
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// POST /api/messages
// Send a new message
app.post("/api/messages", async (req, res) => {
  const { sender_id, receiver_id, content } = req.body;

  if (!sender_id || !receiver_id || !content) {
    return res
      .status(400)
      .json({ error: "sender_id, receiver_id, and content are required." });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id, receiver_id, content })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
// ─── SUGGESTIONS API ──────────────────────────────────────────────────

// POST /api/suggestions — save user suggestion to database
app.post("/api/suggestions", async (req, res) => {
  const { user_id, user_name, suggestion } = req.body;

  if (!suggestion || !suggestion.trim()) {
    return res.status(400).json({ error: "Suggestion text is required." });
  }

  const suggestionText = suggestion.trim();
  const senderId = user_id ? String(user_id) : null;

  try {
    // 1. Try table "Suggestions" (Capital S) with columns content & sender_id
    let payload = { content: suggestionText };
    if (senderId) payload.sender_id = senderId;

    let { data, error } = await dbClient
      .from("Suggestions")
      .insert(payload)
      .select();

    // 2. Fallback: try lowercase "suggestions" if "Suggestions" doesn't exist
    if (error && error.code === "PGRST205") {
      const fallbackPayload = {
        suggestion: suggestionText,
        user_id: senderId,
        user_name: user_name || null,
      };
      const fallbackRes = await dbClient
        .from("suggestions")
        .insert(fallbackPayload)
        .select();

      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      console.error("Suggestion insert error:", error);
      if (error.code === "42501") {
        return res.status(403).json({
          error:
            'Supabase Row Level Security (RLS) is blocking inserts into table "Suggestions". Please disable RLS on table "Suggestions" in Supabase Dashboard (or add an INSERT policy for anon/authenticated roles).',
        });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ suggestion: Array.isArray(data) ? data[0] : data });
  } catch (err) {
    console.error("Suggestion API exception:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
