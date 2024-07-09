const vscode = require('vscode');

let lectureInAction = false;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const statusBar = {
		text: vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Left
		),
		lectureButton: vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Left
		),
		breakButton: vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Left
		),
	};

	statusBar.text.text = '$(feedback) Paskaita';
	statusBar.text.show();

	statusBar.lectureButton.text = `$(debug-start)`;
	statusBar.lectureButton.command = "lecture-tools.start";
	statusBar.lectureButton.tooltip = "Start";
	statusBar.lectureButton.show();

	statusBar.breakButton.text = `$(debug-start)`;
	statusBar.breakButton.command = "lecture-tools.break";
	statusBar.breakButton.tooltip = "Break";

	const endTime = context.globalState.get('lecture.ending', null);
	if (typeof endTime === 'number' && endTime > Date.now()) {
		lectureInAction = true;
		lectureInProgress(endTime, statusBar);
	}

	const disposableStart = vscode.commands.registerCommand('lecture-tools.start', function () {
		if (lectureInAction === true) {
			return;
		}

		const lectureDurationInMinutes = 67.5;
		const endTime = Date.now() + lectureDurationInMinutes * 60000;
		context.globalState.update('lecture.ending', endTime);

		lectureInAction = true;
		lectureInProgress(endTime, statusBar);
	});

	const disposableBreak = vscode.commands.registerCommand('lecture-tools.break', function () {
		const panel = vscode.window.createWebviewPanel(
			'lectureBreak',
			'Pertrauka',
			vscode.ViewColumn.Active,
			{
				enableScripts: true,
			}
		);
		statusBar.breakButton.hide();
		panel.webview.html = getWebviewContent(15);

		panel.onDidDispose(() => {
			statusBar.text.text = '$(feedback) Paskaita';
			statusBar.lectureButton.show();
		})
	});

	context.subscriptions.push(disposableStart);
	context.subscriptions.push(disposableBreak);
}

function deactivate() { }

function lectureInProgress(endTime, statusBarObject) {
	statusBarObject.lectureButton.hide();

	const clock = setInterval(() => {
		const diffInMiliseconds = endTime - Date.now();
		let diff = diffInMiliseconds;
		if (diff < 0) {
			diff = 0;
		}

		const mili = diff % 1000;
		diff = (diff - mili) / 1000;
		const sec = diff % 60;
		diff = (diff - sec) / 60;
		const min = diff % 60;
		const h = (diff - min) / 60;

		const printSec = (sec < 10 ? '0' : '') + sec;
		const printMin = (min < 10 ? '0' : '') + min;
		let printTime = '$(feedback) Paskaita: ';

		if (h > 0) {
			printTime += h + ':' + printMin + ':' + printSec;
		} else if (diffInMiliseconds > 0) {
			printTime += printMin + ':' + printSec;
		} else {
			printTime = '$(feedback) einam ilsėtis...';
		}
		statusBarObject.text.text = printTime;

		if (diffInMiliseconds <= 0) {
			lectureInAction = false;
			statusBarObject.breakButton.show();
			return clearInterval(clock);
		}
	}, 100);
}

function timer(minutes) {
	// eslint-disable-next-line no-undef
	const clockDOM = document.querySelector('.clock');
	const end = Date.now() + minutes * 60000;
	const clock = setInterval(() => {
		let diff = end - Date.now();
		if (diff < 0) {
			diff = 0;
		}
		const mili = diff % 1000;
		const sec = (diff - mili) / 1000 % 60;
		const min = (diff - mili - sec * 1000) / 60000;

		const printSec = (sec < 10 ? '0' : '') + sec;
		let printMili = mili;
		if (mili < 100) {
			printMili = '0' + printMili;
		}
		if (mili < 10) {
			printMili = '0' + printMili;
		}
		clockDOM.innerHTML = `${min}:${printSec}.<span>${printMili}</span>`;
		if (diff <= 0) {
			return clearInterval(clock);
		}
	}, 50);
}

function getWebviewContent(time) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
	<style>
		* {margin:0;}
		h1 {background-color:#ccc;padding:1rem 2rem;}
		h2 {padding:1rem 2rem;}
		.clock {font-size:15vmin;padding:1rem 2rem;}
		.clock > span {font-size:0.7em;color:#ccc;}
	</style>
</head>
<body>
	<h1>Pertraukos trukmė: ${time} min.</h1>
	<h2>Likęs laikas:</h2>
	<div class="clock">...</div>
    <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
	<script>(${timer.toString()})(${time});</script>
</body>
</html>`;
}

module.exports = {
	activate,
	deactivate
}
