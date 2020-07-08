pm-cli
======

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
<!-- [![Version](https://img.shields.io/npm/v/pm-cli.svg)](https://npmjs.org/package/pm-cli)
[![Downloads/week](https://img.shields.io/npm/dw/pm-cli.svg)](https://npmjs.org/package/pm-cli)
[![License](https://img.shields.io/npm/l/pm-cli.svg)](https://github.com/dasanra/pm-cli/blob/master/package.json) -->

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
<!-- ```sh-session
$ npm install -g pm-cli
$ pm-cli COMMAND
running command...
$ pm-cli (-v|--version|version)
pm-cli/0.0.1 linux-x64 node-v12.16.3
$ pm-cli --help [COMMAND]
USAGE
  $ pm-cli COMMAND
...
``` -->

Running directly from repository root folder:

```sh-session
$ ./bin/run COMMAND
running command...
$ ./bin/run (-v|--version|version)
pm-cli/0.0.1 linux-x64 node-v12.16.3
$ ./bin/run --help [COMMAND]
USAGE
  $ pm-cli COMMAND
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`pm-cli get-funding-events`](#pm-cli-get-funding-events)
* [`pm-cli get-address-participation`](#pm-cli-get-address-participation)
* [`pm-cli help [COMMAND]`](#pm-cli-help-command)

## `pm-cli get-funding-events`

Use this command to query for funding events in a selected market. It will show a table showing funding added or removed ordered by time. It can be filtered using a start and an end date.

```
USAGE
  $ pm-cli get-funding-events

OPTIONS
  -m, --market=maketAddress  market address to search for events
  --fromDate=startDate  Date in which you would like to start to check for events
  --toDate=endDate  Date to stop searching for events

DESCRIPTION
  Returns a list of all the events in the given time period. If no time period is selected it will assume fromDate
  to be 1 month ago current date and toDate to be current date.
```

_See code: [src/commands/get-funding-events.js](https://github.com/gnosis/pm-liquidity-incentive-cli/blob/develop/src/commands/get-funding-events.js)_

## `pm-cli get-address-participation`

Use this command to get address participation in a market funding during a time frame

```
USAGE
  $ pm-cli get-address-participation

OPTIONS
  -m, --market=maketAddress  market address to search for events
  --fromDate=startDate  Date in which you would like to start to check for events
  --toDate=endDate  Date to stop searching for events
  -r, --reward=reward Reward to split between participants providing liquidity to the market

DESCRIPTION
  Using this command will allow to calculate address participation in liquidity providing for the selected market.
  If a reward is provided as a liquidity incentive it will be automatically splitted proportionaly between addresses based on their participation.

  This command will only do the liquidity incentive calculation. Is up to the user to send the transactions manually.
```

_See code: [src/commands/get-address-participation.js](https://github.com/gnosis/pm-liquidity-incentive-cli/blob/develop/src/commands/get-address-participation.js)_

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
