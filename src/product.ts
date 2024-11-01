import type { Polar } from "@polar-sh/sdk";
import type { Organization } from "@polar-sh/sdk/models/components";
import type { ProductsCreateProductCreate } from "@polar-sh/sdk/models/operations";
import type { benefitPrompt } from "./prompts/benefit.js";

export const createProduct = async (
	api: Polar,
	organization: Organization,
	productCreate: ProductsCreateProductCreate,
	benefit: Awaited<ReturnType<typeof benefitPrompt>>,
) => {
	const product = await api.products.create({
		...productCreate,
		organizationId: organization.id,
	});

	if (benefit.licenseKey) {
		const benefit = await api.benefits.create({
			type: "license_keys",
			description: "License Key",
			properties: {},
			organizationId: organization.id,
		});

		await api.products.updateBenefits({
			id: product.id,
			productBenefitsUpdate: {
				benefits: [benefit.id],
			},
		});
	}

	return product;
};
