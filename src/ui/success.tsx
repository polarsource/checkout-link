import { StatusMessage } from "@inkjs/ui";
import type { CheckoutLink } from "@polar-sh/sdk/models/components/checkoutlink.js";
import type { Product } from "@polar-sh/sdk/models/components/product.js";
import spawn from "cross-spawn";
import { Box, Text, render } from "ink";
import open from "open";
import React from "react";

function pbcopy(data: string) {
	const proc = spawn("pbcopy");
	proc.stdin?.write(data);
	proc.stdin?.end();
}

export const successMessage = (
	product: Product,
	checkoutLink: CheckoutLink,
) => {
	pbcopy(checkoutLink.url);

	render(
		<Box flexDirection="column" paddingY={1}>
			<Text>🎉 {product.name} was successfully created!</Text>
			<Text>🔗 {checkoutLink.url}</Text>
			<StatusMessage variant="success">
				<Text>Checkout URL copied to clipboard!</Text>
			</StatusMessage>
		</Box>,
	);

	open(checkoutLink.url);
};
