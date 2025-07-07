console.log('Browser Controller extension background script loaded.');

// WebSocket connection state
let ws = null;
let isConnected = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 2000;

// WebSocket server configuration
const WS_SERVER_URL = 'ws://localhost:8080';

// Connect to WebSocket server
async function connectToServer() {
    try {
        console.log('Attempting to connect to WebSocket server...');
        ws = new WebSocket(WS_SERVER_URL);
        
        ws.onopen = () => {
            console.log('Connected to WebSocket server');
            isConnected = true;
            reconnectAttempts = 0;
            sendToServer({ type: 'extension_connected', message: 'Browser controller extension ready' });
        };
        
        ws.onmessage = (event) => {
            try {
                const command = JSON.parse(event.data);
                handleServerCommand(command);
            } catch (error) {
                console.error('Error parsing server command:', error);
            }
        };
        
        ws.onclose = () => {
            console.log('WebSocket connection closed');
            isConnected = false;
            handleReconnect();
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            isConnected = false;
        };
        
    } catch (error) {
        console.error('Failed to connect to WebSocket server:', error);
        handleReconnect();
    }
}

// Handle reconnection attempts
function handleReconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${reconnectDelay}ms`);
        setTimeout(connectToServer, reconnectDelay);
    } else {
        console.error('Max reconnection attempts reached');
    }
}

// Send message to server
function sendToServer(message) {
    if (ws && isConnected) {
        ws.send(JSON.stringify(message));
    } else {
        console.warn('WebSocket not connected, cannot send message');
    }
}

// Create a new tab and inject content script
async function createNewTabAndInject(url = 'https://google.com') {
    try {
        console.log('Creating new tab for content script injection...');
        const newTab = await chrome.tabs.create({ url: url, active: true });
        console.log('New tab created with ID:', newTab.id);
        return new Promise((resolve) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === newTab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    chrome.scripting.executeScript({
                        target: { tabId: newTab.id },
                        files: ['content.js']
                    }).then(() => {
                        console.log('Content script injected into new tab');
                        resolve(newTab);
                    }).catch((error) => {
                        console.error('Failed to inject content script:', error);
                        resolve(newTab);
                    });
                }
            });
        });
    } catch (error) {
        console.error('Failed to create new tab:', error);
        throw error;
    }
}

// Handle commands from server
async function handleServerCommand(command) {
    try {
        console.log('Received command from server:', command);
        if (command.type === 'ping') {
            return;
        }
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!isInjectableTab(tab)) {
            console.log('No suitable active tab found, creating new tab...');
            tab = await createNewTabAndInject(command.url || 'https://google.com');
        }
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            console.log('Content script injected successfully');
        } catch (injectionError) {
            console.log('Content script injection note:', injectionError.message);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        const response = await chrome.tabs.sendMessage(tab.id, command);
        sendToServer({
            type: 'command_response',
            commandId: command.id,
            success: response.success,
            data: response,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error handling server command:', error);
        sendToServer({
            type: 'command_response',
            commandId: command.id,
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'navigate') {
        handleNavigation(request.url).then(sendResponse);
        return true; // Keep message channel open for async response
    }
});

// Handle navigation commands
async function handleNavigation(url) {
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!isInjectableTab(tab)) {
            console.log('No suitable active tab found for navigation, creating new tab...');
            tab = await createNewTabAndInject(url);
            return { success: true, message: `Created new tab and navigated to ${url}` };
        }
        await chrome.tabs.update(tab.id, { url: url });
        return new Promise((resolve) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve({ success: true, message: `Navigated to ${url}` });
                }
            });
        });
    } catch (error) {
        console.error('Navigation error:', error);
        return { success: false, error: error.message };
    }
}

// Extension installation/update handler
chrome.runtime.onInstalled.addListener(() => {
    console.log('Browser Controller extension installed/updated');
    // Attempt to connect to server after a short delay
    setTimeout(connectToServer, 1000);
});

// Extension startup handler
chrome.runtime.onStartup.addListener(() => {
    console.log('Browser Controller extension started');
    setTimeout(connectToServer, 1000);
});

// Keep connection alive
setInterval(() => {
    if (isConnected) {
        sendToServer({ type: 'ping', timestamp: Date.now() });
    }
}, 30000); // Send ping every 30 seconds

function isInjectableTab(tab) {
    return tab && tab.url && !tab.url.startsWith('chrome://');
} 