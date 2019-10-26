# CS:GO Demo Recoder for CallAdmin-Middleware

CS:GO demo recorder for reports using CallAdmin-Middleware as a manager.

## How it works
This script downloads demos from CallAdmin-Middleware, process them using [demofile](https://github.com/saul/demofile) to extract demo, player and chat data, builds a `.vdm` for each demo (that way commands can be run according to what tick is being played in the demo), uses [HLAE](https://github.com/advancedfx/advancedfx) to record a raw video of it, and then transcodes the result using [ffmpeg](https://github.com/FFmpeg/FFmpeg).

## Requirements
  * An installation of [CallAdmin-Middleware](https://github.com/HugoJF/calladmin-middleware);
  * ffmpeg;
  * HLAE;
  * Computer with a GPU that can run CS:GO;
  * Enough storage to hold raw video (the same duration as the demo been recorded).

## Installing

Clone this repository and run:
```
npm install
```

## Configuration
Most of the configurations can be found inside `config.js`:

#### `csgoExecPath`
Path to CS:GO executable

#### `csgoDemoPath`
Path to store downloaded demos. Recommended to store inside the same path as the executable so `playdemo` can be shorter.

#### `csgoRecordPath`
Where HLAE raw recordings should be stored (expect large files).

#### `csgoRecordingsPath`
Where ffmpeg should store transcoded recordings.

#### `hlaeExecPath`
Path to HLAE executable.

#### `api`
CallAdmin-Middleware API prefix

#### `csgoRequiredCommands`
Should not be changed since they are needed for each recording.

#### `csgoOptionalCommands`
Optional commands (anything that's valid inside CS:GO and HLAE).

#### `csgoOptionalCommandsTick`
What tick optional commands will run.

#### `csgoRequiredCommandsTick`
What tick required commands will run.

#### `csgoStartRecordingTick`
What tick the recording will start.

#### `csgoWarmupTicks`
How many ticks should be waited before running commands.

#### `csgoDurationTicks`
DEPRECATED
