const test = require('node:test');
const assert = require('node:assert/strict');
const { buildProductPayload } = require('./productService');

test('buildProductPayload combines description and location into the product record', () => {
  const payload = buildProductPayload({
    title: 'Calculator',
    details: 'Almost new',
    price: '20',
    categoryId: 'cat-1',
    location: 'Hostel A',
    imageUrl: 'https://example.com/calculator.png',
  });

  assert.equal(payload.name, 'Calculator');
  assert.equal(payload.description, 'Almost new\nLocation: Hostel A');
  assert.equal(payload.price, 20);
  assert.equal(payload.category_id, 'cat-1');
  assert.equal(payload.image_url, 'https://example.com/calculator.png');
});

test('regression: product description never injects "Rohan" or fake default seller names', () => {
  const payload = buildProductPayload({
    title: 'Notebook',
    details: 'Brand new lined notebook',
    price: '5.00',
    categoryId: 'cat-2',
    location: 'Library',
    imageUrl: null,
  });

  assert.doesNotMatch(payload.description, /Rohan/i);
  assert.equal(payload.description, 'Brand new lined notebook\nLocation: Library');
});
