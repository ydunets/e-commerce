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
