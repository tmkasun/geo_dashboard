#!/usr/bin/env bash
java -jar compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js ../websocket.js ../geo_remote.js ../geo_fencing.js ../show_alert_in_map.js  --js_output_file  ../wso2_geo/wso2_geo.min.js
