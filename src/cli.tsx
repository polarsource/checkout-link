import { Polar } from "@polar-sh/sdk";
import meow from "meow";
import { appendEnvironmentVariables } from "./env.js";
import { installDependencies } from "./install.js";
import { login } from "./oauth.js";
import { resolveOrganization } from "./organization.js";
import { resolvePackageName } from "./package.js";
import { createProduct } from "./product.js";
import { benefitPrompt } from "./prompts/benefit.js";
import { productPrompt } from "./prompts/product.js";
import { templatePrompt } from "./prompts/template.js";
import {
	type Framework,
	copyCheckoutTemplate,
	copyPolarClientTemplate,
	copyProductsTemplate,
	copyWebhooksTemplate,
} from "./template.js";
import { authenticationMessage } from "./ui/authentication.js";
import { environmentMessage } from "./ui/environment.js";
import { installMessage } from "./ui/install.js";
import { precheckMessage } from "./ui/precheck.js";
import { successMessage } from "./ui/success.js";

process.on("uncaughtException", (error) => {
	console.error(error);
	process.exit(1);
});

process.on("unhandledRejection", (error) => {
	console.error(error);
	process.exit(1);
});

const cli = meow(
	`
	Usage
	  $ polar-init

	Options
	  --skip-precheck  Skips the framework check, and fallbacks to Next
	  --skip-template  Skips the template prompt
`,
	{
		importMeta: import.meta,
		flags: {
			skipPrecheck: {
				type: "boolean",
				default: false,
			},
			skipTemplate: {
				type: "boolean",
				default: false,
			},
		},
	},
);

(async () => {
	let framework: Framework;

	if (cli.flags.skipPrecheck) {
		framework = "next";
	} else {
		framework = await precheckMessage();
	}

	const product = await productPrompt();
	const benefit = await benefitPrompt();

	await authenticationMessage();
	const code = await login();

	const api = new Polar({
		accessToken: code,
		server: "sandbox",
	});

	const packageName = await resolvePackageName();
	const organization = await resolveOrganization(api, packageName);

	const createdProduct = await createProduct(
		api,
		organization,
		product,
		benefit,
	);

	if (!cli.flags.skipTemplate) {
		const templates = await templatePrompt();

		await copyPolarClientTemplate(framework);

		const shouldCopyCheckout = templates.includes("checkout");
		const shouldCopyWebhooks = templates.includes("webhooks");

		if (shouldCopyCheckout) {
			await copyProductsTemplate(framework);
			await copyCheckoutTemplate(framework);
		}

		if (shouldCopyWebhooks) {
			await copyWebhooksTemplate(framework);
		}

		const baseDependencies = ["@polar-sh/sdk"];
		const webhooksDependencies = ["standardwebhooks"];

		await installMessage(
			installDependencies(
				shouldCopyWebhooks
					? [...baseDependencies, ...webhooksDependencies]
					: baseDependencies,
			),
		);

		let envVar = {};

		switch (framework) {
			case "nuxt":
				envVar = {
					NUXT_POLAR_ORGANIZATION_ID: organization.id,
					NUXT_POLAR_ACCESS_TOKEN: "",
					NUXT_POLAR_WEBHOOK_SECRET: shouldCopyWebhooks ? "" : undefined,
					NUXT_POLAR_SERVER: "sandbox",
				};
				break;
			case "next":
				envVar = {
					POLAR_ORGANIZATION_ID: organization.id,
					POLAR_ACCESS_TOKEN: "",
					POLAR_WEBHOOK_SECRET: shouldCopyWebhooks ? "" : undefined,
				};
				break;
		}

		await environmentMessage(
			appendEnvironmentVariables({
				...envVar,
			}),
		);
	}

	successMessage(organization, createdProduct, framework);
})();
