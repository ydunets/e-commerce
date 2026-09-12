import { Module } from '@nestjs/common';
import { NewsletterModule } from '#src/modules/newsletter/newsletter.module';
import { ProductModule } from '#src/modules/product/product.module';
import { LegacyReviewSummaryHandler } from './migration/legacy-review-summary.handler.js';

@Module({ imports: [NewsletterModule, ProductModule], providers: [LegacyReviewSummaryHandler] })
export class AppModule {}
