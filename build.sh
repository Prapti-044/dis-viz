#!/bin/sh

cd dis-viz-backend
mkdir build
cd build
cmake ..
make -j8

cd ../../dis-viz-frontend
npm install
REACT_APP_BACKEND_PORT=8080 BUILD_PATH=../dis-viz-backend/build/templates npm run build

echo "Build complete!"
echo "Binary is in dis-viz-backend/build/"