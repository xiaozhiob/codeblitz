import { Injector } from '@opensumi/di';
import { IAINativeCapabilities } from '@opensumi/ide-core-common';
import { AppConfig, RuntimeConfig } from '../../common';

const codeblitzDefaultCapabilities: IAINativeCapabilities = {
  supportsTerminalCommandSuggest: false,
  supportsTerminalDetection: false,
};

export const injectAINativePreferences = (injector: Injector): void => {
  const runtimeConfig: RuntimeConfig = injector.get(RuntimeConfig);
  const appConfig: AppConfig = injector.get(AppConfig);

  if (runtimeConfig.aiNative && runtimeConfig.aiNative.enable) {
    const aiNativeCaps = runtimeConfig.aiNative.capabilities || {};

    appConfig.AINativeConfig = {
      capabilities: {
        ...appConfig.AINativeConfig?.capabilities,
        ...aiNativeCaps,
        ...codeblitzDefaultCapabilities,
      },
    };
  }
};
