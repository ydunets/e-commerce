import type { ReviewRepository } from '#src/modules/review/database/review.repository.port.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export async function ensureProductExists(
  reviewRepository: ReviewRepository,
  productId: string,
): Promise<void> {
  if (!(await reviewRepository.productExists(productId))) {
    throw new NotFoundException(`Product ${productId} not found`);
  }
}
