/*
 *  Copyright (c) 2005-2010, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var ApplicationOptions = {
    colors: {
        states: {
            NORMAL: 'blue',
            WARNING: 'orange',
            OFFLINE: 'grey',
            ALERTED: 'red',
            UNKNOWN: '#19FFFF'
        },
        application: {
            header: 'grey'
        }
    },
    constance:{
        SPEED_HISTORY_COUNT: 20,
//        WEB_SOCKET_URL: null,// Need to update when page load according to the login tenant
        NOTIFY_INFO_TIMEOUT: 1000,
        NOTIFY_SUCCESS_TIMEOUT: 1000,
        NOTIFY_WARNING_TIMEOUT: 3000,
        NOTIFY_DANGER_TIMEOUT: 5000
    },
    messages:{
        app:{

        }
    },
    leaflet: {
        iconUrls: {
            normalIcon: 'assets/img/markers/arrow_normal.png',
            alertedIcon: 'assets/img/markers/arrow_alerted.png',
            offlineIcon: 'assets/img/markers/arrow_offline.png',
            warningIcon: 'assets/img/markers/arrow_warning.png',
            defaultIcon: 'assets/img/markers/default_icons/marker-icon.png'

        }
    }
};