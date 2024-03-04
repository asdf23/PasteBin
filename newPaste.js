const { ipcRenderer } = require('electron');
var pasteButton = document.querySelector("#btnSend");
pasteButton.addEventListener("click", function() {
	ipcRenderer.send("invokeActionNewPasteSend", {
			 title: document.querySelector("#title").value
			,expire: document.querySelector("#expire").value
			,highlight: document.querySelector("#highlight").value
			,pasteContent: document.querySelector("#pasteContent").value
		});
});
//document.querySelector("#txtToken").value = ipcRenderer.sendSync('get-token');