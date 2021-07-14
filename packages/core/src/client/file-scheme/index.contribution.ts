import { Autowired } from '@ali/common-di';
import { Domain } from '@ali/ide-core-browser';
import {
  EditorComponentRegistry,
  BrowserEditorContribution,
  IEditorDocumentModelContentRegistry,
} from '@ali/ide-editor/lib/browser';
import { FILE_SCHEME } from '@ali/ide-file-scheme/lib/common';
import { IFileServiceClient } from '@ali/ide-file-service/lib/common';
import { ResourceService, IResource, IEditorOpenType } from '@ali/ide-editor';

@Domain(BrowserEditorContribution)
export class FileSchemeContribution implements BrowserEditorContribution {
  @Autowired(IFileServiceClient)
  private readonly fileServiceClient: IFileServiceClient;

  registerEditorComponent(editorComponentRegistry: EditorComponentRegistry) {
    editorComponentRegistry.registerEditorComponentResolver(
      (scheme: string) => {
        return scheme === FILE_SCHEME || this.fileServiceClient.handlesScheme(scheme) ? 0 : -1;
      },
      (resource: IResource<any>, results: IEditorOpenType[]) => {
        // 如果装了 image-preview 插件，把内置的图片组件去掉
        // TODO: 暴露 static-resource 配置
        if (results.length > 1 && results[0].componentId === 'image-preview') {
          results.shift();
        }
      }
    );
  }
}