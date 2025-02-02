import path from "path";
import vscode from "vscode";

import { generateSettings } from "../settings";


export class pathUtils {
    repoPath: string;
    formattedRepoPath: string;
    branch: string;
    settings: any;

    constructor(repoPath: string, branch: string) {
        this.repoPath = repoPath;
        this.formattedRepoPath = pathUtils.formatRepoPath(repoPath);
        this.branch = branch;
        this.settings = generateSettings();
    }

    static getRootPath = () => {
        let rootPath = vscode.workspace.rootPath;
        if (!rootPath) return "";
        rootPath = pathUtils.normalizePath(rootPath);
        return rootPath;
    };

    static normalizePath = (itemPath: string) => {
        // For window paths, capitalizing drive name
        // e.g. c:\Users\repo to C:\Users\repo
        if (itemPath && itemPath.indexOf(":") > -1 && !itemPath.startsWith("/")) {
            itemPath = itemPath.charAt(0).toUpperCase() + itemPath.slice(1);
        }
        return itemPath;
    };

    static formatRepoPath = (repoPath: string) => {
        return repoPath.replace(":", "");
    };

    getOriginalsRepoPath = () => {
        return path.join(this.settings.ORIGINALS_REPO, this.formattedRepoPath);
    };

    getOriginalsRepoBranchPath = () => {
        return path.join(this.getOriginalsRepoPath(), this.branch);
    };

    getShadowRepoPath = () => {
        return path.join(this.settings.SHADOW_REPO, this.formattedRepoPath);
    };

    getShadowRepoBranchPath = () => {
        return path.join(this.getShadowRepoPath(), this.branch);
    };

    getDeletedRepoPath = () => {
        return path.join(this.settings.DELETED_REPO, this.formattedRepoPath);
    };

    getDeletedRepoBranchPath = () => {
        return path.join(this.getDeletedRepoPath(), this.branch);
    };

    getDiffsRepo = () => {
        return path.join(this.settings.DIFFS_REPO);
    }

}
