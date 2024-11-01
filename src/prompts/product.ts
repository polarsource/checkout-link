import prompts from "prompts";

export const productPrompt = async () => {
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

	const priceTypeResponse = await prompts({
		type: "select",
		name: "priceType",
		message: "Product Type",
		choices: [
			{ title: "One-Time Purchase", value: "one-time" },
			{ title: "Subscription", value: "recurring" },
		],
	});

	if (priceTypeResponse.priceType === "one-time") {
		const priceResponse = await prompts([
			{
				type: "select",
				name: "priceAmountType",
				message: "Price Type",
				choices: [
					{ title: "Free", value: "free" },
					{ title: "Fixed Price", value: "fixed" },
				],
			},
			{
				type: (prev) => (prev !== "free" ? "number" : false),
				name: "priceAmount",
				message: "Price",
				validate: (value) => (value ? true : "Price is required"),
			},
		]);

		return {
			...productResponse,
			prices: [priceResponse],
		};
	}

	const priceResponse = await prompts([
		{
			type: "select",
			name: "recurringInterval",
			message: "Recurring Interval",
			choices: [
				{ title: "Monthly", value: "monthly" },
				{ title: "Yearly", value: "yearly" },
			],
		},
		{
			type: "select",
			name: "priceAmountType",
			message: "Price Type",
			choices: [
				{ title: "Free", value: "free" },
				{ title: "Fixed Price", value: "fixed" },
			],
		},
		{
			type: (prev) => (prev !== "free" ? "number" : false),
			name: "priceAmount",
			message: "Price",
			validate: (value) => (value ? true : "Price is required"),
		},
	]);

	return {
		...productResponse,
		prices: [priceResponse],
	};
};
