@product
Feature: Product catalogue reads
  Scenario: The catalogue lists every seeded product newest first with per-colour cards
    Given the seeded catalogue ordering is recorded
    When I request "/api/v1/products"
    Then the catalogue matches the recorded newest-first ordering
    And each product card describes its inventory colour variants

  Scenario: Limit and offset select a stable catalogue page
    Given the full catalogue is recorded
    When I request "/api/v1/products?limit=2&offset=1"
    Then the catalogue contains 2 products starting at offset 1

  Scenario: Collection and exclusion are applied before pagination
    Given the full catalogue is recorded
    When I request other products in a seeded collection with limit 2 and offset 1
    Then only the requested collection page is returned without the excluded product

  Scenario Outline: Invalid list limits are rejected
    When I request "/api/v1/products?limit=<limit>"
    Then I receive an error "Bad Request" with status code 400
    And the response carries the error envelope

    Examples:
      | limit |
      | 0     |
      | 101   |

  Scenario: Product details include inventory, presentation fields and review aggregation
    Given the full catalogue is recorded
    When I request every seeded product detail
    Then the product detail contracts and review aggregates are preserved

  Scenario: An unknown product is not found
    When I request "/api/v1/products/char-product-missing"
    Then I receive an error "Not Found" with status code 404
    And the response carries the error envelope
