# Overview

A simple snake game made in Typescript, JavaScript, HTML, and CSS, with PHP code configurable to connect to a MySQL database to track high scores.

If you would like to play locally without high scores, clone this repository and open the `index.html` file in the browser. It should be playable with errors in the console right away.

If you would like to track high scores you will first need to create the MySQL database. Next, you can edit the DB credentials in `example.config.php` and remove the `example.` from the filename to connect. Finally, you can run the migrations in the terminal with `php [projectDirectory]/migrations/create_scores_table.php` to create the table.

There is a configured version available to play at [https://tsnake.johnnycassidy.dev](https://tsnake.johnnycassidy.dev) if you would like to test it out. Try to get the high score!!