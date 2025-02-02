import fs from "fs";
import path from "path";
import vscode from "vscode";
import untildify from "untildify";
import getBranchName from "current-git-branch";

import {pathUtils} from "../../../src/utils/path_utils";
import {eventHandler} from "../../../src/events/event_handler";
import {DEFAULT_BRANCH} from "../../../src/constants";
import {
    addUser,
    assertFileDeleteEvent,
    Config,
    getConfigFilePath,
    randomBaseRepoPath,
    randomRepoPath,
    waitFor
} from "../../helpers/helpers";
import {populateBuffer} from "../../../src/codesyncd/populate_buffer";

describe("handleDeletedEvent",  () => {
    /*
     {
        source: 'vs-code',
        created_at: '2021-08-26 18:59:51.954',
        diff: "",
        repo_path: 'tests/tests_data/test_repo_sNIVUqukDv',
        branch: 'default',
        file_relative_path: 'new.js',
        is_deleted: true
     }
    */
    const repoPath = randomRepoPath();
    const baseRepoPath = randomBaseRepoPath();
    const configPath = getConfigFilePath(baseRepoPath);

    untildify.mockReturnValue(baseRepoPath);

    const pathUtilsObj = new pathUtils(repoPath, DEFAULT_BRANCH);
    const shadowRepoBranchPath = pathUtilsObj.getShadowRepoBranchPath();
    const diffsRepo = pathUtilsObj.getDiffsRepo();

    const fileRelPath = "file_1.js";
    // For file
    const filePath = path.join(repoPath, fileRelPath);
    const cacheRepoBranchPath = pathUtilsObj.getDeletedRepoBranchPath();
    const cacheFilePath = path.join(cacheRepoBranchPath, fileRelPath);
    const shadowFilePath = path.join(shadowRepoBranchPath, fileRelPath);

    // For directory
    const directoryPath = path.join(repoPath, "directory");
    const directoryFilePath = path.join(directoryPath, fileRelPath);
    const relFilePath = path.join("directory", fileRelPath);
    const shadowDirectoryPath = path.join(shadowRepoBranchPath, "directory");
    const shadowDirectoryFilePath = path.join(shadowDirectoryPath, fileRelPath);

    beforeEach(() => {
        jest.clearAllMocks();
        untildify.mockReturnValue(baseRepoPath);
        jest.spyOn(vscode.workspace, 'rootPath', 'get').mockReturnValue(repoPath);
        getBranchName.mockReturnValue(DEFAULT_BRANCH);
        // Create directories
        fs.mkdirSync(baseRepoPath, { recursive: true });
        const configUtil = new Config(repoPath, configPath);
        configUtil.addRepo();
        // Add user
        addUser(baseRepoPath);
        fs.mkdirSync(repoPath, { recursive: true });
        fs.mkdirSync(diffsRepo, { recursive: true });

        fs.mkdirSync(shadowRepoBranchPath, { recursive: true });
        fs.writeFileSync(shadowFilePath, "use babel;");

        // For directory rename, repo will have new directory but shadow will have old repo
        fs.mkdirSync(directoryPath, { recursive: true });
        fs.writeFileSync(directoryFilePath, "use babel;");

        fs.mkdirSync(shadowDirectoryPath, { recursive: true });
        fs.writeFileSync(shadowDirectoryFilePath, "use babel;");
    });

    afterEach(() => {
        fs.rmSync(repoPath, { recursive: true, force: true });
        fs.rmSync(baseRepoPath, { recursive: true, force: true });
    });

    test("Repo is not synced",  () => {
        const configUtil = new Config(repoPath, configPath);
        configUtil.removeRepo();
        const event = {
            files: [{
                fsPath: filePath,
                path: filePath,
                scheme: "file"
            }]
        };
        const handler = new eventHandler();
        handler.handleDeleteEvent(event);
        // Verify correct diff file has been generated
        let diffFiles = fs.readdirSync(diffsRepo);
        expect(diffFiles).toHaveLength(0);
        // Verify file was not copied to .deleted
        expect(fs.existsSync(cacheFilePath)).toBe(false);
    });

    test("Event: Synced repo, Ignorable file", () => {
        const event = {
            files: [{
                fsPath: path.join(repoPath, "node_modules", "express", "index.js")
            }]
        };
        const handler = new eventHandler();
        handler.handleDeleteEvent(event);
        // Verify correct diff file has been generated
        let diffFiles = fs.readdirSync(diffsRepo);
        expect(diffFiles).toHaveLength(0);
    });

    test("Repo synced, shadow exists",  () => {
        const event = {
            files: [{
                fsPath: filePath,
                path: filePath,
                scheme: "file"
            }]
        };
        const handler = new eventHandler();
        handler.handleDeleteEvent(event);
        expect(assertFileDeleteEvent(repoPath, fileRelPath)).toBe(true);
    });

    test("With Daemon: Repo synced, shadow exists",  async () => {
        const event = {
            files: [{
                fsPath: filePath,
                path: filePath,
                scheme: "file"
            }]
        };
        const handler = new eventHandler();
        handler.handleDeleteEvent(event);
        await populateBuffer();
        expect(assertFileDeleteEvent(repoPath, fileRelPath)).toBe(true);
    });

    test("Repo synced, shadow does NOT exists",  () => {
        fs.rmSync(shadowFilePath);
        const event = {
            files: [{
                fsPath: filePath,
                path: filePath,
                scheme: "file"
            }]
        };
        const handler = new eventHandler();
        handler.handleDeleteEvent(event);
        // Verify that file is not copied to .delete directory
        expect(fs.existsSync(cacheFilePath)).toBe(false);
        // Verify correct diff file has been generated
        let diffFiles = fs.readdirSync(diffsRepo);
        expect(diffFiles).toHaveLength(0);
    });

    test("Repo synced, user is inActive",  () => {
        addUser(baseRepoPath, false);
        const event = {
            files: [{
                fsPath: filePath,
                path: filePath,
                scheme: "file"
            }]
        };
        const handler = new eventHandler();
        handler.handleDeleteEvent(event);
        // Verify that file is not copied to .delete directory
        expect(fs.existsSync(cacheFilePath)).toBe(false);
        // Verify correct diff file has been generated
        let diffFiles = fs.readdirSync(diffsRepo);
        expect(diffFiles).toHaveLength(0);
    });

    test("Repo synced, .delete file exists",  () => {
        fs.mkdirSync(cacheRepoBranchPath, { recursive: true });
        fs.writeFileSync(cacheFilePath, "use babel;");

        const event = {
            files: [{
                fsPath: filePath,
                path: filePath,
                scheme: "file"
            }]
        };
        const handler = new eventHandler();
        handler.handleDeleteEvent(event);
        // Verify correct diff file has been generated
        let diffFiles = fs.readdirSync(diffsRepo);
        expect(diffFiles).toHaveLength(0);
    });

    test("Repo synced, Directory delete event",  async () => {
        const event = {
            files: [{
                fsPath: directoryPath,
                path: directoryPath,
                scheme: "file"
            }]
        };
        const handler = new eventHandler();
        handler.handleDeleteEvent(event);
        await waitFor(1);
        expect(assertFileDeleteEvent(repoPath, relFilePath, true)).toBe(true);
    });
});

