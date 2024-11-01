import { Spinner } from "@inkjs/ui";
import { render } from "ink";
import React from "react";

export const authenticationMessage = async () => {
	const { unmount, clear, waitUntilExit } = render(
		<Spinner label="Opening browser for authentication..." />,
	);

	setTimeout(() => {
		clear();
		unmount();
	}, 1500);

	await waitUntilExit();
};
