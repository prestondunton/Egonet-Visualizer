
# coding: utf-8

# In[1]:

import json
import networkx
from networkx.readwrite import json_graph
import sys


# In[25]:

def LoadGraph(filePath):
    networkXGraph = networkx.read_gml(filePath)
    unEditedJson = json_graph.node_link_data(networkXGraph)
    jsonString = json.dumps(unEditedJson)
    return jsonString


# In[3]:

print(LoadGraph(sys.argv[len(sys.argv)-1]))


# In[ ]:



