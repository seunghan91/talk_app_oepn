#!/usr/bin/env node

/**
 * Expo SDK 53 + RN 0.79.4 Podfile 의존성 자동 수정 스크립트
 * RCT-Folly/Fabric 버전 충돌 해결
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const IOS_DIR = path.join(PROJECT_ROOT, 'ios');
const PODFILE_PATH = path.join(IOS_DIR, 'Podfile');
const PODFILE_LOCK_PATH = path.join(IOS_DIR, 'Podfile.lock');

console.log('🔧 Fixing Podfile dependencies for Expo SDK 53 + RN 0.79.4...');

// 1. Podfile.lock 제거 (캐시된 의존성 제거)
if (fs.existsSync(PODFILE_LOCK_PATH)) {
  console.log('📁 Removing cached Podfile.lock...');
  fs.unlinkSync(PODFILE_LOCK_PATH);
}

// 2. Pods 디렉토리 제거
const PODS_DIR = path.join(IOS_DIR, 'Pods');
if (fs.existsSync(PODS_DIR)) {
  console.log('📁 Removing Pods directory...');
  execSync(`rm -rf "${PODS_DIR}"`, { stdio: 'inherit' });
}

// 3. Derived Data 클리어 (Xcode 캐시)
console.log('🧹 Clearing Xcode derived data...');
try {
  execSync('rm -rf ~/Library/Developer/Xcode/DerivedData/*', { stdio: 'inherit' });
} catch (error) {
  console.warn('⚠️  Could not clear derived data:', error.message);
}

// 4. Podfile에 버전 고정 추가
console.log('📝 Adding version constraints to Podfile...');

const podfileAdditions = `
# 🎯 Expo SDK 53 + RN 0.79.4 + New Architecture 호환성 보장
def force_compatible_versions
  # RCT-Folly 버전 고정 (2023.01.30.00)
  pod 'RCT-Folly', '2023.01.30.00', :modular_headers => true
  pod 'RCT-Folly/Fabric', '2023.01.30.00'
  
  # Boost 버전 고정 (충돌 방지)
  pod 'boost', '1.83.0'
  
  # React-Core 관련 고정 (New Architecture 지원)
  pod 'React-Core', :path => '../node_modules/react-native/', :modular_headers => true
  pod 'ReactCommon', :path => '../node_modules/react-native/ReactCommon', :modular_headers => true
  
  # New Architecture Fabric 구성요소
  pod 'React-Fabric', :path => '../node_modules/react-native/ReactCommon', :modular_headers => true
  pod 'React-graphics', :path => '../node_modules/react-native/ReactCommon/react/renderer/graphics'
  pod 'React-jsi', :path => '../node_modules/react-native/ReactCommon/jsi', :modular_headers => true
  pod 'React-jsiexecutor', :path => '../node_modules/react-native/ReactCommon/jsiexecutor'
  
  # Hermes 엔진 (New Architecture 최적화)
  pod 'React-hermes', :path => '../node_modules/react-native/ReactCommon/hermes', :modular_headers => true
  pod 'React-perflogger', :path => '../node_modules/react-native/ReactCommon/reactperflogger'
  
  # TurboModules (New Architecture)
  pod 'React-NativeModulesApple', :path => '../node_modules/react-native/ReactCommon/react/nativemodule/core/platform/ios'
  pod 'ReactCodegen', :path => '../node_modules/react-native/ReactCommon/react/renderer/runtimescheduler', :modular_headers => true
end

# 호환 버전 강제 적용
force_compatible_versions
`;

let podfileContent = fs.readFileSync(PODFILE_PATH, 'utf8');

// 기존 버전 고정이 없다면 추가
if (!podfileContent.includes('force_compatible_versions')) {
  // target 'TALKK' do 다음에 추가
  podfileContent = podfileContent.replace(
    /target 'TALKK' do\s*\n/,
    `target 'TALKK' do\n${podfileAdditions}\n`
  );
  
  fs.writeFileSync(PODFILE_PATH, podfileContent);
  console.log('✅ Version constraints added to Podfile');
}

// 5. pod install 실행
console.log('📦 Running pod install...');
try {
  execSync('cd ios && pod install', { stdio: 'inherit', cwd: PROJECT_ROOT });
  console.log('✅ Pod install completed successfully');
} catch (error) {
  console.error('❌ Pod install failed:', error.message);
  process.exit(1);
}

// 6. 검증
console.log('🔍 Verifying installation...');
if (fs.existsSync(PODFILE_LOCK_PATH)) {
  const lockContent = fs.readFileSync(PODFILE_LOCK_PATH, 'utf8');
  
  // RCT-Folly 버전 확인
  const follyMatch = lockContent.match(/RCT-Folly.*?(\d+\.\d+\.\d+\.\d+)/);
  if (follyMatch) {
    console.log(`✅ RCT-Folly version: ${follyMatch[1]}`);
  }
  
  // React-Core 버전 확인
  const reactMatch = lockContent.match(/React-Core.*?(\d+\.\d+\.\d+)/);
  if (reactMatch) {
    console.log(`✅ React-Core version: ${reactMatch[1]}`);
  }
  
  console.log('🎉 Dependencies fixed successfully!');
} else {
  console.error('❌ Podfile.lock not generated');
  process.exit(1);
}

console.log(`
🚀 Next steps:
1. Run: eas build --platform ios --clear-cache
2. Or: npx expo run:ios
3. If issues persist, run this script again
`);