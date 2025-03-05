// storage to persist data
const storage = {
	// storage keys
	proxies: 'proxies',
	selected_index: 'selected_index',
	
	// storage methods
	set: async (key, value) => {
		const data = { [key]: value };
		console.log('storage set:', data);
		await chrome.storage.sync.set(data);
	},
	get: async (key) => {
		const data = await chrome.storage.sync.get([key]);
		const value = data[key];
		console.log('storage get:', key, value);
		return value;
	}
}

/**
 * Sends an API request based on the API name and parameters.
 * If the API name starts with 'tab_', it sends a message to the active tab.
 * If the API name starts with 'bg_', it sends a message to the background script.
 * Otherwise, it rejects the request with an error.
 * @param {string} api_name - The name of the API to call.
 * @param {Object} params - The parameters to pass to the API.
 * @returns {Promise} A promise that resolves with the API response or rejects with an error.
 */
function apiRequest(api_name, params) {
	if (api_name == null)
		throw new Error('api_name is null');

    return new Promise(async (resolve, reject) => {
        // Check if the API name starts with 'tab_'
        if (api_name.startsWith('tab_')) {
            // Query the active tab in the current window
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const activeTab = tabs[0];
            // Send a message to the active tab
            chrome.tabs.sendMessage(activeTab.id, { type: api_name, ...params }, (response) => {
                // Check if there is a runtime error
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    // Log the API response
                    console.log('tab api:', api_name, response);
                    resolve(response);
                }
            });
        // Check if the API name starts with 'bg_'
        } else if (api_name.startsWith('bg_')) {
            // Send a message to the background script
            chrome.runtime.sendMessage({ type: api_name, ...params }, (response) => {
                // Check if there is a runtime error
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    // Log the API response
                    console.log('tab api:', api_name, response);
                    resolve(response);
                }
            });
        } else {
            // Reject the request if the API name is invalid
            reject(new Error('Invalid API name'));
        }
    });
}

/**
 * Registers a set of API handlers by listening for incoming messages and routing them to the appropriate handlers.
 * @param {Object} apiMap - An object where keys are API names and values are functions that handle the corresponding API requests.
 */
function registerApi(apiMap) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Check if the API name in the request exists in the apiMap
        if (!apiMap[request.type])
            // If not, return false to indicate that the message was not handled
            return false;
        // Call the API handler function with the request, sender, and sendResponse function
        apiMap[request.type](request, sender, sendResponse);
        // console.log('Tab api:', request.type, request);
        return true;
    });
}

class Proxy {
	name;
	scheme;
	host;
	port;
	bypassList;

	constructor(name, scheme, host, port, bypassList) {
		this.name = name;
		this.scheme = scheme;
		this.host = host;
		this.port = port;
		this.bypassList = bypassList;
	}
}

function toConfig(proxy) {
	let bypassList = [];
	if (proxy.bypassList && proxy.bypassList.length > 0) {
		bypassList = proxy.bypassList.split(';');
	}
	return {
		mode: "fixed_servers",
		rules: {
			singleProxy: {
				scheme: proxy.scheme,
				host: proxy.host,
				port: Number(proxy.port)
			},
			bypassList: bypassList
		}
	}
}

const mainIconUrl = `${chrome.runtime.getURL('icons/icon_128.png')}`
const mainIconUrl_css = `url(${mainIconUrl})`

export { storage, apiRequest, registerApi, mainIconUrl, mainIconUrl_css, toConfig, Proxy };