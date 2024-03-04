const { app, Tray, Menu, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const xmlJS = require("xml-js");
//import fetch from 'node-fetch';

const urlPaste = "https://pastebin.com/api/api_post.php";
const urlLogin = "https://pastebin.com/api/api_login.php";
const urlClipboard = "https://pastebin.com/api/api_raw.php";

let tray = null;
let mainWindow = null;

const dataFilePath = path.join(app.getPath("userData"), "settings.json");
let data = {
	 token: null
	,userName: null
	,password: null
	,sessionKey: null
};

ipcMain.on("invokeActionPasteClose", (event, settingsData) => {
	getPastesWindow.hide();
});
ipcMain.on("invokeActionSettingsSaved", (event, settingsData) => {
	console.log("got token from settings:", data);
	data = JSON.parse(JSON.stringify(settingsData));
	console.log("stored token locally:", data);
	if(objectHasDataForAllEntries(data, ["token", "userName", "password"])) {
		if(data["sessionKey"] == null || data["sessionKey"] == "") {
			getSessionKey(doSave);
		} else {
			doSave();
		}
	}
	settingsWindow.hide();
});
ipcMain.on("invokeActionNewPasteSend", (event, pasteData) => {
	console.log("pre-createNewPaste", pasteData);
	createNewPaste(pasteData)
	console.log("post-createNewPaste");
	newPasteWindow.hide();
});
ipcMain.handle("get-paste", async(event,pasteKey) => {
	let result = await getPaste(pasteKey);
	console.log("got paste", result);
	return result;
});
ipcMain.handle("get-pastes", async(event) => {
	let results = await getPastes();
	console.log("got pastes", results);
	return results;
});
ipcMain.on("get-token", (event) => {
	console.log("sending data to settings", data.token);
	event.returnValue = data.token;
});
ipcMain.on("get-userData", (event) => {
	console.log("sending data to settings", data);
	event.returnValue = data;
});


app.on("ready", () => {
	tray = new Tray(path.join(__dirname, "icon.png"));
	console.log(dataFilePath);
	if (fs.existsSync(dataFilePath)) {
		const savedData = fs.readFileSync(dataFilePath);
		console.log(savedData.toString());
		try {
			data = JSON.parse(savedData.toString());
			//getSessionKey();
			getPastes();
		} catch(ex) {
			console.log(ex);
			data = {
				token: null
			}
		}

	}
	const contextMenu = Menu.buildFromTemplate([
		{ label: "New Paste", type: "normal", click: () => {
				createNewPasteWindow();
			}},
		{ label: "Get Paste", type: "normal", click: () => {
				createGetPasteWindow();
			}},
		{ label: "Settings", type: "normal", click: () => {
				createSettingsWindow();
			}},
		{ label: "Quit", type: "normal", role: "quit" }
	]);

	tray.setToolTip("My App");
	tray.setContextMenu(contextMenu);
});
app.on("before-quit", doSave);

function doSave() {
	console.log("saving", data);
	fs.writeFileSync(dataFilePath, JSON.stringify(data));
}
let newPasteWindow = null;
function createNewPasteWindow() {
	if(data.token == null) {
		createSettingsWindow();
	} else {
		let display = screen.getPrimaryDisplay();
		let width = display.bounds.width;
		let height = display.bounds.height;
		newPasteWindow = new BrowserWindow({
			height: 600,
			width: 600,
			x: width - 600,
			y: height - 600,
			show: false,
			resizable: false,
			movable: false,
			frame: false,
			darkTheme: true,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				enableRemoteModule: true,
			}
		});

		newPasteWindow.loadFile("newPaste.html");
		newPasteWindow.once("ready-to-show", newPasteWindow.show);
		newPasteWindow.on("closed", () => {
			newPasteWindow = null;
		});
	}
}
let getPastesWindow = null;
function createGetPasteWindow() {
	if(data.token == null) {
		createSettingsWindow();
	} else {
		let display = screen.getPrimaryDisplay();
		let width = display.bounds.width;
		let height = display.bounds.height;
		getPastesWindow = new BrowserWindow({
			height: 600,
			width: 600,
			x: width - 600,
			y: height - 600,
			show: false,
			resizable: false,
			movable: false,
			frame: false,
			darkTheme: true,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				enableRemoteModule: true,
			}
		});

		getPastesWindow.loadFile("getPastes.html");
		getPastesWindow.once("ready-to-show", getPastesWindow.show);
		getPastesWindow.on("closed", () => {
			getPastesWindow = null;
		});
	}
}
let settingsWindow = null;
function createSettingsWindow() {
	let display = screen.getPrimaryDisplay();
	let width = display.bounds.width;
	let height = display.bounds.height;
	settingsWindow = new BrowserWindow({
		height: 600,
		width: 600,
		x: width - 600,
		y: height - 600,
		show: false,
		resizable: false,
		movable: false,
		frame: false,
		darkTheme: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
		}
	});

	settingsWindow.loadFile("settings.html");
	settingsWindow.once("ready-to-show", settingsWindow.show);
	settingsWindow.on("closed", () => {
		settingsWindow = null;
	});
}
// ---- Fetches ---- //
function getSessionKey(cb) {
	const postData = new URLSearchParams();
	postData.append("api_dev_key", data.token);
	postData.append("api_user_name", data.userName);
	postData.append("api_user_password", data.password);
	fetch(urlLogin, {
		method: "POST",
		body: postData
	}).then(response => {
		return response.text();
	}).then(responseText => {
			data.sessionKey = responseText;
			console.log(responseText);
			if(cb != null) {
				cb();
			}
	}).catch(error => {
		console.error("Error:", error);
	});
}
function getPaste(pasteKey) {
    return new Promise((resolve, reject) => {
        const postData = new URLSearchParams();
        postData.append("api_dev_key", data.token);
        postData.append("api_user_key", data.sessionKey);
        postData.append("api_option", "show_paste");
        postData.append("api_paste_key", pasteKey);        
        fetch(urlClipboard, {
            method: "POST",
            body: postData
        }).then(response => {
            return response.text();
        }).then(responseText => {
            resolve(responseText);
        }).catch(error => {
            reject(error);
        });
    });
}
function getPastes() {
    return new Promise((resolve, reject) => {
        const postData = new URLSearchParams();
        postData.append("api_dev_key", data.token);
        postData.append("api_user_key", data.sessionKey);
        postData.append("api_option", "list");
        postData.append("api_results", "100");        
        fetch(urlPaste, {
            method: "POST",
            body: postData
        }).then(response => {
            return response.text();
        }).then(responseText => {
            let pastes = xmlJS.xml2json(`<?xml version="1.0" encoding="utf-8"?><pastes>${responseText}</pastes>`, {compact: true, spaces: 4})
            resolve(JSON.parse(pastes));
        }).catch(error => {
            reject(error);
        });
    });
}
function createNewPaste(pasteData) {
	const postData = new URLSearchParams();
	postData.append("api_dev_key", data.token);
	postData.append("api_paste_code", pasteData.pasteContent);
	postData.append("api_option", "paste");
	if(pasteData.highlight != null && pasteData.highlight != "") {
		postData.append("api_paste_format", pasteData.highlight);
	}
	postData.append("api_paste_expire_date", pasteData.expire);
	postData.append("api_paste_private", 2);
	if(pasteData.title != null && pasteData.title != "") {
		postData.append("api_paste_name", pasteData.title);
	}
	postData.append("api_user_key", data.sessionKey);
	console.log(postData);
	fetch(urlPaste, {
		method: "POST",
		body: postData
	}).then(response => {
		return response.text()
	}).then(responseText => {
			console.log(responseText);
	}).catch(error => {
		console.error("Error:", error);
	});
}
function objectHasDataForAllEntries(obj, entries) {
	Object.keys(obj).every(e=> {
		return (e in obj && obj[e] != null && obj[e].toString() != "");
	})
}