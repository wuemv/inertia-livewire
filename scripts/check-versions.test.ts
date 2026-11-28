import { expect, it } from 'vitest';
import { versionProblem } from './check-versions.mjs';

const same = { '@wuemv/inertia-livewire': '0.3.0', '@wuemv/inertia-livewire-vue': '0.3.0' };

it('passes when every package has the same version', () => {
    expect(versionProblem(same, 'refs/heads/main')).toBeNull();
    expect(versionProblem(same, undefined)).toBeNull();
});

it('names the packages when one has another version', () => {
    const problem = versionProblem({ ...same, '@wuemv/inertia-livewire-react': '0.2.0' }, 'refs/heads/main');

    expect(problem).toContain('@wuemv/inertia-livewire-react 0.2.0');
    expect(problem).toContain('@wuemv/inertia-livewire 0.3.0');
});

it('checks a release tag against the version', () => {
    expect(versionProblem(same, 'refs/tags/v0.3.0')).toBeNull();
    expect(versionProblem(same, 'refs/tags/v0.3.1')).toBe("The tag v0.3.1 doesn't match the packages' version, 0.3.0.");
});

it('leaves tags that are not releases alone', () => {
    expect(versionProblem(same, 'refs/tags/banner')).toBeNull();
});
