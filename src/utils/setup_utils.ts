import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as vscode from 'vscode';
import {
	CODESYNC_ROOT, USER_PATH, Auth0URLs, NOTIFICATION, CONFIG_PATH
} from "../constants";
import { repoIsNotSynced } from '../events/utils';
import { initExpressServer, isPortAvailable } from './auth_utils';
import { showConnectRepo, showSignUpButtons } from './notifications';
import { readYML } from './common';
import { initUtils } from '../init/utils';
import { trackRepoHandler, unSyncHandler } from '../handlers/commands_handler';


export const createSystemDirectories = (root=CODESYNC_ROOT) => {
	// Create system directories
	const paths = [
		root,
		`${root}/.diffs/.vscode`,
		`${root}/.originals`,
		`${root}/.shadow`,
		`${root}/.deleted`,
	];
	paths.forEach((path) => {
		if (!fs.existsSync(path)) {
			// Add file in originals repo
			fs.mkdirSync(path, { recursive: true });
		}
	});
	const configPath = `${root}/config.yml`;
	const sequenceTokenPath = `${root}/sequence_token.yml`;
	// Create config.yml if does not exist
	const configExists = fs.existsSync(configPath);
	if (!configExists) {
		fs.writeFileSync(configPath, yaml.safeDump({ repos: {} }));
	}

	// Create sequence_token.yml if does not exist
	const sequenceTokenExists = fs.existsSync(sequenceTokenPath);
	if (!sequenceTokenExists) {
		fs.writeFileSync(sequenceTokenPath, yaml.safeDump({}));
	}
};


export const setupCodeSync = async (repoPath: string, root=CODESYNC_ROOT) => {

	createSystemDirectories(root);
	const userFilePath = `${root}/user.yml`;
	const configPath = `${root}/config.yml`;
	let port = 0;
	for (const _port of Auth0URLs.PORTS) {
		const isAvailable = await isPortAvailable(_port);
		if (isAvailable) {
			port = _port;
			break;
		}
	}

	// Set port to global variable
	(global as any).port = port;

	initExpressServer();

	if (!fs.existsSync(userFilePath)) {
		showSignUpButtons();
		return port;
	}

	// Check if access token is present against users
	const users = readYML(userFilePath) || {};
	const validUsers: string[] = [];
	Object.keys(users).forEach(email => {
		const user = users[email];
		if (user.access_token) {
			validUsers.push(email);
		}
	});

	if (validUsers.length === 0) {
		showSignUpButtons();
		return port;
	}

	if (repoIsNotSynced(repoPath, configPath) || !initUtils.successfullySynced(repoPath, configPath)) {
		// Show notification to user to Sync the repo
		showConnectRepo(repoPath, "", "");
		return port;
	}

	// Show notification that repo is in sync
	vscode.window.showInformationMessage(NOTIFICATION.REPO_IN_SYNC, ...[
		NOTIFICATION.TRACK_IT,
		NOTIFICATION.UNSYNC_REPO
	]).then(selection => {
		if (!selection) { return; }
		if (selection === NOTIFICATION.TRACK_IT) {
			trackRepoHandler();
		}
		if (selection === NOTIFICATION.UNSYNC_REPO) {
			unSyncHandler();
		}
	});
};

export const showLogIn = (userFilePath=USER_PATH) => {
	if (!fs.existsSync(userFilePath)) {
		return true;
	}

	// Check if access token is present against users
	const users = readYML(userFilePath) || {};
	const validUsers: string[] = [];
	Object.keys(users).forEach(key => {
		const user = users[key];
		if (user.access_token) {
			validUsers.push(user.email);
		}
	});

	return validUsers.length === 0;
};

export const showConnectRepoView = (repoPath: string, configPath=CONFIG_PATH) => {
	return repoIsNotSynced(repoPath, configPath) || !initUtils.successfullySynced(repoPath, configPath);
};
