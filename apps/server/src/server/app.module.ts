import { Module } from '@nestjs/common';
import { NewsletterModule } from '#src/modules/newsletter/newsletter.module';
import { ProductModule } from '#src/modules/product/product.module';
import { ReviewModule } from '#src/modules/review/review.module';

@Module({ imports: [NewsletterModule, ProductModule, ReviewModule] })
export class AppModule {}
