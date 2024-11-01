import { StatusMessage } from "@inkjs/ui";
import type { Organization } from "@polar-sh/sdk/models/components/organization.js";
import type { Product } from "@polar-sh/sdk/models/components/product.js";
import { Box, Text, render } from "ink";
import Link from "ink-link";
import React from "react";

export const successMessage = (
	organization: Organization,
	product: Product,
) => {
	render(
		<Box flexDirection="column" columnGap={2}>
			<StatusMessage variant="success">
				<Text>Polar was successfully initialized!</Text>
			</StatusMessage>
			<Box flexDirection="column" paddingY={1}>
				<Text>
					Organization: <Text color="blue">{organization.name}</Text>
				</Text>
				<Text>
					Product: <Text color="blue">{product.name}</Text>
				</Text>

				<Text color="magentaBright">
					{">"}{" "}
					<Link url="https://sandbox.polar.sh/settings">
						Create Polar Access Token
					</Link>
				</Text>
				<Text color="magentaBright">
					{">"}{" "}
					<Link
						url={`https://sandbox.polar.sh/dashboard/${organization.slug}/settings`}
					>
						Configure Webhooks
					</Link>
				</Text>
			</Box>
		</Box>,
	);
};
