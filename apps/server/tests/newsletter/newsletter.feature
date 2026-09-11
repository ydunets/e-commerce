@newsletter
Feature: Newsletter subscriptions
  Scenario: A new address subscribes successfully
    When I subscribe "char-newsletter-new@example.com"
    Then the subscription succeeds
    And exactly one subscriber exists for "char-newsletter-new@example.com"

  Scenario: Repeated subscriptions normalise email case and remain idempotent
    When I subscribe "CHAR-NEWSLETTER-DUPLICATE@EXAMPLE.COM"
    Then the subscription succeeds
    When I subscribe "char-newsletter-duplicate@example.com"
    Then the subscription succeeds
    And exactly one subscriber exists for "char-newsletter-duplicate@example.com"

  Scenario: Invalid email is rejected
    When I subscribe "char-newsletter-invalid"
    Then I receive an error "Bad Request" with status code 400
    And the response carries the error envelope

  Scenario: Legacy single-element email arrays remain accepted
    When I subscribe with the email array containing "char-newsletter-array@example.com"
    Then the subscription succeeds
    And exactly one subscriber exists for "char-newsletter-array@example.com"

  Scenario: Unexpected persistence failures do not disclose internal diagnostics
    Given newsletter persistence fails unexpectedly
    When I subscribe "char-newsletter-failure@example.com"
    Then I receive an error "Internal Server Error" with status code 500
    And the response carries the error envelope
    And the subscription failure hides internal diagnostics
