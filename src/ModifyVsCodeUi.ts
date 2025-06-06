import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function modifyVsCodeUI(context: vscode.ExtensionContext) {
	const mainCommand = vscode.commands.registerCommand('cec-ide.cec-ide', () => {
		if (!checkTheEnvironment()) { return; }
		injectionCSS(context);
	});
	const restoreCommand = vscode.commands.registerCommand('cec-ide.cec-ide-restore', () => {
		if (!checkTheEnvironment()) { return; }
		restoreCSS();
	});
	context.subscriptions.push(mainCommand, restoreCommand);
}

async function injectionCSS(context: vscode.ExtensionContext) {
	const vscodePath = vscode.env.appRoot;
	const possibleCssNames = [
		'workbench.desktop.main.css',
		'workbench.main.css'
	];
	let cssName = possibleCssNames.find(name =>
		fs.existsSync(path.join(vscodePath, 'out', 'vs', 'workbench', name))
	);
	if (!cssName) {
		vscode.window.showErrorMessage('无法定位 VS Code workbench CSS 文件，请联系开发者或升级插件。');
		return;
	}
	const cssPath = path.join(vscodePath, 'out', 'vs', 'workbench', cssName);
	const backupCssName = 'workbench.desktop.main.backups.css';
	const backupCssPath = path.join(vscodePath, 'out', 'vs', 'workbench', backupCssName);

	const extensionPath = context.extensionPath;

	fs.readFile(cssPath, 'utf8', async (err, data) => {
		if (err) {
			console.error(err);
			vscode.window.showErrorMessage('很遗憾，国产化失败！');
			return;
		}
		const logoImg = await readImageAsBase64(path.join(extensionPath, 'resource', 'images', 'CEC-IDE.ico'));
		const backImg = await readImageAsBase64(path.join(extensionPath, 'resource', 'images', 'back-img.png'));
		const cecImg = await readImageAsBase64(path.join(extensionPath, 'resource', 'images', 'cec-img.webp'));
		const newCssCode = `
.monaco-workbench.monaco-workbench .part.titlebar .titlebar-container .window-appicon {
	background-image: url(${logoImg})!important;
	min-width: 90px!important;
	display: flex!important;
	background-repeat: no-repeat!important;
	background-position: 25%!important;
	background-size: 18px!important;
	transform: scale(1.4)!important;
	flex-direction: row!important;
	flex-wrap: nowrap!important;
	align-items: center!important;
	justify-content: flex-end!important;
	font-weight: bolder!important;
}
.monaco-workbench.monaco-workbench .part.titlebar .titlebar-container .window-appicon::after{
	content: "CEC-IDE";
	display: block;
	width: fit-content;
	margin: 0;
	padding: 0;
	transform: scale(0.8);
}
.monaco-workbench .part.titlebar>.titlebar-container .menubar{
	margin-left: 15px!important;
}
.file-icons-enabled .show-file-icons .vscode_getting_started_page-name-file-icon.file-icon:before, .file-icons-enabled .show-file-icons .webview-vs_code_release_notes-name-file-icon.file-icon:before{
	background-image: url(${logoImg})!important;
}
.monaco-workbench.vs-dark .part.editor>.content .editor-group-container .editor-group-watermark>.letterpress{
	background-image: url(${backImg})!important;
}
.gettingStarted .gettingStartedCategoriesContainer .header{
	background-image: url(${cecImg})!important;
	background-size: contain!important;
  background-repeat: no-repeat!important;
	width: 100%!important;
  height: 300px!important;
}
.gettingStarted .gettingStartedCategoriesContainer .header>*{
	display: none!important;
}
.gettingStarted .gettingStartedCategoriesContainer{
	transform: translateY(150px)!important;
	-webkit-transform: translateY(150px)!important;
	-moz-transform: translateY(150px)!important;
	-ms-transform: translateY(150px)!important;
	-o-transform: translateY(150px)!important;
}
`;
		const updatedCssContent = data + newCssCode;

		const writeCSS = () => {
			fs.writeFile(cssPath, updatedCssContent, 'utf8', err => {
				if (err) {
					console.error(err);
					vscode.window.showErrorMessage('很遗憾，国产化失败！');
					return;
				}
				vscode.window.showInformationMessage('已完成国产化，请重启 CEC-IDE 查看！');
			});
		};

		if (fs.existsSync(backupCssPath)) {
			writeCSS();
		} else {
			fs.writeFile(backupCssPath, data, 'utf8', err => {
				if (err) {
					console.error(err);
					vscode.window.showErrorMessage('很遗憾，国产化失败！');
					return;
				}
				writeCSS();
			});
		}

	});
}

function restoreCSS() {
	const vscodePath = vscode.env.appRoot;
	const possibleCssNames = [
		'workbench.desktop.main.css',
		'workbench.main.css'
	];
	let cssName = possibleCssNames.find(name =>
		fs.existsSync(path.join(vscodePath, 'out', 'vs', 'workbench', name))
	);
	if (!cssName) {
		vscode.window.showErrorMessage('无法定位 VS Code workbench CSS 文件，请联系开发者或升级插件。');
		return;
	}
	const cssPath = path.join(vscodePath, 'out', 'vs', 'workbench', cssName);
	const backupCssPath = path.join(vscodePath, 'out', 'vs', 'workbench', 'workbench.desktop.main.backups.css');

	// 检查是否存在备份文件
	if (fs.existsSync(backupCssPath)) {
		// 读取备份文件的内容
		const backupCssContent = fs.readFileSync(backupCssPath, 'utf8');

		// 将备份文件的内容覆盖到原始 CSS 文件
		fs.writeFileSync(cssPath, backupCssContent, 'utf8');

		// 删除备份文件
		fs.unlinkSync(backupCssPath);
		vscode.window.showInformationMessage('已恢复，请重启vscode查看！');
	}
}

async function readImageAsBase64(imagePath: string): Promise<string> {
	try {
		const data = await fs.promises.readFile(imagePath);
		const base64Image = "data:image/png;base64," + data.toString('base64');
		return base64Image;
	} catch (err) {
		console.error('Error reading image:', err);
		vscode.window.showErrorMessage('很遗憾，国产化失败！');
		throw err;
	}
}


function checkTheEnvironment(): boolean {
	if (vscode.env.remoteName) {
		vscode.window.showErrorMessage('该功能仅能在本地端能使用，请将插件安装在本地而非远端。');
		return false;
	} else {
		return true;
	}
}