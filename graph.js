class Node {
    constructor(id, value){
        this.id = id;
        this.value = value;
    }
    repr(){
        return `(${this.id}, ${JSON.stringify(this.value)})`
    }
    toJSON(){
        return {
            id: this.id,
            value: this.value
        }
    }
}

class Graph {
    constructor(cytoscape = undefined){
        this.idList = [];
        this.nodes = {};
        this.adjList = {};
        this.cytoscape = cytoscape;
        this.cyLayout = {
            name: 'fcose',
            quality: 'default', // "proof", "default" or "draft"
            randomize: true,    // Whether to randomize the initial positions
            animate: true,      // Whether to show the layout as it runs
            animationDuration: 200, // Duration of the animation in ms
            fit: true,          // Whether to fit the viewport to the graph
            padding: 30,        // Padding on fit
            nodeSeparation: 200, // Minimum separation between nodes
            nodeDimensionsIncludeLabels: true, // Whether to include labels in node dimensions
            uniformNodeDimensions: false, // Uniform sizing for nodes
            packComponents: true, // Pack disconnected components
        }
    }
    insert(node){
        // graph datatype
        const id = node.id;
        if (this.idList.indexOf(id) !== -1){
            throw new Error(`Node ${id} already exist!`);
        }
        this.idList.push(id);
        this.nodes[id] = node;
        this.adjList[id] = [id];
        
        // cytoscape
        if (this.cytoscape === undefined){
            return;
        }
        this.cytoscape.add({
            group: 'nodes',
            data: {
                id: id,
                value: node.value
            }
        });
        this.cytoscape.layout(this.cyLayout).run();
    }
    edgeId(id1, id2){
        // graph datatype
        if (this.idList.indexOf(id1) === -1 || this.idList.indexOf(id2) === -1){
            throw new Error(`Nodes ${id1} or ${id2} doesn't exist!`);
        }
        if (this.adjList[id1].indexOf(id2) === -1){
            this.adjList[id1].push(id2);
        }
        if (this.adjList[id2].indexOf(id1) === -1){
            this.adjList[id2].push(id1);
        }
        
        // cytoscape
        if (this.cytoscape === undefined){
            return;
        }
        this.cytoscape.add([
            {
                group: 'edges',
                data: {
                    id: `(${id1},${id2})`,
                    source: id1,
                    target: id2
                }
            },
            {
                group: 'edges',
                data: {
                    id: `(${id2},${id1})`,
                    source: id2,
                    target: id1
                }
            }
        ]);
        this.cytoscape.layout(this.cyLayout).run();
    }
    edge(node1, node2){
        // graph datatype
        const id1 = node1.id;
        const id2 = node2.id;
        if (this.idList.indexOf(id1) === -1){
            this.insert(node1);
        }
        if (this.idList.indexOf(id2) === -1){
            this.insert(node2);
        }
        this.edgeId(id1, id2);
    }
    repr(){
        let ret = "";
        for(let id of this.idList){
            ret += `${id}: ${this.nodes[id].repr()} - ${JSON.stringify(this.adjList[id])}`;
            ret += "\n";
        }
        return ret;
    }
    fromJSON(json){
        // graph datatype
        if (json.idList === undefined || json.nodes === undefined || json.adjList === undefined){
            throw new Error("Invalid JSON input format");
        }
        const idList = json.idList;
        const nodes = json.nodes;
        const adjList = json.adjList;
        // Set nodes to Node format
        for (let id of idList){
            nodes[id] = new Node(nodes[id].id, nodes[id].value);
        }
        // Check format
        for (let id of idList){
            if (nodes[id] === undefined || typeof(adjList[id]) !== "object"){
                throw new Error("Invalid graph");
            }
            for (let edge of adjList[id]){
                if (idList.indexOf(edge) === -1){
                    throw new Error("Graph contains undefined nodes");
                }
            }
        }
        this.idList = idList;
        this.nodes = nodes;
        this.adjList = adjList;
    }
    toJSON(){
        const nodes = {};
        for (let id of this.idList){
            nodes[id] = this.nodes[id].toJSON();
        }
        return {
            idList: this.idList,
            nodes: nodes,
            adjList: this.adjList
        }
    }
    cytoscapeInit(cy){
        // init cytoscape nodes and edges
        this.cytoscape = cy;
        const cyAdd = [];
        for (let id of this.idList){
            cyAdd.push({
                group: 'nodes',
                data: {
                    id: id,
                    value: this.nodes[id].value
                }
            });
            for (let id2 of this.adjList[id]){
                if (id === id2 && this.adjList[id].length > 1){
                    continue;
                }
                cyAdd.push({
                    group: 'edges',
                    data: {
                        id: `(${id},${id2})`,
                        source: id,
                        target: id2
                    }
                });
            }
        }
        this.cytoscape.add(cyAdd);
        this.cytoscape.layout(this.cyLayout).run();
    }
    degreesOfConnection(target){
        if (this.idList.indexOf(target) === -1){
            return;
        }
        // cytoscape
        if (this.cytoscape === undefined){
            return;
        }
        for (let id of this.adjList[target]){
            this.cytoscape.$('#' + id).style('opacity', '1');
            if (id === target){
                continue;
            }
            this.cytoscape.$('#' + id).style('border-color', '#FF4136');
            this.cytoscape.$('#' + id).style('border-width', '1');
        }
        this.cytoscape.layout(this.cyLayout).run();
    }
}
