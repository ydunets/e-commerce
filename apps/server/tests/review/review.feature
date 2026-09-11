@review
Feature: Product review reads
  Background:
    Given a seeded product with several reviews of different ratings

  Scenario: Review pagination preserves the count and returns the requested page
    When I request reviews with query "page=1&limit=2"
    Then the review page contains 2 reviews starting at offset 2
    And review entries carry the public response fields

  Scenario: A rating filter narrows the reviews and their count
    When I request reviews for one recorded rating
    Then only the reviews with that rating are returned

  Scenario: An unknown query key does not change the review page
    When I request reviews with query "page=1&limit=2&unrecognised=ignored"
    Then the review page contains 2 reviews starting at offset 2

  Scenario Outline: Out-of-range ratings are rejected
    When I request reviews with query "rating=<rating>"
    Then I receive an error "Bad Request" with status code 400
    And the response carries the error envelope

    Examples:
      | rating |
      | 0      |
      | 6      |

  Scenario: Review summaries agree with the published reviews
    When I request the review summary
    Then the summary contains the total, average and all five rating counts

  Scenario Outline: Both review routes reject an unknown product
    When I request "/api/v1/products/char-review-missing/reviews<suffix>"
    Then I receive an error "Not Found" with status code 404
    And the response carries the error envelope

    Examples:
      | suffix   |
      |          |
      | /summary |
