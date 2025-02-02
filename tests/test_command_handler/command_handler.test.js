import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import vscode from "vscode";
import untildify from "untildify";
import fetchMock from "jest-fetch-mock";
import getBranchName from "current-git-branch";

import {
    postSelectionUnsync,
    SignUpHandler,
    SyncHandler,
    trackFileHandler,
    trackRepoHandler,
    unSyncHandler
} from "../../src/handlers/commands_handler";
import {
    Config,
    getConfigFilePath,
    getUserFilePath,
    randomBaseRepoPath,
    randomRepoPath,
    TEST_EMAIL
} from "../helpers/helpers";
import {
    NOTIFICATION,
    DEFAULT_BRANCH,
    getRepoInSyncMsg
} from "../../src/constants";
import {WEB_APP_URL} from "../../src/settings";
import {readYML} from "../../src/utils/common";


describe("SignUpHandler",  () => {

    test("SignUpHandler",  () => {
        SignUpHandler();
        expect(global.skipAskConnect).toBe(false);
        expect(vscode.env.openExternal).toHaveBeenCalledTimes(1);
    });
});

describe("SyncHandler",  () => {
    const repoPath = randomRepoPath();
    const baseRepoPath = randomBaseRepoPath();
    const configPath = getConfigFilePath(baseRepoPath);
    const configData = {repos: {}};
    const userFilePath = getUserFilePath(baseRepoPath);
    const userData = {};
    userData[TEST_EMAIL] = {access_token: "ABC"};

    beforeEach(() => {
        fetch.resetMocks();
        jest.clearAllMocks();
        untildify.mockReturnValue(baseRepoPath);
        fs.mkdirSync(baseRepoPath, {recursive: true});
        fs.mkdirSync(repoPath, {recursive: true});
        fs.writeFileSync(configPath, yaml.safeDump(configData));
        fs.writeFileSync(userFilePath, yaml.safeDump(userData));
    });

    afterEach(() => {
        fs.rmSync(repoPath, { recursive: true, force: true });
        fs.rmSync(baseRepoPath, { recursive: true, force: true });
    });

    test("No Repo Path",  async () => {
        await SyncHandler();
        expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(0);
    });

    test("repo Not In Config", async () => {
        jest.spyOn(vscode.workspace, 'rootPath', 'get').mockReturnValue(repoPath);
        const user = {
            "email": TEST_EMAIL,
            "plan": {
                REPO_COUNT: 5
            },
            "repo_count": 4
        };
        fetchMock
            .mockResponseOnce(JSON.stringify({ status: true }))
            .mockResponseOnce(JSON.stringify(user));
        await SyncHandler();
        expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(0);
        // TODO: In case we activate choose account option
        // expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(1);
        // expect(vscode.window.showInformationMessage.mock.calls[0][0]).toStrictEqual(NOTIFICATION.CHOOSE_ACCOUNT);
        // expect(vscode.window.showInformationMessage.mock.calls[0][1]).toStrictEqual(TEST_EMAIL);
        // expect(vscode.window.showInformationMessage.mock.calls[0][2]).toStrictEqual(NOTIFICATION.USE_DIFFERENT_ACCOUNT);
    });

    test("repo In Config", async () => {
        const configUtil = new Config(repoPath, configPath);
        configUtil.addRepo();
        jest.spyOn(vscode.workspace, 'rootPath', 'get').mockReturnValue(repoPath);
        await SyncHandler();
        expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(1);
        const repoInSyncMsg = getRepoInSyncMsg(repoPath);
        expect(vscode.window.showInformationMessage.mock.calls[0][0]).toStrictEqual(repoInSyncMsg);
    });

});

describe("unSyncHandler",  () => {
    const repoPath = randomRepoPath();
    const baseRepoPath = randomBaseRepoPath();
    const configPath = getConfigFilePath(baseRepoPath);
    const configData = {repos: {}};
    const userFilePath = getUserFilePath(baseRepoPath);
    const userData = {};
    userData[TEST_EMAIL] = {access_token: "ABC"};

    beforeEach(() => {
        jest.clearAllMocks();
        untildify.mockReturnValue(baseRepoPath);
        fs.mkdirSync(baseRepoPath, {recursive: true});
        fs.mkdirSync(repoPath, {recursive: true});
        fs.writeFileSync(configPath, yaml.safeDump(configData));
        fs.writeFileSync(userFilePath, yaml.safeDump(userData));
    });

    afterEach(() => {
        fs.rmSync(repoPath, { recursive: true, force: true });
        fs.rmSync(baseRepoPath, { recursive: true, force: true });
    });

    test("No Repo Path",  async () => {
        await unSyncHandler();
        expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(0);
    });

    test("Ask Unsync confirmation",  async () => {
        jest.spyOn(vscode.workspace, 'rootPath', 'get').mockReturnValue(repoPath);
        await unSyncHandler();
        expect(vscode.window.showWarningMessage).toHaveBeenCalledTimes(1);
        expect(vscode.window.showWarningMessage.mock.calls[0][0]).toStrictEqual(NOTIFICATION.REPO_UNSYNC_CONFIRMATION);
        expect(vscode.window.showWarningMessage.mock.calls[0][1]).toStrictEqual(NOTIFICATION.YES);
        expect(vscode.window.showWarningMessage.mock.calls[0][2]).toStrictEqual(NOTIFICATION.CANCEL);
    });
});


