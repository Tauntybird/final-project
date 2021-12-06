# Meggie's 566 Final Project

### Design Doc

#### Introduction
- Lots of games use tilemaps to create their environments. One of the most notable series that heavily use this technique is Pokemon, particularly their older GBA and DS games such as Pokemon Red, Pokemon Pearl, and the Pokemon Mystery Dungeon series. This art style is very modular and can be reconfigured into an infinite variety of town/wilderness/dungeon layouts for players to experience.

#### Goal
- I want to create a procedural pokemon dungeon generator where given some user input parameters (maybe type of terrain/biome, size of rooms, and other preferences) a user can generate a unique pokemon dungeon map that one could imagine exploring in a 2d pokemon game.

#### Inspiration/reference:
- ![image](http://www.psypokes.com/dungeon/dungeon/layout1.png)
- ![image](http://www.psypokes.com/dungeon/dungeon/layout2.png)

#### Specification (Main features):
- User input dungeon generation related parameters
- Lots of pokemon tilemap asset themes to choose from
- Binary Space Partitioning (BSP) based procedural generator

#### Techniques:
- I plan to use a form of BSP to generate a map given assets and their constraints
- http://pcgbook.com/wp-content/uploads/chapter03.pdf
- https://www.youtube.com/watch?v=TlLIOgWYVpI

#### Design:
- ![image](https://user-images.githubusercontent.com/43301118/141889983-b96937c9-d68c-4e77-a711-ed9ee3b73804.png)
- ![image](https://user-images.githubusercontent.com/43301118/141890002-cdf08cea-931c-4b41-8e47-b5cd41b844a1.png)

#### Timeline:
- By Milestone 2 (11/22): Figure out how to reuse past homework bases into 2d format for this generator, research generator algorithm and set up necessary classes/variables for the base logic, find/download/organize assets in a way that is easy for code to access
- By Milestone 3 (11/29): Keep tweaking the algorithm by making it generate more complex/beautiful results, allow user input parameters to change the outcome, add more assets in for more variety if desired/able to
- By Final Submission (12/6): Keep polishing, add NPCs and other details (items, pokemon) if you have time

#### Milestone 2:
- Added UV texturing, able to read tiles from a standardized tile sheet format. Only using two basic tiles for testing purposes this week, will prettify it next milestone
- Coded basic procedural generator first using BSP to generate rooms and connecting them with corridors afterwards

#### Milestone 3:
- Mapped proper tiles to the layout of the dungeon
- Added sliders for dungeon generation
- Added option to pick between different tile maps
- Added randomizer options
- "Fixed" bright sprite borders from showing (moved all the UV coordinates in by ~1 px)