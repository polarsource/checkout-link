import type { Polar } from "@polar-sh/sdk";
import type { Organization } from "@polar-sh/sdk/models/components/organization.js";
import {
	createOrganizationPrompt,
	selectOrganizationPrompt,
} from "./prompts/organization.js";

export const resolveOrganization = async (
	api: Polar,
): Promise<Organization> => {
	// Get list of organizations user is member of
	const userOrganizations = (
		await api.organizations.list({
			isMember: true,
		})
	).result.items;

	if (userOrganizations.length > 0) {
		// If user has organizations, prompt them to select one
		const organization = await selectOrganizationPrompt(userOrganizations);

		if (organization) {
			return organization;
		}
	}

	const newSlug = await createOrganizationPrompt();

	return await api.organizations.create({
		name: newSlug,
		slug: newSlug,
	});
};
