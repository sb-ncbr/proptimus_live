#!/bin/bash
set -e

# Change to the FFFold/app directory
cd FFFold/app
export FLASK_APP=routes.py
flask run