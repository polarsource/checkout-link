import type { Polar } from "@polar-sh/sdk";
import type { Organization } from "@polar-sh/sdk/models/components/organization.js";
import {
	createOrganizationPrompt,
	selectOrganizationPrompt,
} from "./prompts/organization.js";

export const resolveOrganization = async (
	api: Polar,
	slug: string,
): Promise<Organization> => {
	// Get list of organizations user is member of
	const userOrganizations = (
		await api.organizations.list({
			isMember: true,
		})
	).result.items;

	// Find organization matching slug if it exists
	const matchingOrg = userOrganizations.find((org) => org.slug === slug);

	if (userOrganizations.length > 0) {
		// If user has organizations, prompt them to select one
		const organization = await selectOrganizationPrompt(
			userOrganizations,
			matchingOrg,
		);

		if (organization) {
			return organization;
		}
	}

	const orgsWithSlug = await api.organizations.list({
		slug,
	});

	const orgExists = orgsWithSlug.result.items.length > 0;

	if (orgExists) {
		const newSlug = await createOrganizationPrompt();

		return await api.organizations.create({
			name: newSlug,
			slug: newSlug,
		});
	}

	const newSlug = await createOrganizationPrompt(slug);

	return await api.organizations.create({
		name: newSlug,
		slug: newSlug,
	});
};
