# Create a Gulp Project

npm init
-
Creates a package.json file which stores info about the project,
like the dependencies used in the project (Gulp, for example)


# Install Gulp into project

npm install gulp --save-dev
-
Installs Gulp into the project directory. 
--save-dev adds it to the dependencies in package.json


# Generic webapp structure

  |- app/
      |- css/
      |- fonts/
      |- images/ 
      |- index.html
      |- js/ 
      |- scss/
  |- dist/
  |- gulpfile.js
  |- node_modules/
  |- package.json

In this structure, we'll use the app folder for development purposes, while the dist 
(as in "distribution") folder is used to contain optimized files for the production site.


# Globbing

Globs are matching patterns for files that allow you to add more than one file into gulp.src.
Esentially, it's like a regular expression, specifically for file paths.

Most workflows with Gulp tend to only require 4 different globbing patterns:

1. *.scss
	Any files endings with .scss in the root folder.

2. **/*.scss
	Any files ending with .scss in the root folder and any child directories.

3. !not-me.scss
	! indicates that Gulp should exclude the pattern from its matches.
	In this case, not-me.scss would be excluded from the match.

4. *.+(scss|sass)
	Match multiple different patterns.
	In this case, Gulp will match any files ending with .scss|.sass in root folder.


# Running many gulp tasks with the RunSequence plugin

To run tasks one after the other, use this syntax:
runSequence('task-one', 'task-two', 'task-three', callback);

To run tasks simultaneously, use this syntax:
runsequence('task-one', ['tasks', 'two', 'run', 'in', 'parallel'], 'task-three');