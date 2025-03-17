import type { Polar } from "@polar-sh/sdk";

export const createCheckoutLink = async (api: Polar, productId: string) => {
	return await api.checkoutLinks.create({
		productId,
	});
};
