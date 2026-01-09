#!/bin/bash

# Script to sync session-localization submodule commit from session-desktop to session-playwright
# Usage: ./sync-localization-submodule.sh [path-to-session-desktop] [path-to-session-playwright]

set -e # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Get directory paths from arguments or try to read from .env
DESKTOP_DIR="${1}"
PLAYWRIGHT_DIR="${2}"

# If playwright dir not provided, use current directory
if [ -z "$PLAYWRIGHT_DIR" ]; then
  PLAYWRIGHT_DIR="$(pwd)"
  print_info "Using current directory as session-playwright: $PLAYWRIGHT_DIR"
fi

# If desktop dir not provided, try to read from .env file in playwright repo
if [ -z "$DESKTOP_DIR" ]; then
  if [ -f "$PLAYWRIGHT_DIR/.env" ]; then
    print_info "Reading session-desktop path from .env file..."
    # Look for SESSION_DESKTOP_ROOT variable in .env
    DESKTOP_DIR=$(grep "^SESSION_DESKTOP_ROOT=" "$PLAYWRIGHT_DIR/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ -z "$DESKTOP_DIR" ]; then
      print_error "Could not find SESSION_DESKTOP_ROOT in .env file"
      echo "Usage: $0 <path-to-session-desktop> [path-to-session-playwright]"
      exit 1
    fi
    # Resolve relative path if needed
    if [[ "$DESKTOP_DIR" == ../* ]] || [[ "$DESKTOP_DIR" == ./* ]]; then
      DESKTOP_DIR="$PLAYWRIGHT_DIR/$DESKTOP_DIR"
    fi
    print_info "Found session-desktop path: $DESKTOP_DIR"
  else
    print_error "No .env file found and no desktop directory provided"
    echo "Usage: $0 <path-to-session-desktop> [path-to-session-playwright]"
    exit 1
  fi
fi

# Verify directories exist
if [ ! -d "$DESKTOP_DIR" ]; then
  print_error "session-desktop directory not found: $DESKTOP_DIR"
  exit 1
fi

if [ ! -d "$PLAYWRIGHT_DIR" ]; then
  print_error "session-playwright directory not found: $PLAYWRIGHT_DIR"
  exit 1
fi

# Function to get submodule path from .gitmodules
get_submodule_path() {
  local repo_dir="$1"
  local gitmodules="$repo_dir/.gitmodules"

  if [ ! -f "$gitmodules" ]; then
    print_error ".gitmodules file not found in: $repo_dir"
    return 1
  fi

  # Look for submodule with "localization" in the name
  local submodule_path=$(grep -A 2 "localization" "$gitmodules" | grep "path" | head -1 | cut -d '=' -f2- | xargs)

  if [ -z "$submodule_path" ]; then
    print_error "Could not find localization submodule path in .gitmodules"
    return 1
  fi

  echo "$submodule_path"
}

# Get submodule paths from .gitmodules files
print_info "Reading submodule paths from .gitmodules files..."

DESKTOP_SUBMODULE_PATH=$(get_submodule_path "$DESKTOP_DIR")
if [ $? -ne 0 ]; then
  exit 1
fi
print_info "session-desktop submodule path: $DESKTOP_SUBMODULE_PATH"

PLAYWRIGHT_SUBMODULE_PATH=$(get_submodule_path "$PLAYWRIGHT_DIR")
if [ $? -ne 0 ]; then
  exit 1
fi
print_info "session-playwright submodule path: $PLAYWRIGHT_SUBMODULE_PATH"

# Verify both repos have the localization submodule
DESKTOP_SUBMODULE="$DESKTOP_DIR/$DESKTOP_SUBMODULE_PATH"
PLAYWRIGHT_SUBMODULE="$PLAYWRIGHT_DIR/$PLAYWRIGHT_SUBMODULE_PATH"

if [ ! -d "$DESKTOP_SUBMODULE" ]; then
  print_error "Localization submodule not found in session-desktop: $DESKTOP_SUBMODULE"
  exit 1
fi

if [ ! -d "$PLAYWRIGHT_SUBMODULE" ]; then
  print_error "Localization submodule not found in session-playwright: $PLAYWRIGHT_SUBMODULE"
  exit 1
fi

print_info "Getting commit hash from session-desktop submodule..."
cd "$DESKTOP_SUBMODULE"
DESKTOP_COMMIT=$(git rev-parse HEAD)
print_info "session-desktop is using commit: $DESKTOP_COMMIT"

print_info "Checking current commit in session-playwright submodule..."
cd "$PLAYWRIGHT_SUBMODULE"
PLAYWRIGHT_COMMIT=$(git rev-parse HEAD)
print_info "session-playwright is using commit: $PLAYWRIGHT_COMMIT"

if [ "$DESKTOP_COMMIT" == "$PLAYWRIGHT_COMMIT" ]; then
  print_info "Submodules are already synchronized!"
  exit 0
fi

print_warning "Commits differ. Updating session-playwright submodule..."

# Update the submodule
cd "$PLAYWRIGHT_SUBMODULE"
git fetch
git checkout "$DESKTOP_COMMIT"

# Go to playwright repo root and stage the submodule change
cd "$PLAYWRIGHT_DIR"
git add "$PLAYWRIGHT_SUBMODULE_PATH"

print_info "Submodule updated successfully!"
print_info "New commit: $DESKTOP_COMMIT"
print_warning "Don't forget to commit the change in session-playwright:"
echo "  cd $PLAYWRIGHT_DIR"
echo "  git commit -m 'Update localization submodule to match session-desktop'"
