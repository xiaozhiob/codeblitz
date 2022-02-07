import { IPluginModule, IPluginAPI } from '@alipay/alex/lib/editor';

export enum ExtensionCommand {
  toggleBlame = 'code.blame.toggleBlame',
  linkToCommit = 'code.blame.linktocommit',
  onActive = 'code.blame.extension.active',
  setPerference = 'code.blame.setPerference',
  setProjectData = 'code.blame.setProjectData',
  getBlameData = 'code.blame.getBlameData',
}

export default class IDEPlugin implements IPluginModule {
  commands: IPluginAPI['commands'];
  onActivate: () => void;
  linkToCommit: (commitId: string) => void;
  getBlame: (projectId: number, commitId: string, path: string) => Promise<any>;

  /**
   * 插件 ID，用于唯一标识插件
   */
  PLUGIN_ID = 'ACR_BLAME';

  constructor(
    onActive: () => void,
    linkToCommit: (commitId: string) => void,
    getBlame: (projectId: number, commitId: string, path: string) => Promise<any>
  ) {
    this.onActivate = onActive;
    this.linkToCommit = linkToCommit;
    this.getBlame = getBlame;
  }

  /**
   * 激活插件
   */
  activate = (ctx: IPluginAPI) => {
    const { commands, context } = ctx;
    this.commands = commands;
    context.subscriptions.push(
      commands.registerCommand(ExtensionCommand.onActive, () => {
        this.onActivate();
      }),
      commands.registerCommand(ExtensionCommand.linkToCommit, (params) => {
        const { commitId } = params;
        this.linkToCommit(commitId);
      }),
      commands.registerCommand(ExtensionCommand.getBlameData, async (sendData) => {
        const { projectId, prevSha, nextSha, filePath } = sendData;
        //  kaitian内uri 和 antcode内不同 多了一个 /
        const path = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        const response = await this.getBlame(projectId, nextSha, path).then((res) => {
          return res;
        });
        return response;
      })
    );
  };

  /**
   * 注销插件，可在此时机清理副作用
   */
  deactivate() {}

  /**
   * 修改配置项
   * @param name 配置项名称
   * @param value 值
   * @param global 是否全局生效
   */
  setPerference(name: string, value: string, global?: boolean) {
    this.commands.executeCommand(ExtensionCommand.setPerference, name, value, !!global);
  }
}
