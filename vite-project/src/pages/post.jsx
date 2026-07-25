import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUp,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import "./post.css";

function PostPage() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    location: "",
    details: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      alert("Please log in first.");
      setSubmitting(false);
      return;
    }

    if (!formData.title || !formData.price) {
      alert("Title and price are required.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("products").insert({
      name: formData.title,
      price: parseFloat(formData.price) || 0,
      description: `${formData.details}${formData.location ? ` Location: ${formData.location}` : ""}`,
      seller_id: userId,
      stock: 1,
      // NOTE: image_url is not set yet — image upload to Supabase Storage
      // still needs to be built, so new posts won't have a photo for now.
      // category is also not linked yet since it requires a category_id (uuid),
      // not the plain text typed in the form.
    });

    setSubmitting(false);

    if (error) {
      console.error("Error creating product:", error);
      alert("Something went wrong posting your item.");
      return;
    }

    alert("Item posted!");
    navigate("/home");
  };

  return (
    <div className="post-page">
      <section className="post-shell">
        <header className="post-header">
          <button
            type="button"
            className="post-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="post-title">Create Post</h1>
          <span className="post-header-spacer" aria-hidden="true" />
        </header>

        <form className="post-form" onSubmit={handleSubmit}>
          <label className="upload-panel" htmlFor="post-image">
            {previewUrl ? (
              <img
                className="upload-preview"
                src={previewUrl}
                alt="Selected upload preview"
              />
            ) : (
              <div className="upload-placeholder" aria-hidden="true">
                <ArrowUp size={54} strokeWidth={1.8} />
              </div>
            )}
            <span className="upload-helper">Tap to add product photo</span>
            <input
              id="post-image"
              className="visually-hidden"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>

          <div className="field-stack">
            <label className="field-row">
              <span className="visually-hidden">Title</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFieldChange}
                placeholder="Title"
              />
            </label>

            <label className="field-row">
              <span className="visually-hidden">Price</span>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleFieldChange}
                placeholder="Price"
              />
            </label>

            <label className="field-row">
              <span className="visually-hidden">Category</span>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleFieldChange}
                placeholder="Category"
              />
            </label>

            <label className="field-row">
              <span className="visually-hidden">Location</span>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleFieldChange}
                placeholder="Location"
              />
            </label>

            <label className="field-row field-row-textarea">
              <span className="visually-hidden">Details</span>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleFieldChange}
                placeholder="Description"
                rows="4"
              />
            </label>
          </div>

          <button className="post-submit-btn" type="submit" disabled={submitting}>
            {submitting ? "Posting..." : "Upload"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default PostPage;