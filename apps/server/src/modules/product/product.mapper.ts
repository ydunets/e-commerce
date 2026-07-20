import type { ProductEntity, ProductListItem } from '#src/modules/product/domain/product.types.ts';
import type {
  ProductListItemDto,
  ProductResponseDto,
} from '#src/modules/product/dtos/product.response.dto.ts';

export interface ProductMapper {
  toResponse(entity: ProductEntity): ProductResponseDto;
  toListItemResponse(item: ProductListItem): ProductListItemDto;
}

function toPriceRange(salePrices: number[]): ProductResponseDto['priceRange'] {
  if (salePrices.length === 0) return { highest: 0, lowest: 0 };
  return { highest: Math.max(...salePrices), lowest: Math.min(...salePrices) };
}

export default function productMapper(): ProductMapper {
  return {
    toResponse(entity: ProductEntity): ProductResponseDto {
      return {
        product_id: entity.id,
        name: entity.name,
        description: entity.description,
        colors: entity.colors,
        sizes: entity.sizes,
        images: entity.images.map((image) => ({ color: image.color, image_url: image.url })),
        info: entity.info,
        inventory: entity.variants.map((variant) => ({
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          list_price: variant.listPrice,
          discount_percentage: variant.discountPercentage,
          sale_price: variant.salePrice,
          sold: variant.sold,
          stock: variant.stock,
        })),
        priceRange: toPriceRange(entity.variants.map((variant) => variant.salePrice)),
        rating: entity.reviews.average,
        reviews: entity.reviews.count,
      };
    },
    toListItemResponse(item: ProductListItem): ProductListItemDto {
      return {
        product_id: item.id,
        name: item.name,
        colors: item.colors.map((variant) => ({
          color: variant.color,
          image_url: variant.imageUrl,
          sale_price: variant.salePrice,
          list_price: variant.listPrice,
          out_of_stock: variant.outOfStock,
        })),
      };
    },
  };
}
