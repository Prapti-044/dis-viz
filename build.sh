#!/bin/sh

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cd "$SCRIPT_DIR/dis-viz-backend"
mkdir -p build
cd build
cmake ..
make -j12

cd ../../dis-viz-frontend
pnpm install
REACT_APP_BACKEND_PORT=8080 BUILD_PATH=../dis-viz-backend/build/templates pnpm run build

echo "Build complete!"
echo "Binary is in dis-viz-backend/build/"
