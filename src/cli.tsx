import { Polar } from "@polar-sh/sdk";
import meow from "meow";
import { login } from "./oauth.js";
import { resolveOrganization } from "./organization.js";
import { createProduct } from "./product.js";
import { productPrompt } from "./prompts/product.js";
import { authenticationMessage } from "./ui/authentication.js";
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
	  $ checkout-link
	
	Options
	  --sandbox, -s  Use the sandbox environment.
`,
	{
		importMeta: import.meta,
		flags: {
			sandbox: {
				type: "boolean",
				alias: 's',
				default: false,
			},
		},
	},
);

const [filePath] = cli.input;

(async () => {
	const product = await productPrompt();

	await authenticationMessage();
	const code = await login(cli.flags.sandbox ? "sandbox" : "production");

	const api = new Polar({
		accessToken: code,
		server: cli.flags.sandbox ? 'sandbox' : 'production'
	});

	const organization = await resolveOrganization(api);

	const createdProduct = await createProduct(
		api,
		organization,
		product,
		filePath,
	);

	successMessage(organization, createdProduct);
})();
