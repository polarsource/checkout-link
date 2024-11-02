import { Spinner } from "@inkjs/ui";
import { render } from "ink";
import React from "react";

export const uploadMessage = async <T,>(fileUploadPromise: Promise<T>) => {
	const { unmount, clear, waitUntilExit } = render(
		<Spinner label="Uploading file..." />,
	);

	fileUploadPromise.then(() => {
		clear();
		unmount();
	});

	await waitUntilExit();
};
