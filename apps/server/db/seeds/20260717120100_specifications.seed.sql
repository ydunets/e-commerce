-- migrate:up
INSERT INTO specifications (specification_id, label, title, description, image_url, image_alt, sort_order) VALUES
  ('sustainability', 'Sustainability', 'Eco-Friendly Choice', 'With our sustainable approach, we curate clothing that makes a statement of care—care for the planet, and for the art of fashion.', '/images/specifications/sustainability.jpg', 'Woman hiding her face behind the rolled collar of a yellow cashmere sweater', 1),
  ('comfort', 'Comfort', 'Uncompromised Comfort', 'Our garments are a sanctuary of softness, tailored to drape gracefully and allow for freedom of movement.', '/images/specifications/comfort.jpg', 'Close-up of softly draped charcoal fabric', 2),
  ('durability', 'Durability', 'Built to Last', 'Here’s to apparel that you can trust to look as good as new, wear after wear, year after year.', '/images/specifications/durability.jpg', 'Stack of neatly folded knitwear resting on a white chair', 3),
  ('versatility', 'Versatility', 'Versatile by Design', 'Our pieces are a celebration of versatility, offering a range of styles that are as perfect for a business meeting as they are for a casual brunch.', '/images/specifications/versatility.jpg', 'Rack of neutral-toned garments hanging beside stems of dried pampas grass', 4);

INSERT INTO specification_features (specification_id, icon, label, sort_order) VALUES
  ('sustainability', 'recycle-line', 'Recycled Materials', 1),
  ('sustainability', 'paint-line', 'Low Impact Dye', 2),
  ('sustainability', 'plant-line', 'Carbon Neutral', 3),
  ('sustainability', 'water-flash-line', 'Water Conservation', 4),
  ('comfort', 't-shirt-line', 'Ergonomic Fits', 1),
  ('comfort', 'hand-heart-line', 'Soft-to-the-Touch Fabrics', 2),
  ('comfort', 'windy-line', 'Breathable Weaves', 3),
  ('comfort', 'color-filter-line', 'Thoughtful Design', 4),
  ('durability', 'stack-line', 'Reinforced Construction', 1),
  ('durability', 'scales-2-line', 'Quality Control', 2),
  ('durability', 'shield-star-line', 'Material Resilience', 3),
  ('durability', 'price-tag-2-line', 'Warranty and Repair', 4),
  ('versatility', 'rainbow-line', 'Adaptive Styles', 1),
  ('versatility', 'shirt-line', 'Functional Fashion', 2),
  ('versatility', 'infinity-fill', 'Timeless Aesthetics', 3),
  ('versatility', 'shapes-line', 'Mix-and-Match Potential', 4);

-- migrate:down
DELETE FROM specification_features;
DELETE FROM specifications;
