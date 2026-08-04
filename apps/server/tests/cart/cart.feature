@cart
Feature: Shopping cart CRUD
  An API consumer can add an inventory item to a cart, read the cart,
  change a line's quantity, and remove a line. The first add without a
  cart identifier mints the cart implicitly (ADR 0002).

  Background:
    Given an inventory item "cart-e2e-hoodie-black" with stock 5
    And an inventory item "cart-e2e-hoodie-white" with stock 2
    And an inventory item "cart-e2e-soldout-tee" with stock 0

  Scenario: First add without a cart identifier mints the cart
    When I add 2 units of "cart-e2e-hoodie-black" to a new cart
    Then the response returns a cart identifier
    And the cart has 1 line and 2 total units

  Scenario: Adding an already-present SKU merges into one line
    Given I add 2 units of "cart-e2e-hoodie-black" to a new cart
    When I add 1 unit of "cart-e2e-hoodie-black" to the cart
    Then the cart has 1 line and 3 total units
    And the cart line "cart-e2e-hoodie-black" has quantity 3

  Scenario: Adding a second SKU appends a line to the same cart
    Given I add 2 units of "cart-e2e-hoodie-black" to a new cart
    When I add 1 unit of "cart-e2e-hoodie-white" to the cart
    Then the cart has 2 lines and 3 total units

  Scenario: An add pushing a line above stock is rejected
    Given I add 4 units of "cart-e2e-hoodie-black" to a new cart
    When I add 2 units of "cart-e2e-hoodie-black" to the cart
    Then I receive an error "Conflict" with status code 409
    And the response carries the error envelope

  Scenario: Adding an out-of-stock SKU is rejected
    When I add 1 unit of "cart-e2e-soldout-tee" to a new cart
    Then I receive an error "Conflict" with status code 409
    And the response carries the error envelope

  Scenario: Adding an unknown SKU yields not found
    When I add 1 unit of "cart-e2e-missing-sku" to a new cart
    Then I receive an error "Not Found" with status code 404
    And the response carries the error envelope

  Scenario: Adding to an unknown cart yields not found
    When I add 1 unit of "cart-e2e-hoodie-black" to the unknown cart "00000000-0000-4000-8000-000000000000"
    Then I receive an error "Not Found" with status code 404

  Scenario: Reading an unknown cart yields not found
    When I get the cart "00000000-0000-4000-8000-000000000000"
    Then I receive an error "Not Found" with status code 404
    And the response carries the error envelope

  Scenario: The cart read returns lines and computed total units without prices
    Given I add 2 units of "cart-e2e-hoodie-black" to a new cart
    And I add 2 units of "cart-e2e-hoodie-white" to the cart
    When I get the cart
    Then the cart has 2 lines and 4 total units
    And the cart lines carry no prices

  Scenario: Updating a line's quantity
    Given I add 1 unit of "cart-e2e-hoodie-black" to a new cart
    When I set the quantity of "cart-e2e-hoodie-black" to 4
    Then the cart line "cart-e2e-hoodie-black" has quantity 4

  Scenario: An update above stock is rejected
    Given I add 1 unit of "cart-e2e-hoodie-black" to a new cart
    When I set the quantity of "cart-e2e-hoodie-black" to 9
    Then I receive an error "Conflict" with status code 409

  Scenario: Updating a SKU that is not in the cart yields not found
    Given I add 1 unit of "cart-e2e-hoodie-black" to a new cart
    When I set the quantity of "cart-e2e-hoodie-white" to 1
    Then I receive an error "Not Found" with status code 404

  Scenario: Removing a line
    Given I add 1 unit of "cart-e2e-hoodie-black" to a new cart
    And I add 1 unit of "cart-e2e-hoodie-white" to the cart
    When I remove "cart-e2e-hoodie-white" from the cart
    Then the cart has 1 line and 1 total unit

  Scenario: Removing the last line leaves an empty cart
    Given I add 1 unit of "cart-e2e-hoodie-black" to a new cart
    When I remove "cart-e2e-hoodie-black" from the cart
    And I get the cart
    Then the cart has 0 lines and 0 total units

  Scenario: Removing a SKU that is not in the cart yields not found
    Given I add 1 unit of "cart-e2e-hoodie-black" to a new cart
    When I remove "cart-e2e-hoodie-white" from the cart
    Then I receive an error "Not Found" with status code 404
