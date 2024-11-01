import prompts from "prompts";

export const serverPrompt = async () => {
	const { server } = await prompts({
		type: "select",
		name: "server",
		message: "Server",
		choices: [
			{ title: "Sandbox", value: "sandbox" },
			{ title: "Production", value: "production" },
		],
	});

	return server;
};
