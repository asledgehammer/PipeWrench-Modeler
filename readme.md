# PipeWrench Modeler

![](https://i.imgur.com/2xabg5L.png)

## Description
PipeWrench Modeler is both a TypeScript definitions generator for Lua files for Project Zomboid and a human assistance tool for improving what comes out of the generator. The generator converts Lua files into TypeScript definitions for the PipeWrench development environment.

## Models
Models are instructions provided by humans that are digested by the generator. These models provide information that helps define what the generator cannot identify and understand, such as parameter names, function returns, etc. Models are stored in a JSON format.

## Setup
- Copy your Project Zomboid `media/lua` folder to `./assets/media/lua`.
- Run `npm i`

## Commands

- Development
  - Run `grunt` for watching `.ts` and `.scss` files to compile.

- Application
  - Run `npx electron main.js` to start the Electron application.
  - Use `CTRL + O` to open model files. (`.json`)
  - Use `CTRL + S` to save model files.
  - Use `CTRL + G` to generate typings in `./dist`

## Notes
- The modeler is in BETA. The following is still in development:
  - The menu-bar at the top isn't defined.
  - Deleting models in the menu on the left.
  - Arrow-key support for the search menu.
  - Rough edges with CSS.

# Support

![](https://i.imgur.com/ZLnfTK4.png)

## Discord Server
https://discord.gg/u3vWvcPX8f

If you like what I do and helped your community a lot, feel free to buy me a coffee!
https://ko-fi.com/jabdoesthings
https://www.paypal.com/paypalme/JabJabJab
