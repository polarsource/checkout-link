import { createHash, randomBytes } from "node:crypto";
import {
	type IncomingMessage,
	type Server,
	type ServerResponse,
	createServer,
} from "node:http";
import open from "open";

const config = {
	clientId: "polar_ci_5_49aheFVUaNbjr8saQNDw",
	clientSecret: "",
	scopes: [
		"openid",
		"profile",
		"email",
		"user:read",
		"organizations:read",
		"organizations:write",
		"products:read",
		"products:write",
		"benefits:read",
		"benefits:write",
		"subscriptions:read",
		"subscriptions:write",
	],
	endpoint: {
		authorization: "https://sandbox.polar.sh/oauth2/authorize",
		token: "https://sandbox-api.polar.sh/v1/oauth2/token",
	},
	redirectUrl: "http://127.0.0.1:3333/oauth/callback",
};

const generateRandomString = () => {
	return randomBytes(48).toString("hex");
};

const generateHash = (value: string) => {
	const hash = createHash("sha256").update(value).digest("base64");
	return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export async function login(): Promise<string> {
	// Set up the authorization request
	const codeVerifier = generateRandomString();
	const codeChallenge = generateHash(codeVerifier);
	const state = generateRandomString();
	const authorizationUrl = buildAuthorizationUrl(state, codeChallenge);
	const loopbackPort = 3333;

	return new Promise<string>((resolve, reject) => {
		let server: Server | null = null;
		const callback = async (
			request: IncomingMessage,
			response: ServerResponse,
		) => {
			if (server != null) {
				// Complete the incoming HTTP request when a login response is received
				response.write("Login completed for the console client ...");
				response.end();
				server.close();
				server = null;

				try {
					// Swap the code for tokens
					const accessToken = await redeemCodeForAccessToken(
						request.url ?? "",
						state,
						codeVerifier,
					);
					resolve(accessToken);
				} catch (e: unknown) {
					reject(e);
				}
			}
		};

		// Start an HTTP server and listen for the authorization response on a loopback URL, according to RFC8252
		server = createServer(callback);
		server.listen(loopbackPort);

		// Open the system browser to begin authentication
		open(authorizationUrl);
	});
}

/*
 * Build a code flow URL for a native console app
 */
function buildAuthorizationUrl(state: string, codeChallenge: string): string {
	let url = config.endpoint.authorization;
	url += `?client_id=${encodeURIComponent(config.clientId)}`;
	url += `&redirect_uri=${encodeURIComponent(config.redirectUrl)}`;
	url += "&response_type=code";
	url += `&scope=${encodeURIComponent(config.scopes.join(" "))}`;
	url += `&state=${encodeURIComponent(state)}`;
	url += `&code_challenge=${encodeURIComponent(codeChallenge)}`;
	url += "&code_challenge_method=S256";
	return url;
}

function getLoginResult(responseUrl: string): [string, string] {
	const url = new URL(responseUrl, config.redirectUrl);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");

	if (!code || !state) {
		throw new Error(
			"Authorization code or state is missing in the response URL",
		);
	}

	return [code, state];
}

/*
 * Swap the code for tokens using PKCE and return the access token
 */
async function redeemCodeForAccessToken(
	responseUrl: string,
	requestState: string,
	codeVerifier: string,
): Promise<string> {
	const [code, responseState] = getLoginResult(responseUrl);

	if (responseState !== requestState) {
		throw new Error("An invalid authorization response state was received");
	}

	let body = "grant_type=authorization_code";
	body += `&client_id=${encodeURIComponent(config.clientId)}`;
	body += `&redirect_uri=${encodeURIComponent(config.redirectUrl)}`;
	body += `&code=${encodeURIComponent(code)}`;
	body += `&code_verifier=${encodeURIComponent(codeVerifier)}`;

	const response = await fetch(config.endpoint.token, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body,
	});

	if (response.status >= 400) {
		const details = await response.text();
		throw new Error(
			`Problem encountered redeeming the code for tokens: ${response.status}, ${details}`,
		);
	}

	const data = await response.json();
	return data.access_token;
}
