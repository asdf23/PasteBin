const { ipcRenderer } = require("electron");
var pasteButton = document.querySelector("#btnClose");
pasteButton.addEventListener("click", function() {
	ipcRenderer.send("invokeActionPasteClose", {});
});
/*
var pastes = ipcRenderer.sendSync("get-pastes");
console.log(pastes);
var li = document.querySelector("li.template").cloneNode(true);
li.classList.remove("template");
document.querySelector("ul").appendChild(li);
*/



ipcRenderer.invoke("get-pastes").then((value) => {
	console.log(value);
	value.pastes.paste.forEach(p=> {
		var li = document.querySelector("li.template").cloneNode(true);
		li.classList.remove("template")
		document.querySelector("ul").appendChild(li);
		if(typeof(p.title) == "string") {
			li.querySelector(".form-group-title").innerHTML = p.title;
		} else {
			var d = new Date(parseInt(p.paste_date._text, 10)*1000);
			var dString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
			li.querySelector(".form-group-title").innerHTML = dString;
			li.querySelector("span.url-icon").dataset.url = p.paste_url._text;
			li.querySelector("span.copy-icon").dataset.pasteKey = p.paste_key._text;
			li.querySelector("span.delete-icon").dataset.pasteKey = p.paste_key._text;
			li.querySelector("span.url-icon").addEventListener("click", copyURLToClipboard)
			li.querySelector("span.copy-icon").addEventListener("click", copyPasteToClipboard)
			li.querySelector("span.delete-icon").addEventListener("click", deletePasteFromClipboard)
		}
	});
}).catch((error) => {
    console.error("Error fetching pastes:", error);
});
function copyURLToClipboard() {
	navigator.clipboard.writeText(this.dataset.url).then(()=> {
		this.style.opacity = 0.5;
		setTimeout((icon) => {
			icon.style.opacity = 1;
		}, 1000, this);
		console.log("Success")
	}).catch((ex)=> {
		console.error(ex)
	});
}
function copyPasteToClipboard() {
	ipcRenderer.invoke("get-paste", this.dataset.pasteKey).then((value)=> {
		navigator.clipboard.writeText(value).then(()=> {
			this.style.opacity = 0.5;
			setTimeout((icon) => {
				icon.style.opacity = 1;
			}, 1000, this);
			console.log("Success")
		}).catch((ex)=> {
			console.error(ex)
		});
	})
}
function deletePasteFromClipboard() {
	ipcRenderer.invoke("delete-paste", this.dataset.pasteKey).then((value)=> {
		navigator.clipboard.writeText(value).then(()=> {
			this.style.opacity = 0.5;
			setTimeout((icon) => {
				icon.style.opacity = 1;
				icon.closest("li").parentNode.removeChild(icon.closest("li"));
			}, 1000, this);
			console.log("Success");
		}).catch((ex)=> {
			console.error(ex)
		});
	});
}