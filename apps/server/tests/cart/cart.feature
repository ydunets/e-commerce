@cart
Feature: Shopping cart behaviour
  An API consumer can add an inventory item to a cart, read the cart,
  change a line's quantity, and remove a line. The first add without a
  cart identifier mints the cart implicitly (ADR 0002).

  Background:
    Given an inventory item "char-cart-hoodie-black" with stock 5
    And an inventory item "char-cart-hoodie-white" with stock 2
    And an inventory item "char-cart-soldout-tee" with stock 0

  Scenario: First add without a cart identifier mints the cart
    When I add 2 units of "char-cart-hoodie-black" to a new cart
    Then the response returns a cart identifier
    And the cart has 1 line and 2 total units

  Scenario: Adding an already-present SKU merges into one line
    Given I add 2 units of "char-cart-hoodie-black" to a new cart
    When I add 1 unit of "char-cart-hoodie-black" to the cart
    Then the cart has 1 line and 3 total units
    And the cart line "char-cart-hoodie-black" has quantity 3

  Scenario: Adding a second SKU appends a line to the same cart
    Given I add 2 units of "char-cart-hoodie-black" to a new cart
    When I add 1 unit of "char-cart-hoodie-white" to the cart
    Then the cart has 2 lines and 3 total units

  Scenario: An add pushing a line above stock is rejected
    Given I add 4 units of "char-cart-hoodie-black" to a new cart
    When I add 2 units of "char-cart-hoodie-black" to the cart
    Then I receive an error "Conflict" with status code 409
    And the response carries the error envelope

  Scenario: Adding an out-of-stock SKU is rejected
    When I add 1 unit of "char-cart-soldout-tee" to a new cart
    Then I receive an error "Conflict" with status code 409
    And the response carries the error envelope

  Scenario: Adding an unknown SKU yields not found
    When I add 1 unit of "char-cart-missing-sku" to a new cart
    Then I receive an error "Not Found" with status code 404
    And the response carries the error envelope

  Scenario: Adding to an unknown cart yields not found
    When I add 1 unit of "char-cart-hoodie-black" to the unknown cart "00000000-0000-4000-8000-000000000000"
    Then I receive an error "Not Found" with status code 404

  Scenario: Reading an unknown cart yields not found
    When I get the cart "00000000-0000-4000-8000-000000000000"
    Then I receive an error "Not Found" with status code 404
    And the response carries the error envelope

  Scenario: The cart read returns product details and current inventory prices
    Given I add 2 units of "char-cart-hoodie-black" to a new cart
    And I add 2 units of "char-cart-hoodie-white" to the cart
    And inventory item "char-cart-hoodie-black" now has list price 40, discount 25 and sale price 30
    When I get the cart
    Then the cart has 2 lines and 4 total units
    And the cart lines carry product details and current prices:
      | sku                   | quantity | list_price | discount_percentage | sale_price | stock |
      | char-cart-hoodie-white | 2        | 10         | null                | 10         | 2     |
      | char-cart-hoodie-black | 2        | 40         | 25                  | 30         | 5     |

  Scenario: Updating a line's quantity
    Given I add 1 unit of "char-cart-hoodie-black" to a new cart
    When I set the quantity of "char-cart-hoodie-black" to 4
    Then the cart line "char-cart-hoodie-black" has quantity 4

  Scenario: An update above stock is rejected
    Given I add 1 unit of "char-cart-hoodie-black" to a new cart
    When I set the quantity of "char-cart-hoodie-black" to 9
    Then I receive an error "Conflict" with status code 409

  Scenario: Updating a SKU that is not in the cart yields not found
    Given I add 1 unit of "char-cart-hoodie-black" to a new cart
    When I set the quantity of "char-cart-hoodie-white" to 1
    Then I receive an error "Not Found" with status code 404

  Scenario: Removing a line
    Given I add 1 unit of "char-cart-hoodie-black" to a new cart
    And I add 1 unit of "char-cart-hoodie-white" to the cart
    When I remove "char-cart-hoodie-white" from the cart
    Then the cart has 1 line and 1 total unit

  Scenario: Removing the last line leaves an empty cart
    Given I add 1 unit of "char-cart-hoodie-black" to a new cart
    When I remove "char-cart-hoodie-black" from the cart
    And I get the cart
    Then the cart has 0 lines and 0 total units

  Scenario: Removing a SKU that is not in the cart yields not found
    Given I add 1 unit of "char-cart-hoodie-black" to a new cart
    When I remove "char-cart-hoodie-white" from the cart
    Then I receive an error "Not Found" with status code 404

  Scenario: Stock reconciliation clamps a line and reports the reduction
    Given I add 4 units of "char-cart-hoodie-black" to a new cart
    And inventory item "char-cart-hoodie-black" now has stock 2
    When I validate the cart stock
    Then stock validation reports:
      | sku                    | previous_quantity | quantity | stock |
      | char-cart-hoodie-black | 4                 | 2        | 2     |
    When I get the cart
    Then the cart matches the stock validation response
    And the cart has 1 line and 2 total units
    And the cart line "char-cart-hoodie-black" has quantity 2

  Scenario: Stock reconciliation removes a sold-out line and retains the other line
    Given I add 2 units of "char-cart-hoodie-black" to a new cart
    And I add 1 unit of "char-cart-hoodie-white" to the cart
    And inventory item "char-cart-hoodie-black" now has stock 0
    When I validate the cart stock
    Then stock validation reports:
      | sku                    | previous_quantity | quantity | stock |
      | char-cart-hoodie-black | 2                 | 0        | 0     |
    When I get the cart
    Then the cart matches the stock validation response
    And the cart has 1 line and 1 total unit
    And the cart line "char-cart-hoodie-white" has quantity 1

  Scenario: Stock reconciliation is a no-op when quantities remain available
    Given I add 2 units of "char-cart-hoodie-black" to a new cart
    When I validate the cart stock
    Then stock validation reports no changes
    When I get the cart
    Then the cart matches the stock validation response
    And the cart has 1 line and 2 total units

  Scenario: Validating an unknown cart yields not found
    Given the current cart identifier is "00000000-0000-4000-8000-000000000000"
    When I validate the cart stock
    Then I receive an error "Not Found" with status code 404
    And the response carries the error envelope

  Scenario Outline: Reference coupons apply with their declared discount
    Given I add 1 unit of "char-cart-hoodie-black" to a new cart
    When I apply coupon "<code>"
    Then the cart coupons are:
      | code   | discount_type | value   |
      | <code> | <type>        | <value> |
    When I get the cart
    Then the cart coupons are:
      | code   | discount_type | value   |
      | <code> | <type>        | <value> |

    Examples:
      | code      | type       | value |
      | WELCOME15 | percentage | 15    |
      | SAVE20    | fixed      | 20    |

  Scenario Outline: Coupons stack in application order and reapplying one is a no-op
    Given I add 2 units of "char-cart-hoodie-black" to a new cart
    And I apply coupon "<first>"
    When I apply coupon "<second>"
    Then the cart coupons are:
      | code     | discount_type | value         |
      | <first>  | <first_type>  | <first_value> |
      | <second> | <second_type> | <second_value> |
    Given I record the cart response
    When I apply coupon "<first>"
    Then the cart response is unchanged
    When I get the cart
    Then the cart response is unchanged

    Examples:
      | first     | first_type | first_value | second    | second_type | second_value |
      | WELCOME15 | percentage | 15          | SAVE20    | fixed       | 20           |
      | SAVE20    | fixed      | 20          | WELCOME15 | percentage  | 15           |

  Scenario: An unknown coupon yields not found and leaves the cart unchanged
    Given I add 1 unit of "char-cart-hoodie-black" to a new cart
    And I record the cart response
    When I apply coupon "CHAR-CART-MISSING"
    Then I receive an error "Not Found" with status code 404
    When I get the cart
    Then the cart response is unchanged

  Scenario: Applying a coupon to an unknown cart yields not found
    Given the current cart identifier is "00000000-0000-4000-8000-000000000000"
    When I apply coupon "WELCOME15"
    Then I receive an error "Not Found" with status code 404

  Scenario: Removing a coupon preserves the remaining coupon and cart lines
    Given I add 2 units of "char-cart-hoodie-black" to a new cart
    And I apply coupon "WELCOME15"
    And I apply coupon "SAVE20"
    When I remove coupon "WELCOME15"
    Then the cart coupons are:
      | code   | discount_type | value |
      | SAVE20 | fixed         | 20    |
    And the cart has 1 line and 2 total units
    When I get the cart
    Then the cart coupons are:
      | code   | discount_type | value |
      | SAVE20 | fixed         | 20    |
    And the cart line "char-cart-hoodie-black" has quantity 2

  Scenario: Removing a coupon not applied to the cart yields not found
    Given I add 1 unit of "char-cart-hoodie-black" to a new cart
    And I record the cart response
    When I remove coupon "WELCOME15"
    Then I receive an error "Not Found" with status code 404
    When I get the cart
    Then the cart response is unchanged

  Scenario: Removing a coupon from an unknown cart yields not found
    Given the current cart identifier is "00000000-0000-4000-8000-000000000000"
    When I remove coupon "WELCOME15"
    Then I receive an error "Not Found" with status code 404
