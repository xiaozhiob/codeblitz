import { Autowired } from '@ali/common-di';
import { ClientAppContribution, Domain, Disposable } from '@ali/ide-core-browser';
import { IDecorationsService, IDecorationsProvider, IDecorationData } from '@ali/ide-decoration';
import { Uri, Emitter } from '@ali/ide-core-browser';
import { IThemeService } from '@ali/ide-theme';
import * as path from 'path';
import { CodeModelService } from './code-model.service';
import { Repository } from './repository';

export class GitDecorationProvider extends Disposable implements IDecorationsProvider {
  private static SubmoduleDecorationData: IDecorationData = {
    letter: 'S',
    color: 'gitDecoration.submoduleResourceForeground',
    tooltip: 'Submodules',
  };

  readonly label = 'code-service';

  private decorations = new Map<string, IDecorationData>();

  private _onDidChange: Emitter<Uri[]> = new Emitter();
  readonly onDidChange = this._onDidChange.event;

  constructor(private repo: Repository) {
    super();
    this.addDispose(repo.onDidAddSubmodules(this.onDidAddSubmodules, this));
  }

  private onDidAddSubmodules(submodulePath: string) {
    this.decorations.set(
      Uri.file(path.join(this.repo.root, submodulePath)).toString(),
      GitDecorationProvider.SubmoduleDecorationData
    );
    this._onDidChange.fire([...this.decorations.keys()].map((value) => Uri.parse(value)));
  }

  async provideDecorations(resource: Uri): Promise<IDecorationData | undefined> {
    return this.decorations.get(resource.toString());
  }
}

@Domain(ClientAppContribution)
export class DecorationProvider extends Disposable implements ClientAppContribution {
  @Autowired(IThemeService)
  themeService: IThemeService;

  @Autowired(IDecorationsService)
  decorationService: IDecorationsService;

  @Autowired(CodeModelService)
  codeModel: CodeModelService;

  constructor() {
    super();
    this.addDispose(this.codeModel.onDidOpenRepository(this.onDidOpenRepository, this));
    this.codeModel.repositories.forEach(this.onDidOpenRepository, this);
  }

  onDidOpenRepository(repo: Repository) {
    const provider = new GitDecorationProvider(repo);
    this.addDispose(this.decorationService.registerDecorationsProvider(provider));
  }

  onDidStart() {
    this.themeService.registerColor({
      id: 'gitDecoration.submoduleResourceForeground',
      description: 'colors.submodule',
      defaults: {
        light: '#1258a7',
        dark: '#8db9e2',
        highContrast: '#8db9e2',
      },
    });
  }
}
