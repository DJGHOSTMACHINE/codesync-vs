import fetch from "node-fetch";

import { API_ENDPOINT } from "../constants";

export const updateRepo = async (accessToken: string, repoId: number, data: any) => {
	let error = "";
	let response = await fetch(`${API_ENDPOINT}/repos/${repoId}`, {
		method: 'PATCH',
		body: JSON.stringify(data),
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Basic ${accessToken}`
		},
	})
		.then(res => res.json())
		.then(json => json)
		.catch(err => error = err);

	if ("error" in response) {
		error = response["error"];
	}
	if (error) {
		response = {};
	}
	return {
		response,
		error
	};

};
