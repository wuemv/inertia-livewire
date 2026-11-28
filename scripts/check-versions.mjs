// One release is one version for everything: the npm packages in packages/ share it, and
// the Composer package takes it from the release tag. CI runs this on every push.
import { readdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * What is wrong with the versions, if anything.
 *
 * @param {Record<string, string>} versions Package name → version.
 * @param {string | undefined} ref The Git ref CI runs for (GITHUB_REF), such as `refs/tags/v0.2.0`.
 * @returns {string | null}
 */
export function versionProblem(versions, ref) {
    const found = new Set(Object.values(versions));
    if (found.size > 1) {
        const list = Object.entries(versions).map(([name, version]) => `${name} ${version}`);

        return `The packages have different versions (${list.join(', ')}). Give them all the same one.`;
    }
    const [version] = found;
    if (ref?.startsWith('refs/tags/v') && ref !== `refs/tags/v${version}`) {
        return `The tag ${ref.slice('refs/tags/'.length)} doesn't match the packages' version, ${version}.`;
    }

    return null;
}

/** @returns {Record<string, string>} */
function readVersions() {
    const packages = new URL('../packages/', import.meta.url);

    return Object.fromEntries(
        readdirSync(packages, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => {
                const json = JSON.parse(readFileSync(new URL(`${entry.name}/package.json`, packages), 'utf8'));

                return [json.name, json.version];
            }),
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const versions = readVersions();
    const problem = versionProblem(versions, process.env.GITHUB_REF);
    if (problem) {
        console.error(problem);
        process.exit(1);
    }
    console.log(`Every package is at ${Object.values(versions)[0]}.`);
}