describe("postSelectionUnsync",  () => {
    const repoPath = randomRepoPath();
    const baseRepoPath = randomBaseRepoPath();
    const configPath = getConfigFilePath(baseRepoPath);
    const configData = {repos: {}};
    const userFilePath = getUserFilePath(baseRepoPath);
    const userData = {};
    userData[TEST_EMAIL] = {access_token: "ABC"};

    beforeEach(() => {
        fetch.resetMocks();
        jest.clearAllMocks();
        untildify.mockReturnValue(baseRepoPath);
        fs.mkdirSync(baseRepoPath, {recursive: true});
        fs.mkdirSync(repoPath, {recursive: true});
        fs.writeFileSync(configPath, yaml.safeDump(configData));
        fs.writeFileSync(userFilePath, yaml.safeDump(userData));
    });

    afterEach(() => {
        fs.rmSync(repoPath, { recursive: true, force: true });
        fs.rmSync(baseRepoPath, { recursive: true, force: true });
    });

    test("No Selection",  async () => {
        await postSelectionUnsync(repoPath, undefined);
        expect(vscode.window.showErrorMessage).toHaveBeenCalledTimes(0);
        expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(0);
        expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(0);
    });

    test("Clicked Cancel",  async () => {
        await postSelectionUnsync(repoPath, NOTIFICATION.CANCEL);
        expect(vscode.window.showErrorMessage).toHaveBeenCalledTimes(0);
        expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(0);
        expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(0);
    });

    test("Repo is already inactive",  async () => {
        configData.repos[repoPath] = {
            is_disconnected: true,
            branches: {}
        };
        fs.writeFileSync(configPath, yaml.safeDump(configData));
        await postSelectionUnsync(repoPath, NOTIFICATION.YES);
        expect(vscode.window.showErrorMessage).toHaveBeenCalledTimes(0);
        expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(0);
        expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(0);
    });

    test("Unsyncing error from server",  async () => {
        const configUtil = new Config(repoPath, configPath);
        configUtil.addRepo();
        fetchMock.mockResponseOnce(JSON.stringify({error: "NOT SO FAST"}));

        await postSelectionUnsync(repoPath, NOTIFICATION.YES);

        expect(vscode.window.showErrorMessage).toHaveBeenCalledTimes(1);
        expect(vscode.window.showErrorMessage.mock.calls[0][0]).toStrictEqual(NOTIFICATION.REPO_UNSYNC_FAILED);
        expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(0);
        expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(0);
    });

    test("Synced successfully",  async () => {
        const configUtil = new Config(repoPath, configPath);
        configUtil.addRepo();
        fetchMock.mockResponseOnce(JSON.stringify({}));

        await postSelectionUnsync(repoPath, NOTIFICATION.YES);

        // Read config
        const config = readYML(configPath);
        expect(config.repos[repoPath].is_disconnected).toBe(true);
        expect(vscode.window.showErrorMessage).toHaveBeenCalledTimes(0);
        expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(1);
        expect(vscode.commands.executeCommand.mock.calls[0][0]).toStrictEqual("setContext");
        expect(vscode.commands.executeCommand.mock.calls[0][1]).toStrictEqual("showConnectRepoView");
        expect(vscode.window.showInformationMessage).toHaveBeenCalledTimes(1);
        expect(vscode.window.showInformationMessage.mock.calls[0][0]).toStrictEqual(NOTIFICATION.REPO_UNSYNCED);
    });
});

