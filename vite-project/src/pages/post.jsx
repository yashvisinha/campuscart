import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, getUserId } from "../auth";
import {
  ArrowLeft,
  ArrowUp,
} from "lucide-react";
import "./post.css";
import { API_BASE } from '../config.js';

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
  });

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

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [categories, setCategories] = useState([]);
  const submittingRef = useRef(false); // prevents double-submit

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  useEffect(() => {
    const savedAddress = localStorage.getItem('dauth_user_address');
    const user = getUser();
    const autofillLoc = savedAddress || user?.address || "OPAL-C 99W";
    setFormData((current) => ({
      ...current,
      location: autofillLoc,
    }));
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };

    loadCategories();
  }, []);

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
    if (submittingRef.current) return; // block double-submit
    setSubmitError("");

    if (!selectedImage) {
      setSubmitError("Please add a product photo before posting.");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const base64Image = await toBase64(selectedImage);

      const currentUser = getUser();
      const response = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          details: formData.details,
          price: formData.price,
          category: formData.category,
          location: formData.location,
          imageData: base64Image,
          imageName: selectedImage.name,
          uploader_id: getUserId() || undefined,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseErr) {
        // If server returned non-JSON (e.g. HTML error page), include that text in the error
        const text = await response.text().catch(() => 'Server returned an unexpected response');
        throw new Error(text || 'Server returned an unexpected response');
      }

      if (!response.ok) {
        // Prefer API-provided error message, fall back to whole body text
        const msg = result?.error || (typeof result === 'string' ? result : JSON.stringify(result));
        throw new Error(msg || 'Unable to create post.');
      }

      navigate('/home');
    } catch (error) {
      setSubmitError(error.message || "Unable to create post.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
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
              <select
                name="category"
                value={formData.category}
                onChange={handleFieldChange}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-row field-row-readonly">
              <span className="readonly-label">Location:</span>
              <span className="readonly-value">{formData.location || "OPAL-C 99W"}</span>
              <span className="readonly-badge">Set in Settings</span>
            </div>

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

          {submitError ? <p className="post-error">{submitError}</p> : null}

          <button className="post-submit-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Uploading..." : "Upload"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default PostPage;