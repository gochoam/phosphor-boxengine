#!/bin/bash
set -e
npm run clean
npm run build
npm test
npm run docs
npm run test:coverage
