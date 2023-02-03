## Lua Element IDs
 - All locals and globals are to be assigned a unique path to their respective locations.
 - Path Components:
    - File 
        - !uri_path
    - Pseudo Class 
        - $class_name
    - Table
        - ^table_name
    - Function
        - #name
        - #index (Anonymous)
    - Assignments
        - *name (local)
        - %name (global)
    - Require / Imports
        - @uri_path
        - *@uri_path (requirement assignment)
        
    - Condition Blocks (top->bottom of scope with # ID)
    - Loop Blocks (top->bottom of scope with # ID)

<br>

## Examples

### File: client/examples/hello_world.lua
```lua
function hello()
    local message = 'Hello, World!';
    print(message);
end
```

The variable message's path ID:
  - ``!/client/examples/hello_world#hello*message``

The idea for using these IDs is to target them whenever analysing Lua code. We can use this to tie back calculated assignment types and grow an understanding of what the variable is and what it servers. When translating code into TypeScript, any information gathered for these IDs will aid in the quality of the result.


Every identifying element of Lua **MUST** be ID'd.