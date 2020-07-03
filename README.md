pm-cli
======



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/pm-cli.svg)](https://npmjs.org/package/pm-cli)
[![Downloads/week](https://img.shields.io/npm/dw/pm-cli.svg)](https://npmjs.org/package/pm-cli)
[![License](https://img.shields.io/npm/l/pm-cli.svg)](https://github.com/dasanra/pm-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g pm-cli
$ pm-cli COMMAND
running command...
$ pm-cli (-v|--version|version)
pm-cli/0.0.0 linux-x64 node-v12.16.3
$ pm-cli --help [COMMAND]
USAGE
  $ pm-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`pm-cli hello`](#pm-cli-hello)
* [`pm-cli help [COMMAND]`](#pm-cli-help-command)

## `pm-cli hello`

Describe the command here

```
USAGE
  $ pm-cli hello

OPTIONS
  -n, --name=name  name to print

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src/commands/hello.js](https://github.com/dasanra/pm-cli/blob/v0.0.1/src/commands/hello.js)_

## `pm-cli get-funding-events`

Describe the command here

```
USAGE
  $ pm-cli hello

OPTIONS
  -m, --market=maketAddress  market address to search for events

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src/commands/get-funding-events.js](https://github.com/dasanra/pm-cli/blob/v0.0.1/src/commands/get-funding-events.js)_

## `pm-cli help [COMMAND]`

display help for pm-cli

```
USAGE
  $ pm-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.1.0/src/commands/help.ts)_
<!-- commandsstop -->