describe("handleDirectoryDeleteDiffs", () => {
    /*
     {
        source: 'vs-code',
        created_at: '2021-08-26 18:59:51.954',
        diff: '',
        repo_path: 'tests/tests_data/test_repo_sNIVUqukDv',
        branch: 'default',
        file_relative_path: 'new.js',
        is_deleted: true
      }
    * */

    const repoPath = randomRepoPath();
    const baseRepoPath = randomBaseRepoPath();
    const fileRelPath = "file_1.js";

    untildify.mockReturnValue(baseRepoPath);

    const pathUtilsObj = new pathUtils(repoPath, DEFAULT_BRANCH);
    const diffsRepo = pathUtilsObj.getDiffsRepo();
    const shadowRepoBranchPath = pathUtilsObj.getShadowRepoBranchPath();
    const cacheRepoBranchPath = pathUtilsObj.getDeletedRepoBranchPath();

    const shadowDirectoryPath = path.join(shadowRepoBranchPath, "directory");
    const shadowFilePath = path.join(shadowDirectoryPath, fileRelPath);
    const relFilePath = path.join("directory", fileRelPath);
    const cacheFilePath = path.join(cacheRepoBranchPath, relFilePath);

    beforeEach(() => {
        jest.clearAllMocks();
        untildify.mockReturnValue(baseRepoPath);
        fs.mkdirSync(repoPath, { recursive: true });
        fs.mkdirSync(diffsRepo, { recursive: true });
        fs.mkdirSync(shadowDirectoryPath, { recursive: true });
        fs.writeFileSync(shadowFilePath, "use babel;");
    });

    afterEach(() => {
        fs.rmSync(repoPath, { recursive: true, force: true });
        fs.rmSync(baseRepoPath, { recursive: true, force: true });
    });

    test("NOT in .deleted",  async () => {
        const handler = new eventHandler(repoPath);
        handler.handleDirectoryDeleteDiffs("directory");
        await waitFor(1);
        expect(assertFileDeleteEvent(repoPath, relFilePath)).toBe(true);
    });

    test("with file already in .deleted",  async () => {
        fs.mkdirSync(path.join(cacheRepoBranchPath, "directory"), { recursive: true });
        fs.writeFileSync(cacheFilePath, "use babel;");
        const handler = new eventHandler(repoPath);
        handler.handleDirectoryDeleteDiffs("directory");
        await waitFor(1);
        // Verify correct diff file has been generated
        let diffFiles = fs.readdirSync(diffsRepo);
        expect(diffFiles).toHaveLength(0);
    });

});

