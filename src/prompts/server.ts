import prompts from "prompts";

export const serverPrompt = async () => {
	const { server } = await prompts({
		type: "select",
		name: "server",
		message: "Server",
		choices: [
			{ title: "Production", value: "production" },
			{ title: "Sandbox", value: "sandbox" },
		],
	});

	return server;
};
