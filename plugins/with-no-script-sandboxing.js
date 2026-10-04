const { withXcodeProject } = require('expo/config-plugins');

/**
 * Turns off Xcode's user-script sandbox for the app project.
 *
 * With `ENABLE_USER_SCRIPT_SANDBOXING = YES`, CocoaPods' "[CP] Copy Pods
 * Resources" build phase is denied write access to `ios/Pods/`, and the build
 * dies at the last step with "Sandbox: bash deny(1) file-write-create
 * .../Pods/resources-to-copy-<target>.txt". The Pods project already sets this
 * to NO; only the app project needs to agree.
 *
 * This lives in a config plugin because `ios/` is generated (and git-ignored),
 * so editing project.pbxproj directly is undone by the next prebuild.
 */
module.exports = function withNoScriptSandboxing(config) {
  return withXcodeProject(config, (config) => {
    config.modResults.updateBuildProperty('ENABLE_USER_SCRIPT_SANDBOXING', 'NO');
    return config;
  });
};
