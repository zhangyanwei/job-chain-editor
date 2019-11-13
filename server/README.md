# jobtube-service

The configuration tool for configuring the configurations, the configurations can be used by the task executor in Jenkins.

## How to run it?

1. Install Flask
    ```shell
    pip install Flask
    ```
    For more information: http://flask.pocoo.org/docs/1.0/installation/#install-flask
    
1. Run The Application  
    For Linux and Mac:
    ```shell
    export FLASK_APP=flaskr
    export FLASK_ENV=development
    flask run
    ```
    For Windows cmd, use set instead of export:
    ```shell
    set FLASK_APP=flaskr
    set FLASK_ENV=development
    flask run
    ```