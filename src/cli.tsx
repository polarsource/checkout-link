import { Polar } from "@polar-sh/sdk";
import meow from "meow";
import { createCheckoutLink } from "./checkout.js";
import { login } from "./oauth.js";
import { resolveOrganization } from "./organization.js";
import { createProduct } from "./product.js";
import { productPrompt } from "./prompts/product.js";
import { serverPrompt } from "./prompts/server.js";
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
`,
	{
		importMeta: import.meta,
		flags: {
			sandbox: {
				type: "boolean",
				alias: "s",
				default: false,
			},
		},
	},
);

const [filePath] = cli.input;

(async () => {
	const product = await productPrompt();
	const server = await serverPrompt();

	await authenticationMessage();
	const code = await login(server);

	const api = new Polar({
		accessToken: code,
		server
	});

	const organization = await resolveOrganization(api);

	const createdProduct = await createProduct(
		api,
		organization,
		product,
		filePath,
	);

	const price = createdProduct.prices[0];

	if (price) {
		const checkoutLink = await createCheckoutLink(api, price);

		successMessage(createdProduct, checkoutLink);
	}
})();
