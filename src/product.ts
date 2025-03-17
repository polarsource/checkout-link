import fs from "node:fs";
import path from "node:path";
import type { Polar } from "@polar-sh/sdk";
import mime from "mime-types";
import { uploadMessage } from "./ui/upload.js";
import { Upload } from "./upload.js";
import type { Organization } from "@polar-sh/sdk/models/components/organization.js";
import type { ProductCreate } from "@polar-sh/sdk/models/components/productcreate.js";
import type { FileRead } from "@polar-sh/sdk/models/components/listresourcefileread.js";

export const createProduct = async (
	api: Polar,
	organization: Organization,
	productCreate: ProductCreate,
	filePath?: string,
) => {
	const product = await api.products.create({
		...productCreate,
		organizationId: organization.id,
	});

	const absoluteFilePath = path.resolve(process.cwd(), filePath ?? "");
	const readStream = fs.createReadStream(absoluteFilePath);
	const mimeType = mime.lookup(absoluteFilePath) || "application/octet-stream";

	const fileUploadPromise = new Promise<FileRead>((resolve) => {
		const upload = new Upload(api, {
			organization,
			file: {
				name: path.basename(absoluteFilePath),
				type: mimeType,
				size: fs.statSync(absoluteFilePath).size,
				readStream,
			},
			onFileUploadProgress: () => {},
			onFileUploaded: resolve,
		});

		upload.run();
	});

	await uploadMessage(fileUploadPromise);

	const fileUpload = await fileUploadPromise;

	const benefit = await api.benefits.create({
		type: "downloadables",
		description: productCreate.name,
		properties: {
			files: [fileUpload.id],
		},
		organizationId: organization.id,
	});

	await api.products.updateBenefits({
		id: product.id,
		productBenefitsUpdate: {
			benefits: [benefit.id],
		},
	});

	return product;
};
