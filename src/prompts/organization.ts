import type { Organization } from "@polar-sh/sdk/models/components/organization.js";
import prompts from "prompts";

export const createOrganizationPrompt = async (organizationSlug?: string) => {
	const { slug } = await prompts([
		{
			type: "text",
			name: "slug",
			message: "Organization Slug",
			initial: organizationSlug,
		},
	]);

	return slug;
};

export const selectOrganizationPrompt = async (
	organizations: Organization[],
): Promise<Organization | undefined> => {
	const { organization: orgSlug } = await prompts({
		type: "select",
		name: "organization",
		message: "Select an organization",
		choices: [
			...organizations.map((org) => ({
				title: org.name,
				value: org.slug,
			})),
			{
				title: "+ Create new organization",
				value: undefined,
			},
		],
	});

	return organizations.find((org) => org.slug === orgSlug);
};
