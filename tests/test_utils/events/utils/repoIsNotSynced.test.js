import fs from "fs";
import yaml from "js-yaml";
import {repoIsNotSynced} from "../../../../src/events/utils";
import {randomBaseRepoPath, randomRepoPath} from "../../../helpers/helpers";
import untildify from "untildify";


describe("repoIsNotSynced", () => {
    const baseRepo = randomBaseRepoPath();
    const configPath = `${baseRepo}/config.yml`;

    const repoPath = randomRepoPath();

    beforeEach(() => {
        // Create directories
        fs.mkdirSync(repoPath, {recursive: true});
        // Create directories
        fs.mkdirSync(baseRepo, {recursive: true});
        jest.clearAllMocks();
        untildify.mockReturnValue(baseRepo);
    });

    afterEach(() => {
        fs.rmdirSync(baseRepo, {recursive: true});
        fs.rmdirSync(repoPath, {recursive: true});
    });

    test("with no config.yml", () => {
        expect(repoIsNotSynced(repoPath)).toBe(true);
    });

    test("with default config.yml", () => {
        expect(repoIsNotSynced(repoPath)).toBe(true);
    });

    test("with repo not in config.yml", () => {
        fs.writeFileSync(configPath, yaml.safeDump({'repos': {}}));
        expect(repoIsNotSynced(repoPath)).toBe(true);
        fs.rmSync(configPath);
    });

    test("with repo in config.yml", () => {
        const config = {'repos': {}};
        config.repos[repoPath] = {'branches': {}};
        fs.writeFileSync(configPath, yaml.safeDump(config));
        expect(repoIsNotSynced(repoPath)).toBe(false);
        fs.rmSync(configPath);
    });

    test("repoIsNotSynced with invalid config.yml", () => {
        fs.writeFileSync(configPath, "");
        expect(repoIsNotSynced(repoPath)).toBe(true);
        fs.rmSync(configPath);
    });
});