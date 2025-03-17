import type { ProductCreate } from "@polar-sh/sdk/models/components/productcreate.js";
import prompts from "prompts";

export const productPrompt = async (): Promise<ProductCreate> => {
	const productResponse = await prompts([
		{
			type: "text",
			name: "name",
			message: "Product Name",
			validate: (value) => (value ? true : "Product Name is required"),
		},
		{
			type: "text",
			name: "description",
			message: "Product Description",
		},
	]);

	const priceResponse = await prompts([
		{
			type: "select",
			name: "amountType",
			message: "Price Type",
			choices: [
				{ title: "Free", value: "free" },
				{ title: "Fixed Price", value: "fixed" },
			],
		},
		{
			type: (prev) => (prev !== "free" ? "number" : false),
			name: "priceAmount",
			message: "Price Amount",
			validate: (value) => (value ? true : "Price Amount is required"),
		},
	]);

	return {
		...{
			...productResponse,
			recurringInterval: null,
		},
		prices: [
			{
				...priceResponse,
				...(typeof priceResponse.priceAmount === "number"
					? { priceAmount: priceResponse.priceAmount * 100 }
					: {}),
			},
		],
	};
};
