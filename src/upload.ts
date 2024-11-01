import type { ReadStream } from "node:fs";
import type { Polar } from "@polar-sh/sdk";
import type {
	FileRead,
	FileUpload,
	Organization,
	S3FileCreatePart,
	S3FileUploadCompletedPart,
	S3FileUploadPart,
} from "@polar-sh/sdk/models/components";
import type { FilesCreateFileCreate } from "@polar-sh/sdk/models/operations";

const CHUNK_SIZE = 10000000; // 10MB

interface UploadProperties {
	organization: Organization;
	file: {
		name: string;
		type: string;
		size: number;
		readStream: ReadStream;
	};
	onFileUploadProgress: (file: FileUpload, uploaded: number) => void;
	onFileUploaded: (response: FileRead) => void;
}

export class Upload {
	api: Polar;
	organization: Organization;
	file: {
		name: string;
		type: string;
		size: number;
		readStream: ReadStream;
	};
	onFileUploadProgress: (file: FileUpload, uploaded: number) => void;
	onFileUploaded: (response: FileRead) => void;
	private buffer: Buffer;

	constructor(
		api: Polar,
		{
			organization,
			file,
			onFileUploadProgress,
			onFileUploaded,
		}: UploadProperties,
	) {
		this.api = api;
		this.organization = organization;
		this.file = file;
		this.onFileUploadProgress = onFileUploadProgress;
		this.onFileUploaded = onFileUploaded;
		this.buffer = Buffer.alloc(0);
	}

	private async prepare() {
		const chunks: Buffer[] = [];
		for await (const chunk of this.file.readStream) {
			chunks.push(chunk);
		}
		this.buffer = Buffer.concat(chunks);
	}

	async getSha256Base64(buffer: ArrayBuffer) {
		const sha256 = await crypto.subtle.digest("SHA-256", buffer);
		const sha256base64 = btoa(String.fromCharCode(...new Uint8Array(sha256)));
		return sha256base64;
	}

	async create(): Promise<FileUpload> {
		await this.prepare();
		const sha256base64 = await this.getSha256Base64(this.buffer);
		const parts = await this.getMultiparts();
		const mimeType = this.file.type ?? "application/octet-stream";

		const params: FilesCreateFileCreate = {
			organizationId: this.organization.id,
			service: "downloadable",
			name: this.file.name,
			size: this.file.size,
			mimeType: mimeType,
			checksumSha256Base64: sha256base64,
			upload: { parts: parts },
		};

		return this.api.files.create(params);
	}

	async getMultiparts(): Promise<Array<S3FileCreatePart>> {
		const chunkCount = Math.floor(this.file.size / CHUNK_SIZE) + 1;
		const parts: Array<S3FileCreatePart> = [];

		for (let i = 1; i <= chunkCount; i++) {
			const chunk_start = (i - 1) * CHUNK_SIZE;
			let chunk_end = i * CHUNK_SIZE;
			if (chunk_end > this.file.size) {
				chunk_end = this.file.size;
			}
			const chunk = this.buffer.slice(chunk_start, chunk_end);

			const chunkSha256base64 = await this.getSha256Base64(chunk);

			const part: S3FileCreatePart = {
				number: i,
				chunkStart: chunk_start,
				chunkEnd: chunk_end,
				checksumSha256Base64: chunkSha256base64,
			};
			parts.push(part);
		}
		return parts;
	}

	async uploadMultiparts({
		parts,
		onProgress,
	}: {
		parts: Array<S3FileUploadPart>;
		onProgress: (uploaded: number) => void;
	}): Promise<S3FileUploadCompletedPart[]> {
		const ret = [];
		let uploaded = 0;
		const partCount = parts.length;
		/**
		 * Unfortunately, we need to do this sequentially vs. in paralell since we
		 * do SHA-256 validations and AWS S3 would 400 if they receive requests in
		 * non-consecutive order according to their docs.
		 */
		for (let i = 0; i < partCount; i++) {
			const part = parts[i];

			if (!part) {
				throw new Error("Part is undefined");
			}

			const completed = await this.upload({
				part,
				onProgress: (chunk_uploaded) => {
					onProgress(uploaded + chunk_uploaded);
				},
			});
			uploaded += part.chunkEnd - part.chunkStart;
			onProgress(uploaded);
			ret.push(completed);
		}

		return ret;
	}

	async upload({
		part,
		onProgress,
	}: {
		part: S3FileUploadPart;
		onProgress: (uploaded: number) => void;
	}): Promise<S3FileUploadCompletedPart> {
		const data = this.buffer.slice(part.chunkStart, part.chunkEnd);
		const blob = new Blob([data], { type: "application/octet-stream" });

		const controller = new AbortController();
		const signal = controller.signal;

		const response = await fetch(part.url, {
			method: "PUT",
			headers: part.headers || {},
			body: blob,
			signal,
		});

		if (!response.ok) {
			throw new Error("Failed to upload part");
		}

		const etag = response.headers.get("ETag");

		if (!etag) {
			throw new Error("ETag not found in response");
		}

		const completed: S3FileUploadCompletedPart = {
			number: part.number,
			checksumEtag: etag,
			checksumSha256Base64: part.checksumSha256Base64 || null,
		};

		onProgress(part.chunkEnd - part.chunkStart);

		return completed;
	}

	async complete(
		createFileResponse: FileUpload,
		uploadedParts: S3FileUploadCompletedPart[],
	) {
		return this.api.files
			.uploaded({
				id: createFileResponse.id,
				fileUploadCompleted: {
					id: createFileResponse.upload.id,
					path: createFileResponse.upload.path,
					parts: uploadedParts,
				},
			})
			.then(this.onFileUploaded);
	}

	async run() {
		const createFileResponse = await this.create();
		const upload = createFileResponse?.upload;
		if (!upload) return;

		const uploadedParts = await this.uploadMultiparts({
			parts: upload.parts,
			onProgress: (uploaded: number) => {
				this.onFileUploadProgress(createFileResponse, uploaded);
			},
		});

		await this.complete(createFileResponse, uploadedParts);
	}
}
