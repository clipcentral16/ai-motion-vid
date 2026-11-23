import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// WebGL (Three.js) needs a GL backend in headless Chrome.
Config.setChromiumOpenGlRenderer("angle");
