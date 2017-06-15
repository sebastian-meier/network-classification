# network-classification
PhD #04 - Network analysis, classification and prediction

![Evaluation Results](https://github.com/sebastian-meier/network-classification/blob/master/thumb.jpg?raw=true)

## Intro

Most of the processing is already happening in the data preprocessing: https://github.com/sebastian-meier/moves-to-spatialite
If the above script was set to output the test results, those can be evaluated and visualised in this repository.

### Usage

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