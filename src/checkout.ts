import type { Polar } from "@polar-sh/sdk";
import type { ProductPrice } from "@polar-sh/sdk/models/components/productprice.js";

export const createCheckoutLink = async (api: Polar, price: ProductPrice) => {
	return await api.checkoutLinks.create({
		productPriceId: price.id,
	});
};
