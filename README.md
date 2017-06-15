# network-classification
PhD #04 - Network analysis, classification and prediction

![Evaluation Results](https://github.com/sebastian-meier/network-classification/blob/master/thumb.jpg?raw=true)

## Intro

Most of the processing is already happening in the data preprocessing: https://github.com/sebastian-meier/moves-to-spatialite
If the above script was set to output the test results, those can be evaluated and visualised in this repository.

### Usage

#### Export CSVs for Machine Learning

The following line will output a series of CSVs with trips.
In addition to a full set, for each file there is also a filtered version where trip-group occurs at least n-times (1-10).
The full dataset is also provided in segments (where 1 holds 1/10 of the data, 2 holds 2/10 of the data, n holds n/10 of the data), this can be used to compare predictions over time, as more training data is available.
```
node machine_export.js PATH\_TO/DBFILE OUTPUT\_PATH
```
Note: no .db on the DBFILE

#####  Applying Machine Learning

In my PhD I have been using three tools to test various machine learning techniques (sorted by complexity, performance and functionality):

1. TensorFlow (https://www.tensorflow.org/)
2. WEKA (http://www.cs.waikato.ac.nz/ml/weka/)
3. Convnet.JS (http://cs.stanford.edu/people/karpathy/convnetjs/)

While TensorFlow is an amazing framework, it is also has a steep learning curve and (if you are not lucky, like me) it can take a while to get it running on your machine.

If you are just starting, I strongly recommend WEKA. Its a bit older than the other two, BUT it has a GUI and can be installed as a standalone JAVA application.

Launch the explorer, pick one of the previously generated CSVs and go nuts on the machine learning techniques. I can recommend to start with a MultilayerPerceptron (10,20,10).

Try the limited CSVs, you will as limitation goes up, you will quickly see how the performance increases.

If you want do it more automatically, I recommend Covnet.js while not as powerful as TensorFlow, you can do pretty amazing stuff, especially the Automatic example is helpful: http://cs.stanford.edu/people/karpathy/convnetjs/demo/automatic.html

#### Visualising the corridor predictions between clusters or locations

This script takes every test trajectory apart into 2-minute interval distance steps and visualises the results for each point along the trajectory. Depending on your test dataset's size it generates a whole bunch of PNGs, so better place them in an empty folder.

```
node corridors.js PATH\_TO/results.json OUTPUT\_PATH MODE
```
**MODE** (optional): either cluster or location / default: cluster

#### Visualising the success rate of the predictions

This script generates several csv and json files, which can then be used for visualisation tasks (see below).

```
node evaluation.js PATH\_TO/results.json OUTPUT\_PATH
```

#### Temporal location (type) patterns in clusters

This script generates several csv and json files, which can then be used for visualisation tasks (see below).

```
node evaluation.js PATH\_TO/results.json OUTPUT\_PATH
```

#### Visualisation

##### evaluation_vis.html
Only requires you to point it to the folder containing the files created above.

##### cluster_event_analysis.html
Is a little more complex, because it requires an additional file with category names, in order to group locations by their categories.
I have build a script, which can download categories from the foursquare API (if your data contains foursquare IDs): https://github.com/sebastian-meier/foursquare-api-get-location-meta