const { ipcRenderer } = require('electron');
var saveButton = document.querySelector("#btnSave");
saveButton.addEventListener("click", function() {
	// ipc.once("actionReply", function(event, response){
	// 	processResponse(response);
	// })
	ipcRenderer.send("invokeActionSettingsSaved", {
		 token: document.querySelector("#txtToken").value
		,userName: document.querySelector("#txtUsername").value
		,password: document.querySelector("#txtPassword").value
		,sessionKey: document.querySelector("#txtSessionKey").value
	});
});
var getUserData = ipcRenderer.sendSync('get-userData');
document.querySelector("#txtToken").value = getUserData.token;
document.querySelector("#txtUsername").value = getUserData.userName;
document.querySelector("#txtPassword").value = getUserData.password;
document.querySelector("#txtSessionKey").value = getUserData.sessionKey;