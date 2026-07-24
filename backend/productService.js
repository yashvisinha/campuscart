function buildProductPayload({ title, details, price, categoryId, location, imageUrl }) {
  const cleanedTitle = (title || '').trim();
  const cleanedDetails = (details || '').trim();
  const cleanedLocation = (location || '').trim();
  const parsedPrice = Number.parseFloat(price);

  return {
    name: cleanedTitle,
    description: [cleanedDetails, cleanedLocation ? `Location: ${cleanedLocation}` : ''].filter(Boolean).join('\n'),
    price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    category_id: categoryId,
    image_url: imageUrl || null,
    stock: 1,
  };
}

module.exports = {
  buildProductPayload,
};
