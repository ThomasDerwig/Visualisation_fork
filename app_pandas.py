from flask import Flask
from flask import render_template
import pandas as pd
import json
from bson import json_util
from bson.json_util import dumps

app = Flask(__name__)

MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'Olympics'
COLLECTION_NAME = 'CompleteData'
FIELDS = {'Name': True, 'Sex': True, 'Age': True, 'Height': True, 'Weight': True, 'Team': True, 'Games': True, 'Year': True, 'country': True, 'Sport': True, 'Medal': True}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/olympics/projects")
def olympics_projects():
    data_df = pd.read_csv("Data/CompleteData.csv")
    return data_df.to_json(orient="records")

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)

