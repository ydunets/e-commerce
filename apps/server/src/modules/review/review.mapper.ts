import type { ReviewEntity } from '#src/modules/review/domain/review.types';
import type { ReviewResponseDto } from '#src/modules/review/dtos/review.response.dto';

export function toReviewResponse(entity: ReviewEntity): ReviewResponseDto {
  return {
    id: entity.id,
    user_id: entity.author.userId,
    name: entity.author.name,
    avatar_url: entity.author.avatarUrl,
    rating: entity.rating,
    content: entity.content,
    // Date-only (YYYY-MM-DD) mirrors the GreatFrontend reviews API shape.
    created_at: entity.createdAt.toISOString().slice(0, 10),
  };
}
