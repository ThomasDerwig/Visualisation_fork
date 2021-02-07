from flask import Flask
from flask import render_template
import pandas as pd
import json
import numpy as np
from bson import json_util
from bson.json_util import dumps

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/olympics/projects")
def olympics_projects():
    data_df = pd.read_csv("Data/CompleteData.csv")
    data_df["Medal"] = data_df["Medal"].replace(np.nan, 'No Medal', regex=True)
    return data_df.to_json(orient="records")

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)

