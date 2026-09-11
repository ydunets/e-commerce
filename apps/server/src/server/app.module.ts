import { Module } from '@nestjs/common';
import { NewsletterModule } from '#src/modules/newsletter/newsletter.module';

@Module({ imports: [NewsletterModule] })
export class AppModule {}
