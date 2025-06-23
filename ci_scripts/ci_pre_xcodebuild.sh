#!/bin/sh

# Fail build if any command fails
set -e

# Echo commands
set -x

echo "--- Pre-Build: Installing CocoaPods dependencies ---"

# Navigate to the ios directory
cd "$(dirname "$CI_XCODE_PROJECT")/ios"

# Install CocoaPods using Bundler
# It is recommended to use a Gemfile for consistent ruby gem versions
bundle install
bundle exec pod install

# An alternative without Bundler:
# pod install

echo "--- Pre-Build: CocoaPods installation complete ---" 