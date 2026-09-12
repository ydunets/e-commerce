@runtime
Feature: Compiled application bootstrap
  Scenario: Compiled Nest exposes every existing business endpoint
    When I request "/api-docs/json"
    Then the compiled API documents every existing business endpoint

  Scenario: The compiled health endpoint reaches the seeded database
    When I request "/health"
    Then the compiled API is healthy

  Scenario: Unroutable requests retain the public error envelope
    When I request "/api/v1/unknown-resource"
    Then I receive an error "Not Found" with status code 404
    And the response carries the error envelope

  Scenario: Validation retains field-level information under Nest
    When I request "/api/v1/products/char-review-missing/reviews?rating=0"
    Then I receive an error "Bad Request" with status code 400
    And the validation error identifies the invalid rating
