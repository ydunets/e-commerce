@specification
Feature: Product specification content
  Scenario: The fixed specification set carries the content rendered by the client
    When I request "/api/v1/specifications"
    Then the seeded specification content is returned in display order