describe("trackRepoHandler",  () => {
    const repoPath = randomRepoPath();
    const baseRepoPath = randomBaseRepoPath();
    const configPath = getConfigFilePath(baseRepoPath);
    const configData = {repos: {}};
    const userFilePath = getUserFilePath(baseRepoPath);
    const userData = {};
    userData[TEST_EMAIL] = {access_token: "ABC"};

    beforeEach(() => {
        jest.clearAllMocks();
        untildify.mockReturnValue(baseRepoPath);
        fs.mkdirSync(baseRepoPath, {recursive: true});
        fs.mkdirSync(repoPath, {recursive: true});
        fs.writeFileSync(configPath, yaml.safeDump(configData));
        fs.writeFileSync(userFilePath, yaml.safeDump(userData));
    });

    afterEach(() => {
        fs.rmSync(repoPath, { recursive: true, force: true });
        fs.rmSync(baseRepoPath, { recursive: true, force: true });
    });

    test("No Repo Path",  () => {
        jest.spyOn(vscode.workspace, 'rootPath', 'get').mockReturnValue(undefined);
        trackRepoHandler();
        expect(vscode.env.openExternal).toHaveBeenCalledTimes(0);
    });

    test("Repo in config",  async () => {
        jest.spyOn(vscode.workspace, 'rootPath', 'get').mockReturnValue(repoPath);
        configData.repos[repoPath] = {
            id: 1234,
            branches: {},
        };
        fs.writeFileSync(configPath, yaml.safeDump(configData));
        const playbackLink = trackRepoHandler();
        expect(vscode.env.openExternal).toHaveBeenCalledTimes(1);
        expect(playbackLink.startsWith(WEB_APP_URL)).toBe(true);
    });
});

describe("trackFileHandler",  () => {
    const repoPath = randomRepoPath();
    const baseRepoPath = randomBaseRepoPath();
    const configPath = getConfigFilePath(baseRepoPath);
    const configData = {repos: {}};
    const userFilePath = getUserFilePath(baseRepoPath);
    const userData = {};
    userData[TEST_EMAIL] = {access_token: "ABC"};

    beforeEach(() => {
        jest.clearAllMocks();
        untildify.mockReturnValue(baseRepoPath);
        fs.mkdirSync(baseRepoPath, {recursive: true});
        fs.mkdirSync(repoPath, {recursive: true});
        fs.writeFileSync(configPath, yaml.safeDump(configData));
        fs.writeFileSync(userFilePath, yaml.safeDump(userData));
    });

    afterEach(() => {
        fs.rmSync(repoPath, { recursive: true, force: true });
        fs.rmSync(baseRepoPath, { recursive: true, force: true });
    });

    test("No Repo Path",  () => {
        jest.spyOn(vscode.workspace, 'rootPath', 'get').mockReturnValue(undefined);
        trackFileHandler();
        expect(vscode.env.openExternal).toHaveBeenCalledTimes(0);
    });

    test("No editor is opened",  () => {
        // Mock data
        jest.spyOn(vscode.workspace, 'rootPath', 'get').mockReturnValue(repoPath);
        jest.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValueOnce(undefined);
        trackFileHandler();
        expect(vscode.env.openExternal).toHaveBeenCalledTimes(0);
    });

    test("No file is opened",  () => {
        // Mock data
        jest.spyOn(vscode.workspace, 'rootPath', 'get').mockReturnValue(repoPath);
        jest.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValueOnce({
            document: {
                fileName: undefined
            }
        });
        trackFileHandler();
        expect(vscode.env.openExternal).toHaveBeenCalledTimes(0);
    });

    test("File Path not in config",  () => {
        // Mock data
        jest.spyOn(vscode.workspace, 'rootPath', 'get').mockReturnValue(repoPath);
        jest.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValue({
            document: {
                fileName: path.join(repoPath, "file.js")
            }
        });
        getBranchName.mockReturnValueOnce(DEFAULT_BRANCH);
        // Update config file
        configData.repos[repoPath] = {
            id: 1234,
            branches: {},
        };
        configData.repos[repoPath].branches[DEFAULT_BRANCH] = {};
        fs.writeFileSync(configPath, yaml.safeDump(configData));

        trackFileHandler();
        expect(vscode.env.openExternal).toHaveBeenCalledTimes(0);
    });

    test("File Path in config",  () => {
        // Mock data
        jest.spyOn(vscode.workspace, 'rootPath', 'get').mockReturnValue(repoPath);
        jest.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValue({
            document: {
                fileName: path.join(repoPath, "file.js")
            }
        });
        getBranchName.mockReturnValueOnce(DEFAULT_BRANCH);
        // Update config file
        configData.repos[repoPath] = {
            id: 1234,
            branches: {}
        };
        configData.repos[repoPath].branches[DEFAULT_BRANCH] = {"file.js": 1234};
        fs.writeFileSync(configPath, yaml.safeDump(configData));

        trackFileHandler();
        expect(vscode.env.openExternal).toHaveBeenCalledTimes(1);
    });

});
