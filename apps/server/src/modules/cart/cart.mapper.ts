import type { CartResponseDto, ValidateCartResponseDto } from '@e-commerce/contracts';
import type { CartEntity, StockChange } from '#src/modules/cart/domain/cart.types';

export const toCartResponse = (cart: CartEntity): CartResponseDto => ({
  id: cart.id,
  lines: cart.lines.map((line) => ({
    sku: line.sku,
    quantity: line.quantity,
    product_id: line.productId,
    name: line.name,
    description: line.description,
    color: line.color,
    size: line.size,
    image_url: line.imageUrl,
    list_price: line.listPrice,
    discount_percentage: line.discountPercentage,
    sale_price: line.salePrice,
    stock: line.stock,
  })),
  coupons: cart.coupons.map((coupon) => ({
    code: coupon.code,
    discount_type: coupon.discountType,
    value: coupon.value,
  })),
  totalUnits: cart.lines.reduce((units, line) => units + line.quantity, 0),
});

export const toValidateCartResponse = (
  cart: CartEntity,
  changes: StockChange[],
): ValidateCartResponseDto => ({
  cart: toCartResponse(cart),
  changes: changes.map((change) => ({
    sku: change.sku,
    name: change.name,
    previous_quantity: change.previousQuantity,
    quantity: change.quantity,
    stock: change.stock,
  })),
});
