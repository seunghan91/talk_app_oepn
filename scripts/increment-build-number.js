#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 현재 빌드 번호를 가져오는 함수
function getCurrentBuildNumber() {
  const appConfigPath = path.join(__dirname, '..', 'app.config.js');
  delete require.cache[appConfigPath];
  const appConfig = require(appConfigPath);
  return parseInt(appConfig.expo.ios.buildNumber) || 1;
}

// 빌드 번호를 업데이트하는 함수
function updateBuildNumber(buildNumber) {
  const projectRoot = path.join(__dirname, '..');
  
  // 1. app.config.js 업데이트
  const appConfigPath = path.join(projectRoot, 'app.config.js');
  let appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
  
  // iOS buildNumber 업데이트
  appConfigContent = appConfigContent.replace(
    /buildNumber:\s*["']?\d+["']?/,
    `buildNumber: "${buildNumber}"`
  );
  
  fs.writeFileSync(appConfigPath, appConfigContent);
  console.log(`✅ Updated app.config.js - iOS buildNumber: ${buildNumber}`);

  // 2. Android build.gradle 업데이트
  const gradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
  let gradleContent = fs.readFileSync(gradlePath, 'utf8');
  
  gradleContent = gradleContent.replace(
    /versionCode\s+\d+/,
    `versionCode ${buildNumber}`
  );
  
  fs.writeFileSync(gradlePath, gradleContent);
  console.log(`✅ Updated Android build.gradle - versionCode: ${buildNumber}`);

  // 3. iOS project.pbxproj 업데이트
  try {
    const pbxprojPath = path.join(projectRoot, 'ios', 'TALKK.xcodeproj', 'project.pbxproj');
    let pbxprojContent = fs.readFileSync(pbxprojPath, 'utf8');
    
    pbxprojContent = pbxprojContent.replace(
      /CURRENT_PROJECT_VERSION = \d+;/g,
      `CURRENT_PROJECT_VERSION = ${buildNumber};`
    );
    
    fs.writeFileSync(pbxprojPath, pbxprojContent);
    console.log(`✅ Updated iOS project.pbxproj - CURRENT_PROJECT_VERSION: ${buildNumber}`);
  } catch (error) {
    console.warn('⚠️  Could not update iOS project.pbxproj:', error.message);
  }
}

// 메인 실행 함수
function main() {
  const args = process.argv.slice(2);
  let buildNumber;

  if (args[0] === '--set' && args[1]) {
    // 특정 빌드 번호로 설정
    buildNumber = parseInt(args[1]);
    if (isNaN(buildNumber)) {
      console.error('❌ Invalid build number');
      process.exit(1);
    }
  } else if (args[0] === '--increment' || args.length === 0) {
    // 현재 빌드 번호에서 1 증가
    buildNumber = getCurrentBuildNumber() + 1;
  } else {
    console.log('Usage:');
    console.log('  node increment-build-number.js                 # Increment build number by 1');
    console.log('  node increment-build-number.js --increment     # Increment build number by 1');
    console.log('  node increment-build-number.js --set <number>  # Set specific build number');
    process.exit(0);
  }

  console.log(`\n🚀 Updating build number to: ${buildNumber}\n`);
  updateBuildNumber(buildNumber);
  console.log(`\n✨ Build number successfully updated to ${buildNumber}`);
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { getCurrentBuildNumber, updateBuildNumber };