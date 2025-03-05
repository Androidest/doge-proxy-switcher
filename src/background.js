// background script runs when the extension is installed, upgraded, or when the browser starts up
'use strict';
import {apiRequest, registerApi, storage, toConfig } from './utils.js';

// ======================== Init ========================
registerApi({
    bg_setProxy : bg_setProxy,
    bg_clearProxy: bg_clearProxy,
    bg_setSelectedProxy: bg_setSelectedProxy,
});

var lastProxyConfig = '';
var lastProxyStatus = { success: false }
// set default proxy on background load
bg_setSelectedProxy();

// ======================== API ========================
async function bg_setSelectedProxy(request, sender, sendResponse) {
    const proxies = await storage.get(storage.proxies) || [];
    const selected_index = await storage.get(storage.selected_index) || 0;

    if (selected_index == 0) {
        bg_clearProxy(request, sender, sendResponse);
    }
    else {
        const proxy = proxies[selected_index-1];
        bg_setProxy({
            proxyConfig: toConfig(proxy), 
            badgeText: proxy.name.substring(0, 3)
        }, sender, sendResponse);
    }
}

async function bg_setProxy(request, sender, sendResponse) {
    let { proxyConfig, badgeText } = request;

    const configJson = JSON.stringify(proxyConfig);
    console.log('bg_setProxy:', configJson);
    if (configJson == lastProxyConfig) {
        sendResponse && sendResponse(lastProxyStatus);
        return;
    }

    lastProxyStatus = { success: false };
    lastProxyConfig = configJson;

    try {
        chrome.proxy.settings.set({
            value: proxyConfig,
            scope: 'regular'
        }, function () {
            if (chrome.runtime.lastError) {
                console.error('Error setting proxy:', chrome.runtime.lastError);
                lastProxyStatus = { success: false, error: chrome.runtime.lastError.message };
            } else {
                chrome.action.setBadgeText({text: badgeText});
                chrome.action.setBadgeBackgroundColor({ color: "#00FF00" });
                console.log('Proxy set successfully to:\n', proxyConfig);
                lastProxyStatus = { success: true };
            }
            sendResponse && sendResponse(lastProxyStatus);
        });
    }
    catch (e) {
        lastProxyStatus = { success: false, error: e.message };
        sendResponse && sendResponse(lastProxyStatus);
    }
}

async function bg_clearProxy(request, sender, sendResponse) {
    try {
        chrome.proxy.settings.clear({ scope: 'regular' }, function () {
            if (chrome.runtime.lastError) {
                console.error('Error clearing proxy:', chrome.runtime.lastError);
                lastProxyStatus = { success: false, error: chrome.runtime.lastError.message };
            } else {
                lastProxyConfig = '';
                chrome.action.setBadgeText({text: ""});
                console.log('Proxy cleared successfully');
                lastProxyStatus = { success: true };
            }
            sendResponse && sendResponse(lastProxyStatus);
        });
    }
    catch (e) {
        lastProxyStatus = { success: false, error: e.message };
        sendResponse && sendResponse(lastProxyStatus);
    }
}