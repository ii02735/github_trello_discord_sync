#!/bin/sh

if [ -e user-mapping.json ]
then
   echo "File user-mapping.json already exists"
else
   echo "[]" > user-mapping.json
fi