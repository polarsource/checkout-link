import { StatusMessage } from "@inkjs/ui";
import type { CheckoutLink } from "@polar-sh/sdk/models/components/checkoutlink.js";
import type { Product } from "@polar-sh/sdk/models/components/product.js";
import { Box, Text, render } from "ink";
import React from "react";
import open from "open";
import spawn from "cross-spawn";

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
		</Box>
	);

	open(checkoutLink.url);
};
