# Meggie's 566 Final Project

### Design Doc

#### Introduction
- Lots of games use tilemaps to create their environments. One of the most notable series that heavily use this technique is Pokemon, particularly their older GBA and DS games such as Pokemon Red, Pokemon Pearl, and even the Pokemon Mystery Dungeon series. This art style is very modular and can be reconfigured into an infinite variety of town and wilderness layouts for players to experience.

#### Goal
- I want to create a procedural pokemon town/environment/dungeon generator where given some user input parameters (maybe type of terrain/biome, number of buildings, and other preferences) a user can generate a unique pokemon map that one could imagine exploring in a 2d pokemon game.

#### Inspiration/reference:
- ![image](https://user-images.githubusercontent.com/43301118/141887329-812409d5-3d9c-4ca0-84eb-fd5e0ef216a5.png)

#### Specification (Main features):
- User input parameters (help determine the final result of the generator)
- Wave function collapse based procedural generator
- Lots of pokemon tilemap assets
- Maybe an interactive mode where users can place assets of their choosing and the wave function collapse finishes based on their placed assets?

#### Techniques:
- I plan to use a form of wave function collapse to generate a map given assets and their constraints (and perhaps some user placed or preferred contraints)
- https://robertheaton.com/2018/12/17/wavefunction-collapse-algorithm/
- https://www.procjam.com/tutorials/wfc/
- https://www.youtube.com/watch?v=2SuvO4Gi7uY

#### Design:
- ![image](https://user-images.githubusercontent.com/43301118/141889983-b96937c9-d68c-4e77-a711-ed9ee3b73804.png)
- ![image](https://user-images.githubusercontent.com/43301118/141890002-cdf08cea-931c-4b41-8e47-b5cd41b844a1.png)

#### Timeline:
- By Milestone 2 (11/22): Figure out how to reuse past homework bases into 2d format for this generator, research generator algorithm and set up necessary classes/variables for the base logic, find/download/organize assets in a way that is easy for code to access
- By Milestone 3 (11/29): Keep tweaking the algorithm by making it generate more complex/beautiful results, allow user input parameters to change the outcome, add more assets in for more variety if desired/able to
- By Final Submission (12/6): Keep polishing, add NPCs and other details (items, pokemon) if you have time
