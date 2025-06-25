#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 빌드 번호 일원화 관리 스크립트
 * app.config.js와 Xcode 프로젝트 파일의 빌드 번호를 동기화합니다.
 */

const APP_CONFIG_PATH = path.join(__dirname, '../app.config.js');
const PBXPROJ_PATH = path.join(__dirname, '../ios/TALKK.xcodeproj/project.pbxproj');

function getCurrentBuildNumber() {
  try {
    // app.config.js에서 현재 빌드 번호 읽기
    delete require.cache[require.resolve(APP_CONFIG_PATH)];
    const config = require(APP_CONFIG_PATH);
    const buildNumber = config.expo.ios.buildNumber;
    console.log(`📱 현재 app.config.js 빌드 번호: ${buildNumber}`);
    return buildNumber;
  } catch (error) {
    console.error('❌ app.config.js 읽기 실패:', error.message);
    process.exit(1);
  }
}

function updateXcodeBuildNumber(buildNumber) {
  try {
    let pbxprojContent = fs.readFileSync(PBXPROJ_PATH, 'utf8');
    
    // CURRENT_PROJECT_VERSION 모든 인스턴스 업데이트
    const updatedContent = pbxprojContent.replace(
      /CURRENT_PROJECT_VERSION = \d+;/g,
      `CURRENT_PROJECT_VERSION = ${buildNumber};`
    );
    
    fs.writeFileSync(PBXPROJ_PATH, updatedContent, 'utf8');
    console.log(`🔄 Xcode 프로젝트 빌드 번호가 ${buildNumber}로 업데이트되었습니다.`);
  } catch (error) {
    console.error('❌ Xcode 프로젝트 파일 업데이트 실패:', error.message);
    process.exit(1);
  }
}

function incrementBuildNumber() {
  try {
    const configContent = fs.readFileSync(APP_CONFIG_PATH, 'utf8');
    const currentBuildNumber = getCurrentBuildNumber();
    const newBuildNumber = (parseInt(currentBuildNumber) + 1).toString();
    
    // app.config.js 업데이트
    const updatedConfigContent = configContent.replace(
      /buildNumber:\s*"(\d+)"/,
      `buildNumber: "${newBuildNumber}"`
    );
    
    fs.writeFileSync(APP_CONFIG_PATH, updatedConfigContent, 'utf8');
    console.log(`📱 app.config.js 빌드 번호가 ${newBuildNumber}로 증가되었습니다.`);
    
    // Xcode 프로젝트 파일도 업데이트
    updateXcodeBuildNumber(newBuildNumber);
    
    return newBuildNumber;
  } catch (error) {
    console.error('❌ 빌드 번호 증가 실패:', error.message);
    process.exit(1);
  }
}

function syncBuildNumber() {
  const buildNumber = getCurrentBuildNumber();
  updateXcodeBuildNumber(buildNumber);
  console.log(`✅ 빌드 번호 ${buildNumber}로 동기화 완료!`);
}

// 명령행 인수 처리
const command = process.argv[2];

switch (command) {
  case 'increment':
    const newBuildNumber = incrementBuildNumber();
    console.log(`🚀 빌드 번호가 ${newBuildNumber}로 증가되고 동기화되었습니다!`);
    break;
  case 'sync':
    syncBuildNumber();
    break;
  default:
    console.log(`
사용법:
  node sync-build-number.js sync      # 현재 빌드 번호로 동기화
  node sync-build-number.js increment # 빌드 번호 증가 후 동기화
    `);
} 