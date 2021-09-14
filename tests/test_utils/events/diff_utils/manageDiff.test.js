import fs from "fs";
import path from "path";
import untildify from "untildify";
import {DATETIME_FORMAT, DEFAULT_BRANCH} from "../../../../src/constants";
import {randomBaseRepoPath, randomRepoPath} from "../../../helpers/helpers";
import {manageDiff} from "../../../../src/events/diff_utils";
import dateFormat from "dateformat";
import {readYML} from "../../../../src/utils/common";
import {DIFF_SOURCE} from "../../../../src/constants";


describe("manageDiff", () => {

    const repoPath = randomRepoPath();
    const baseRepo = randomBaseRepoPath();
    const diffsRepo = path.join(baseRepo, ".diffs/.vscode");
    const newFilePath = `${repoPath}/new.js`;

    beforeEach(() => {
        // Create directories
        fs.mkdirSync(repoPath, { recursive: true });
        fs.mkdirSync(diffsRepo, { recursive: true });
        jest.clearAllMocks();
        untildify.mockReturnValue(baseRepo);

    });

    afterEach(() => {
        fs.rmdirSync(baseRepo, { recursive: true });
        fs.rmdirSync(repoPath, { recursive: true });
    });

    test("should be skipped",() => {
        manageDiff(repoPath, DEFAULT_BRANCH, newFilePath, "", false, false,
            false, "");
        // Verify no diff file should be generated
        let diffFiles = fs.readdirSync(diffsRepo);
        expect(diffFiles).toHaveLength(0);
    });

    test("with createdAt",() => {
        const createdAt = dateFormat(new Date(), DATETIME_FORMAT);
        manageDiff(repoPath, DEFAULT_BRANCH, newFilePath, "diff", false,
            false, false, createdAt);
        // Verify no diff file should be generated
        let diffFiles = fs.readdirSync(diffsRepo);
        expect(diffFiles).toHaveLength(1);
        const diffFilePath = `${diffsRepo}/${diffFiles[0]}`;
        const diffData = readYML(diffFilePath);
        expect(diffData.source).toEqual(DIFF_SOURCE);
        expect(diffData.created_at).toEqual(createdAt);
    });

});