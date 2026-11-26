# Security policy

## Reporting a vulnerability

Please report it privately through GitHub: [report a vulnerability](https://github.com/wuemv/inertia-livewire/security/advisories/new) (the repository's Security tab, then "Report a vulnerability"). Don't open a public issue or pull request for it.

Say what an attacker can do, and how: the request or page, the versions of this package, Laravel, Livewire and Inertia, and the steps or a proof of concept. You'll get a reply within a week. Once a fix is released, the advisory is published with credit to you, unless you'd rather not be named.

## What counts

The package's own security promises, for example:

- A lazy component's URL must work only for the user it was made for, only until it expires, and only unaltered. It must not reveal the component's name or its parameters.
- Mount parameters (`$params`) must never reach the browser as page props.
- The render endpoint must render only what the server signed.

A problem in Laravel, Livewire or Inertia themselves belongs to those projects. A component that renders something it shouldn't is the app's own code, unless this package let someone choose the component or its parameters.

## Supported versions

Fixes go into the latest release. Before 1.0, that is the latest 0.x minor version.
