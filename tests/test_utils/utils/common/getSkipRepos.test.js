import fs from "fs";
import { getSkipRepos, getSyncIgnoreItems } from "../../../../src/utils/common";
import { randomRepoPath } from "../../../helpers/helpers";
import { IGNORABLE_DIRECTORIES } from "../../../../src/constants";


describe("getSkipRepos",  () => {
    const repoPath = randomRepoPath();
    const syncIgnorePath = `${repoPath}/.syncignore`;
    const syncIgnoreData = ".skip_repo_1\n\n\n.skip_repo_2\n";

    beforeEach(() => {
        // Create directories
        fs.mkdirSync(repoPath, { recursive: true });
        fs.mkdirSync(`${repoPath}/.skip_repo_1`, { recursive: true });
        fs.mkdirSync(`${repoPath}/.skip_repo_2`, { recursive: true });
        fs.writeFileSync(`${repoPath}/file.js`, "");
    });

    afterEach(() => {
        fs.rmdirSync(repoPath, { recursive: true });
    });

    test('skipRepos with .syncignore items', () => {
        fs.writeFileSync(syncIgnorePath, syncIgnoreData);
        const syncIgnoreItems = getSyncIgnoreItems(repoPath);
        const skippedRepos = getSkipRepos(repoPath, syncIgnoreItems);
        expect(skippedRepos).toEqual([...IGNORABLE_DIRECTORIES, ...syncIgnoreItems]);
    });

    test('skipRepos with NO .syncignore, default values', () => {
        const skippedRepos = getSkipRepos(repoPath, []);
        expect(skippedRepos).toStrictEqual(IGNORABLE_DIRECTORIES);
    });

    test('with non-existing .syncignore item', () => {
        const skippedRepos = getSkipRepos(repoPath, ["directory"]);
        expect(skippedRepos).toStrictEqual(IGNORABLE_DIRECTORIES);
    });

    test('with file in syncignore', () => {
        const skippedRepos = getSkipRepos(repoPath, ["file.js"]);
        expect(skippedRepos).toStrictEqual(IGNORABLE_DIRECTORIES);
    });

});