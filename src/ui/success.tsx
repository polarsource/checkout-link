import { StatusMessage } from "@inkjs/ui";
import type { CheckoutLink } from "@polar-sh/sdk/models/components/checkoutlink.js";
import type { Product } from "@polar-sh/sdk/models/components/product.js";
import { Box, Text, render } from "ink";
import Link from "ink-link";
import React from "react";

export const successMessage = (
	product: Product,
	checkoutLink: CheckoutLink,
) => {
	render(
		<Box flexDirection="column" columnGap={2}>
			<StatusMessage variant="success">
				<Text>🎉 {product.name} was successfully created!</Text>
			</StatusMessage>
			<Box flexDirection="column" paddingY={1}>
				<Text color="magentaBright">
					{">"} <Link url={checkoutLink.url}>Checkout URL</Link>
				</Text>
			</Box>
		</Box>,
	);
};
