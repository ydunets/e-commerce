import { expect, rstest, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from '@/shared/ui/star-rating';
import { StarRatingInput } from '@/shared/ui/star-rating-input';

const RATING = 4.4;
const REVIEW_COUNT = 62;
const SEE_ALL = { name: `See all ${REVIEW_COUNT} reviews` } as const;
const REVIEWS_HREF = '/reviews';
const WRITE_HREF = '/write-review';
const MAX_STARS = 5;
const CURRENT = 3;

test('summary with reviews renders the value, stars, and a reviews link', () => {
  render(
    <StarRating
      rating={RATING}
      reviewCount={REVIEW_COUNT}
      reviewsHref={REVIEWS_HREF}
    />,
  );

  expect(screen.getByText(String(RATING))).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: `Rated ${RATING} out of ${MAX_STARS}` }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', SEE_ALL)).toHaveAttribute(
    'href',
    REVIEWS_HREF,
  );
});

test('onReviewsClick swaps the reviews link for a button', async () => {
  const user = userEvent.setup();
  const onReviewsClick = rstest.fn();
  render(
    <StarRating
      rating={RATING}
      reviewCount={REVIEW_COUNT}
      onReviewsClick={onReviewsClick}
    />,
  );

  expect(screen.queryByRole('link', SEE_ALL)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', SEE_ALL));
  expect(onReviewsClick).toHaveBeenCalledTimes(1);
});

test('without reviews it invites the first review', () => {
  render(
    <StarRating rating={0} reviewCount={0} writeReviewHref={WRITE_HREF} />,
  );

  expect(screen.getByText('0')).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Not yet rated' }),
  ).toBeInTheDocument();
  expect(screen.getByText(/No reviews yet\./)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Be the first.' })).toHaveAttribute(
    'href',
    WRITE_HREF,
  );
});

test('the input renders a radio per star and reports clicks', async () => {
  const user = userEvent.setup();
  const onChange = rstest.fn();
  render(<StarRatingInput value={CURRENT} onChange={onChange} name="rating" />);

  expect(
    screen.getByRole('radiogroup', { name: 'Rating' }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole('radio')).toHaveLength(MAX_STARS);
  expect(screen.getByRole('radio', { name: `${CURRENT} stars` })).toBeChecked();

  await user.click(screen.getByRole('radio', { name: '5 stars' }));
  expect(onChange).toHaveBeenCalledWith(MAX_STARS);
});

test('the input submits the value through a hidden form field', () => {
  const { container } = render(
    <StarRatingInput value={CURRENT} onChange={() => {}} name="rating" />,
  );

  expect(container.querySelector('input[name="rating"]')).toHaveValue(
    String(CURRENT),
  );
});

test('arrow keys, Home, and End step the rating from the focused star', async () => {
  const user = userEvent.setup();
  const onChange = rstest.fn();
  render(<StarRatingInput value={CURRENT} onChange={onChange} />);

  await user.tab();
  expect(screen.getByRole('radio', { name: `${CURRENT} stars` })).toHaveFocus();

  await user.keyboard('{ArrowRight}');
  expect(onChange).toHaveBeenLastCalledWith(CURRENT + 1);

  await user.keyboard('{ArrowLeft}');
  expect(onChange).toHaveBeenLastCalledWith(CURRENT - 1);

  await user.keyboard('{Home}');
  expect(onChange).toHaveBeenLastCalledWith(1);

  await user.keyboard('{End}');
  expect(onChange).toHaveBeenLastCalledWith(MAX_STARS);
});

test('arrow keys from an empty rating land on the first star', async () => {
  const user = userEvent.setup();
  const onChange = rstest.fn();
  render(<StarRatingInput value={0} onChange={onChange} />);

  await user.tab();
  await user.keyboard('{ArrowLeft}');
  expect(onChange).toHaveBeenLastCalledWith(1);

  await user.keyboard('{ArrowRight}');
  expect(onChange).toHaveBeenLastCalledWith(1);
});

test('a read-only input cannot be changed', () => {
  render(<StarRatingInput value={CURRENT} onChange={() => {}} readOnly />);

  for (const radio of screen.getAllByRole('radio')) {
    expect(radio).toBeDisabled();
  }
});
