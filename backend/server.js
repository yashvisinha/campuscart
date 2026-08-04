const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { buildProductPayload } = require("./productService");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
// If a service role key is available, create an admin client for storage operations
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseKey,
);

// GET /api/categories
app.get("/api/categories", async (req, res) => {
  console.log("Fetching categories...");
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at");
  console.log("Data:", data, "Error:", error);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/products
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

    // Ensure newest items are first regardless of DB ordering oddities
    const sorted = (data || []).slice().sort((a, b) => {
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

// GET /api/products/:id
app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

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
          console.error("Image upload error:", uploadRes.error);
        } else {
          // getPublicUrl returns { data: { publicUrl } }
          const publicRes = storageClient.storage
            .from("products")
            .getPublicUrl(fileName);
          const publicUrl = publicRes?.data?.publicUrl || null;
          imageUrl = publicUrl;
        }
      } catch (storageError) {
        console.error("Image upload exception:", storageError);
      }
    }

    const categoryResult = await supabase
      .from("categories")
      .select("id")
      .eq("name", category)
      .maybeSingle();
    if (categoryResult.error) {
      console.error("Category lookup error:", categoryResult.error);
      return res.status(500).json({ error: categoryResult.error.message });
    }

    let categoryId = categoryResult.data?.id;

    if (!categoryId) {
      const createCategoryResult = await supabase
        .from("categories")
        .insert({ name: category })
        .select("id")
        .single();
      if (createCategoryResult.error) {
        console.error("Category creation error:", createCategoryResult.error);
        return res
          .status(500)
          .json({ error: createCategoryResult.error.message });
      }
      categoryId = createCategoryResult.data.id;
    }

    const productPayload = buildProductPayload({
      title,
      details,
      price,
      categoryId,
      location,
      imageUrl,
    });

    // attach uploader if provided
    if (uploader_id) productPayload.uploader_id = uploader_id;

    const { data, error } = await supabase
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

// GET /api/users/:id/products
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

async function exchangeDAuthCode(code, redirectUri) {
  const tokenParams = new URLSearchParams({
    client_id: process.env.DAUTH_CLIENT_ID,
    client_secret: process.env.DAUTH_CLIENT_SECRET,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const tokenRes = await fetch("https://auth.delta.nitt.edu/api/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams,
  });

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
    const { userData, accessToken } = await exchangeDAuthCode(
      code,
      process.env.DAUTH_REDIRECT_URI,
    );

    const frontendCallback = new URL("http://localhost:5173/auth/callback");
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

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
