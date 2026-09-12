import { Module } from '@nestjs/common';
import { CartModule } from '#src/modules/cart/cart.module';
import { NewsletterModule } from '#src/modules/newsletter/newsletter.module';
import { ProductModule } from '#src/modules/product/product.module';
import { ReviewModule } from '#src/modules/review/review.module';
import { SpecificationModule } from '#src/modules/specification/specification.module';

@Module({
  imports: [CartModule, NewsletterModule, ProductModule, ReviewModule, SpecificationModule],
})
export class AppModule {}
