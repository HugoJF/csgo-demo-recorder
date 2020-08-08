module.exports = {
    // TODO: move to environment file
    csgoExecPath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo.exe",
    csgoDemoPath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo\\",
    csgoBasePath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\csgo\\",
    csgoRecordPath: "Z:\\CSGO_Recordings\\raw\\",
    csgoRecordingsPath: "Z:\\CSGO_Recordings\\transcoded\\",
    hlaeExecPath: "C:\\Program Files (x86)\\HLAE\\HLAE.exe",
    api: 'https://calladmin-middleware.denerdtv.com/api/v1/',

    csgoRequiredCommands: [
        "sv_cheats 1",
        "host_timescale 0",
        "mirv_snd_timescale 1",
        "mirv_gameoverlay enable 1",
        "host_framerate 60",
    ],
    csgoOptionalCommands: [
        "cl_draw_only_deathnotices 0",
        "cl_clock_correction 0",
        "spec_show_xray 1",
        "voice_enable 1",
        "voice_scale 1",
        "mirv_fix playerAnimState 1",
        "mirv_streams record matPostprocessEnable 1",
        "mirv_streams record matDynamicTonemapping 1",
        "mirv_streams record matMotionBlurEnabled 0",
        "mirv_streams record matForceTonemapScale 0",
        "net_graph 0",
        "volume 1",
    ],
    csgoOptionalCommandsTick: 64,
    csgoRequiredCommandsTick: 128,
    csgoStartRecordingTick: 192,
    csgoWarmupTicks: 1024,
    csgoDurationTicks: 640,

    getOptions: {
        headers: {
            Accept: 'application/json',
        }
    },
    postOptions: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    },
};