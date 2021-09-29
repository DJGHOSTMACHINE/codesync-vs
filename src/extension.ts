'use strict';

import vscode from 'vscode';

import {
	handleChangeEvent,
	handleFilesCreated,
	handleFilesDeleted,
	handleFilesRenamed,
	handlePastedFile
 } from "./events/event_handler";
import { handleBuffer } from "./codesyncd/buffer_handler";
import { setupCodeSync, showConnectRepoView, showLogIn } from "./utils/setup_utils";
import { COMMAND, STATUS_BAR_MSGS } from './constants';
import { updateStatusBarItem } from "./utils/common";

import { detectBranchChange } from "./codesyncd/populate_buffer";
import { logout } from './utils/auth_utils';
import { pathUtils } from "./utils/path_utils";

import {
	unSyncHandler,
	SignUpHandler,
	SyncHandler,
	trackRepoHandler,
	trackFileHandler
} from './handlers/commands_handler';


export async function activate(context: vscode.ExtensionContext) {
	const repoPath = pathUtils.getRootPath() || "";

	vscode.commands.executeCommand('setContext', 'showLogIn', showLogIn());
	vscode.commands.executeCommand('setContext', 'showConnectRepoView', showConnectRepoView(repoPath));
	vscode.commands.executeCommand('setContext', 'CodeSyncActivated', true);

	context.subscriptions.push(vscode.commands.registerCommand(COMMAND.triggerSignUp, SignUpHandler));
	context.subscriptions.push(vscode.commands.registerCommand(COMMAND.triggerLogout, logout));
	context.subscriptions.push(vscode.commands.registerCommand(COMMAND.triggerSync, SyncHandler));
	context.subscriptions.push(vscode.commands.registerCommand(COMMAND.triggerUnsync, unSyncHandler));
	context.subscriptions.push(vscode.commands.registerCommand(COMMAND.trackRepo, trackRepoHandler));
	context.subscriptions.push(vscode.commands.registerCommand(COMMAND.trackFile, trackFileHandler));

	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = COMMAND.triggerUnsync;
	context.subscriptions.push(statusBarItem);

	await setupCodeSync(repoPath);

	if (repoPath) {
		console.log(`Configured repo: ${repoPath}`);
	}

	const watcher = vscode.workspace.createFileSystemWatcher("**/*"); //glob search string

	watcher.onDidCreate((e) => {
		handlePastedFile(e.fsPath);
	});

	vscode.workspace.onDidChangeTextDocument(changeEvent => {
		handleChangeEvent(changeEvent);
	});

	vscode.workspace.onDidCreateFiles(changeEvent => {
		handleFilesCreated(changeEvent);
	});

	vscode.workspace.onDidDeleteFiles(changeEvent => {
		handleFilesDeleted(changeEvent);
	});

	vscode.workspace.onDidRenameFiles(changeEvent => {
		handleFilesRenamed(changeEvent);
	});

	await detectBranchChange();

	updateStatusBarItem(statusBarItem, STATUS_BAR_MSGS.GETTING_READY);

	// Do not run daemon in case of tests
	if ((global as any).IS_CODESYNC_DEV) return;

	await handleBuffer(statusBarItem);
}

