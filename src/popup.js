// popup script runs when the extension icon is clicked and the popup.html is loaded
'use strict';
import './popup.css';
import { storage, apiRequest, toConfig, Proxy } from './utils.js';

// ============================ Init ====================================

const sys_proxy = "System Proxy";
const confirmPopup = new (class ConfirmPopup {
	constructor() {
		this.popup = document.querySelector('#confirmPopup');
		this.popup.querySelector('#confirmNoBtn').addEventListener('click', this.onConfirmNoBtnClick.bind(this));
		this.popup.querySelector('#confirmYesBtn').addEventListener('click', this.onConfirmYesBtnClick.bind(this));
		this.popup.addEventListener('click', this.onConfirmNoBtnClick.bind(this));
		this.confimCallback = null;
	}

	show(message, callback) {
		this.popup.style.display = 'flex';
		this.popup.querySelector('span').textContent = message;
		this.confimCallback = callback;
	}

	async onConfirmYesBtnClick() {
		this.popup.style.display = 'none';
		this.confimCallback && await this.confimCallback();
	}

	onConfirmNoBtnClick() {
		this.popup.style.display = 'none';
	}
})()

document.addEventListener('DOMContentLoaded', async () => {
	let proxies = await storage.get(storage.proxies) || [];
	await onRenderProxyList(proxies);
	// register add proxy button
	document.querySelector('#add-button').addEventListener('click', onClickAddBtn)
	document.querySelector('#delete-button').addEventListener('click', onClickMinusBtn)
	document.querySelector('#name').addEventListener('change', ()=>onChangeField('#name'))
	document.querySelector('#scheme').addEventListener('change', ()=>onChangeField('#scheme'))
	document.querySelector('#host').addEventListener('change', ()=>onChangeField('#host'))
	document.querySelector('#port').addEventListener('change', ()=>onChangeField('#port'))
	document.querySelector('#bypassList').addEventListener('change', ()=>onChangeField('#bypassList'))
})

// ============================ events ====================================
async function onRenderProxyList(proxies) {
	proxies = [sys_proxy, ...proxies];
	// clear list
	const list = document.querySelector('#proxy-list');
	list.innerHTML = '';
	// add items
	proxies.forEach((proxy, index, array) => {
		const item = document.createElement('li');
		onRenderProxyItem(item, proxy);
		list.appendChild(item);
		item.addEventListener('click', async () => await onSelectProxyItem(item, proxy, index));
	});

	// click selected proxy item
	let selected_index = await storage.get(storage.selected_index) || 0;
	if (selected_index >= proxies.length) {
		selected_index = 0;
	}
	list.querySelectorAll('li')[selected_index].click();
}

function onRenderProxyItem(item, proxy) {
	if (proxy == sys_proxy) {
		item.textContent = sys_proxy;
	}
	else {
		item.textContent = proxy.name;
	}
}

async function onSelectProxyItem(item, proxy, index) {
	// select item effect
    const listItems = document.querySelectorAll('#proxy-list li');
	listItems.forEach(li => li.classList.remove('selected'));
	item.classList.add('selected');

	// save selected index
	await storage.set(storage.selected_index, index);

	// render fields
	const fieldContainer = document.querySelector('#field-container');
	if (proxy == sys_proxy) {
		fieldContainer.style.display = 'none';
	}
	else {
		fieldContainer.style.display = 'block';
		onRenderProxyFields(proxy);
	}

	document.querySelector('#success').style.display = 'none';
	document.querySelector('#error').style.display = 'none';
	// set proxy
	const status = await apiRequest("bg_setSelectedProxy");
	if (status.success) {
		document.querySelector('#success').style.display = 'block';
	}
	else {
		document.querySelector('#error').style.display = 'block';
	}
}

function onRenderProxyFields(proxy) {
	const nameField = document.querySelector('#name');
	const schemeField = document.querySelector('#scheme');
	const hostField = document.querySelector('#host');
	const portField = document.querySelector('#port');
	const bypassListField = document.querySelector('#bypassList');

	nameField.value = proxy.name;
	schemeField.value = proxy.scheme;
	hostField.value = proxy.host;
	portField.value = proxy.port;
	bypassListField.value = proxy.bypassList;
}

async function onChangeField(id) {
	const proxies = await storage.get(storage.proxies);
	const selected_index = await storage.get(storage.selected_index);
	const value = document.querySelector(id).value;
	// -1 because the first item on the menu list is system proxy, and it is not stored in storage
	proxies[selected_index-1][id.replace('#','')] = value; 
	await storage.set(storage.proxies, proxies)
	console.log('onChangeField', id, value);
	console.log('onChangeField', proxies);

	onRenderProxyList(proxies)
}

async function onClickAddBtn() {
	let proxies = await storage.get(storage.proxies) || [];
	proxies.push(new Proxy("---", "", "", "", ""))
	await storage.set(storage.proxies, proxies);
	await storage.set(storage.selected_index, proxies.length); // select the new proxy, 0 is system proxy
	await onRenderProxyList(proxies);
}

async function onClickMinusBtn() {
	const proxies = await storage.get(storage.proxies);
	const selected_index = await storage.get(storage.selected_index);
	const proxyName = proxies[selected_index-1].name

	confirmPopup.show(proxyName, async ()=> {

		// remove the selected proxy
		// -1 because the first item on the menu list is system proxy, and it is not stored in storage
		proxies.splice(selected_index-1, 1); 

		await storage.set(storage.proxies, proxies);
		await storage.set(storage.selected_index, 0); // select the new proxy, 0 is system proxy
		await onRenderProxyList(proxies);
	});
}