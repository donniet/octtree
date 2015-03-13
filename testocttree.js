//test octtree

var ot = require('./octtree.js');

var o = new ot.OctTree2d();

o.insert(5,5,5,0,0);
o.insert(5,-5,5,0,0);
o.insert(6,6,5,0,0);

o.calculate_deltas(1);

console.log(o);

