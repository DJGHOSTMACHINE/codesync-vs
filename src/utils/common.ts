import fs from 'fs';
import path from "path";
import vscode from 'vscode';
import yaml from 'js-yaml';

import {
	COMMAND,
	IGNORABLE_DIRECTORIES,
	STATUS_BAR_MSGS,
	SYNCIGNORE
} from "../constants";
import {generateSettings} from "../settings";

export const readFile = (filePath: string) => {
	return fs.readFileSync(filePath, "utf8");
};

export const readYML = (filePath: string) => {
	try {
		return yaml.load(readFile(filePath));
	} catch (e) {
		return {};
	}
};

export const updateStatusBarItem = (statusBarItem: vscode.StatusBarItem, text: string) => {
	if (text === STATUS_BAR_MSGS.AUTHENTICATION_FAILED) {
		statusBarItem.command = COMMAND.triggerSignUp;
	} else if (text === STATUS_BAR_MSGS.CONNECT_REPO) {
		statusBarItem.command = COMMAND.triggerSync;
	} else {
		statusBarItem.command = undefined;
	}
	statusBarItem.text = text;
	statusBarItem.show();
};

export const isRepoActive = (config: any, repoPath: string) => {
	return repoPath in config.repos && !config.repos[repoPath].is_disconnected;
};

export const getSyncIgnoreItems = (repoPath: string) => {
	const syncIgnorePath = path.join(repoPath, SYNCIGNORE);
	const syncIgnoreExists = fs.existsSync(syncIgnorePath);
	if (!syncIgnoreExists) {
		return [];
	}
	let syncIgnoreData = "";
	syncIgnoreData = readFile(syncIgnorePath);
	const syncIgnoreItems = syncIgnoreData.split("\n");
	return syncIgnoreItems.filter(item =>  item);
};

export const getSkipRepos = (repoPath: string, syncignoreItems: string[]) => {
	const skipRepos = [...IGNORABLE_DIRECTORIES];
	syncignoreItems.forEach((pattern) => {
		const itemPath = path.join(repoPath, pattern);
		if (!fs.existsSync(itemPath)) { return; }
		const lstat = fs.lstatSync(itemPath);
		if (lstat.isDirectory()) {
			skipRepos.push(pattern);
		}
	});
	return skipRepos;
};

export const isEmpty = (obj: any) => {
    return Object.keys(obj).length === 0;
};
