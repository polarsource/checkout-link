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
		name: "type",
		message: "Product Type",
		choices: [
			{ title: "One-Time Purchase", value: "one_time" },
			{ title: "Subscription", value: "recurring" },
		],
	});

	if (priceTypeResponse.type === "one_time") {
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
				message: "Price",
				validate: (value) => (value ? true : "Price is required"),
			},
		]);

		return {
			...productResponse,
			prices: [
				{
					...priceResponse,
					...priceTypeResponse,
					...(typeof priceResponse.priceAmount === "number"
						? { priceAmount: priceResponse.priceAmount * 100 }
						: {}),
				},
			],
		};
	}

	const priceResponse = await prompts([
		{
			type: "select",
			name: "recurringInterval",
			message: "Recurring Interval",
			choices: [
				{ title: "Monthly", value: "month" },
				{ title: "Yearly", value: "year" },
			],
		},
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
			message: "Price",
			validate: (value) => (value ? true : "Price is required"),
		},
	]);

	return {
		...productResponse,
		prices: [
			{
				...priceResponse,
				...priceTypeResponse,
				...(typeof priceResponse.priceAmount === "number"
					? { priceAmount: priceResponse.priceAmount * 100 }
					: {}),
			},
		],
	};
};
