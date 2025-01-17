#!/bin/bash

jq '
walk(
  if type == "object" and has("properties") and (.properties | has("value")) then 
    .properties.value = {
      "type": "object",
      "properties": {
        "$share": {
          "type": "string",
          "description": (.properties.value.description // "Encoded share value")
        }
      },
      "required": ["$share"]
    }
  else
    .
  end
)' $@
