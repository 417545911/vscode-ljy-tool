// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as child_process from 'child_process';

// 一旦你的插件激活，vscode 会立即调用下述方法
export function activate(context: vscode.ExtensionContext) {
  // 命令一 弹框提醒hello world
  const disposable = vscode.commands.registerCommand(
    "LjyTool.helloWorld",
    () => {
      // 给用户一个显示一个消息提醒
      vscode.window.showInformationMessage("Hello World from LjyTool");
    }
  );

  // 命令二  动态图测试
  const webviewTest = vscode.commands.registerCommand("LjyTool.webview", () => {
    // 创建并显示新的 webview
    const panel = vscode.window.createWebviewPanel(
      "webview", // 只供内部使用
      "打开webview",
      vscode.ViewColumn.One,
      {}
    );

    panel.webview.html = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Cat Coding</title>
		</head>
		<body>
			<img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
		</body>
		</html>
		`;
  });

  // 命令三 文件夹判断
  const commandOfGetFileState = vscode.commands.registerCommand(
    "LjyTool.getFileState",
    (uri: vscode.Uri) => {
      if (!uri) {
        vscode.window.showErrorMessage("请在文件上右键选择此命令！");
        return;
      }
      // 文件路径
      const filePath = uri.fsPath;
      fs.stat(filePath, (err, stats) => {
        if (err) {
          vscode.window.showErrorMessage(`获取文件时遇到错误了${err}!!!`);
          return;
        }

        if (stats.isDirectory()) {
          vscode.window.showWarningMessage(
            `检测的是文件夹，不是文件，请重新选择！！！`
          );
          return;
        }

        if (stats.isFile()) {
          const size = stats.size;
          const createTime = stats.birthtime.toLocaleString();
          const modifyTime = stats.mtime.toLocaleString();

          vscode.window.showInformationMessage(
            `
							文件大小为:${size}字节;
							文件创建时间为:${createTime};
							文件修改时间为:${modifyTime}
						`,
            { modal: true }
          );
        }
      });
    }
  );

  // 设置批处理脚本路径
  const setBatPathCommand = vscode.commands.registerCommand('LjyTool.setBatPath', async () => {
    const result = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'Batch Files': ['bat']
      }
    });

    if (result && result[0]) {
      const batPath = result[0].fsPath;
      // 保存路径到配置
      await vscode.workspace.getConfiguration('ljyTool').update('batFilePath', batPath, true);
      vscode.window.showInformationMessage(`批处理脚本路径已设置: ${batPath}`);
    }
  });

  // 执行批处理脚本
  const executeBatCommand = vscode.commands.registerCommand('LjyTool.executeBat', async () => {
    const config = vscode.workspace.getConfiguration('ljyTool');
    const batPath = config.get<string>('batFilePath');

    if (!batPath) {
      const choice = await vscode.window.showErrorMessage(
        '未设置批处理脚本路径，是否现在设置？',
        '是', '否'
      );
      if (choice === '是') {
        vscode.commands.executeCommand('LjyTool.setBatPath');
      }
      return;
    }

    // 创建输出通道
    const outputChannel = vscode.window.createOutputChannel('Bat Script Output');
    outputChannel.show();

    try {
      const process = child_process.spawn('cmd.exe', ['/c', batPath], {
        windowsHide: true
      });

      process.stdout.on('data', (data) => {
        outputChannel.appendLine(data.toString());
      });

      process.stderr.on('data', (data) => {
        outputChannel.appendLine(`错误: ${data}`);
      });

      process.on('close', (code) => {
        outputChannel.appendLine(`脚本执行完成，退出码: ${code}`);
      });

    } catch (error) {
      vscode.window.showErrorMessage(`执行脚本时出错: ${error}`);
    }
  });

  // 注册
  context.subscriptions.push(disposable);
  context.subscriptions.push(webviewTest);
  context.subscriptions.push(commandOfGetFileState);
  context.subscriptions.push(setBatPathCommand);
  context.subscriptions.push(executeBatCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
