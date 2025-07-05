#!/bin/bash
# Script to create and activate Python 3.11 virtual environment and install dependencies

# Check if python3.11 is installed
if ! command -v python3.11 &> /dev/null
then
    echo "python3.11 could not be found, please install it first."
    exit 1
fi

# Create virtual environment
python3.11 -m venv py311_venv

# Activate virtual environment
source py311_venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r backend/requirements-py311.txt

echo "Python 3.11 virtual environment setup complete. To activate, run:"
echo "source py311_venv/bin/activate"
