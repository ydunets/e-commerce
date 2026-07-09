import type { ReviewEntity } from '#src/modules/review/domain/review.types.ts';
import type { ReviewResponseDto } from '#src/modules/review/dtos/review.response.dto.ts';

export interface ReviewMapper {
  toResponse(entity: ReviewEntity): ReviewResponseDto;
}

export default function reviewMapper(): ReviewMapper {
  return {
    toResponse(entity: ReviewEntity): ReviewResponseDto {
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
    },
  };
}
