import * as vscode from 'vscode';
import { NOTIFICATION, USER_PATH } from '../constants';
import { syncRepo } from '../init_handler';
import { readYML } from './common';
import { logout, redirectToBrowser } from './login_utils';

export const showSignUpButtons = () => { 
	vscode.window.showInformationMessage(
		NOTIFICATION.WELCOME_MSG, ...[
		NOTIFICATION.JOIN, 
		NOTIFICATION.IGNORE
	]).then(async selection => {
		if (selection === NOTIFICATION.JOIN) {
			redirectToBrowser();
		}
	});
};

export const showConnectRepo = (repoPath: string, email="", accessToken="", skipAskConnect=false) => { 
	const port = (global as any).port;
	if (skipAskConnect && email && accessToken) {
		syncRepo(repoPath, accessToken);
		return;
	}
	const msg = email ? NOTIFICATION.CONNECT_AFTER_JOIN : NOTIFICATION.CONNECT_REPO;
	vscode.window.showInformationMessage(msg, ...[
		NOTIFICATION.CONNECT, 
		NOTIFICATION.IGNORE
	]).then(async selection => {
		if (selection === NOTIFICATION.CONNECT) {

			if (email && accessToken) {
				await syncRepo(repoPath, accessToken);
				return;
			}

			showChooseAccount(repoPath);
		}
	});
};


export const showChooseAccount = (repoPath: string) => {
	const port = (global as any).port;
	// Check if access token is present against users
	const users = readYML(USER_PATH);
	const validUsers: any[] = [];
	Object.keys(users).forEach(key => {
		const user = users[key];
		if (user.access_token) {
			validUsers.push({ email: key, access_token: user.access_token });
		}
	});

	if (validUsers.length === 0) {
		vscode.window.showErrorMessage(NOTIFICATION.NO_VALID_ACCOUNT);
		return;
	}
	
	const emails = validUsers.map(account => account.email);
	const options = [...emails, NOTIFICATION.USE_DIFFERENT_ACCOUNT];
	vscode.window.showInformationMessage(
		NOTIFICATION.CHOOSE_ACCOUNT, 
		...options)
		.then(async selection => {
			if (selection === NOTIFICATION.USE_DIFFERENT_ACCOUNT) {
				await logout(port);
				redirectToBrowser(true);
				return;
			}
		const index = validUsers.findIndex(user => user.email === selection);
		const user = validUsers[index];
		// We have token, repoPath Trigger Init
		await syncRepo(repoPath, user.access_token);
	});
};

export const askPublicPrivate = async() => {
	const buttonSelected = await vscode.window.showInformationMessage(
		NOTIFICATION.PUBLIC_OR_PRIVATE, ...[
		NOTIFICATION.YES, 
		NOTIFICATION.NO
	]).then(selection => selection);
	return buttonSelected;
};

export const askContinue = async () => {
	return await vscode.window.showInformationMessage(
		NOTIFICATION.UPDATE_SYNCIGNORE, ...[
		NOTIFICATION.CONTINUE, 
		NOTIFICATION.CANCEL
	])
	.then(selection => selection);
};