@runtime
Feature: Compiled application bootstrap
  Scenario: Compiled autoload exposes every existing business endpoint
    When I request "/api-docs/json"
    Then the compiled API documents every existing business endpoint

  Scenario: The compiled health endpoint reaches the seeded database
    When I request "/health"
    Then the compiled API is healthy
