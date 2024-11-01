import prompts from "prompts";

export const benefitPrompt = async () => {
	const benefit = await prompts([
		{
			type: "confirm",
			name: "licenseKey",
			message: "Include License Key with product?",
			initial: true,
		},
	]);

	return benefit;
};
