
(function() {
	Math.sign = Math.sign || function(x) {
	  x = +x; // convert to a number
	  if (x === 0 || isNaN(x)) {
	    return x;
	  }
	  return x > 0 ? 1 : -1;
	}

	function d2(x1,y1,x2,y2) {
		return (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1);
	}
	function d(x1,y1,x2,y2) {
		return Math.sqrt(d2(x1,y1,x2,y2));
	}
	function isLeaf(node) {
		var l = node.quads.length;
		for(var i = 0; i < l; i++) {
			if(node.quads[i]) return false;
		}
		return true;
	}

	function OctTree2d(options) {
		this.res = {
			width: options && typeof options.width == 'number' ? options.width : 100,
			height: options && typeof options.height == 'number' ? options.height : 100
		};
		this.root = {
			x: 0, 
			y: 0, 
			mass: 0, 
			parent: null,
			quads: [null,null,null,null],
		};

		this.particles = [];
	}
	OctTree2d.prototype.calculate_deltas = function(frac) {
		var self = this;
		var dist = this.res.width / 10;
		var grav = 0.1;

		for(var i = 0; i < this.particles.length; i++) {
			console.log('particle: ' + i);

			var p = this.particles[i];

			(function(particle, particleId) {
				var ddx = 0;
				var ddy = 0;

				self.visit_approx(particle.x, particle.y, dist, function(node) {
					console.log('visiting: ', node.x, node.y);

					// is this the same particle?
					if(particle.x == node.x && particle.y == node.y) return;

					// now caculate the force
					var r2 = d2(node.x, node.y, particle.x, particle.y);
					var r = Math.sqrt(r2);
					var f = grav * node.mass / r2;

					ddx += f * (node.x - particle.x) / r;
					ddy += f * (node.y - particle.y) / r;
				});

/*
				self.visit_all(function(node) {
					console.log('visiting: ', node.x, node.y);

					// is this the same particle?
					if(particle.x == node.x && particle.y == node.y) return;

					// now caculate the force
					var r2 = d2(node.x, node.y, particle.x, particle.y);
					var r = Math.sqrt(r2);
					var f = grav * node.mass / r2;

					ddx += f * (node.x - particle.x) / r;
					ddy += f * (node.y - particle.y) / r;
				});
*/

				particle.dx += ddx * frac;
				particle.dy += ddy * frac;
			})(p, i);
		}
	}
	OctTree2d.prototype.visit_all = function(visitor) {
		for(var i = 0; i < this.particles.length; i++) {
			visitor(this.particles[i]);
		}
	}
	OctTree2d.prototype.visit_approx = function(x, y, dist, visitor) {
		this.visit_approx_helper(x, y, dist*dist, visitor, this.root, {
			x1: -this.res.width / 2,
			y1: -this.res.height / 2,
			x2: this.res.width / 2,
			y2: this.res.height / 2
		});
	}
	OctTree2d.prototype.visit_approx_helper = function(x, y, dist2, visitor, node, box) {
		//console.log('visit_approx_helper: ', node.x, node.y);
		var a2 = d2(x, y, node.x, node.y);

		if(a2 >= dist2) {
			visitor(node);
		}
		else if(isLeaf(node)) {
			visitor(node);
		}
		else {
			if(node.particle)
				visitor(node.particle);

			var cx = (box.x1 + box.x2) / 2;
			var cy = (box.x1 + box.x2) / 2;

			for(var quadrant = 0; quadrant < node.quads.length; quadrant++) {
				var q = node.quads[quadrant];

				if(!q) continue;

				this.visit_approx_helper(x, y, dist2, visitor, q, {
					x1: (quadrant | 1) ? cx : box.x1,
					y1: (quadrant | 2) ? cy : box.y1,
					x2: (quadrant | 1) ? box.x2 : cx,
					y2: (quadrant | 2) ? box.y2 : cy,
				});
			}
		}
	}
	OctTree2d.prototype.insert = function(x, y, mass, dx, dy) {
		var p = {x: x, y: y, mass: mass, dx: dx, dy: dy};
		this.particles.push(p);
		this.insert_helper(x, y, mass, this.root, p, {
			x1: -this.res.width / 2,
			y1: -this.res.height / 2,
			x2: this.res.width / 2,
			y2: this.res.height / 2
		}, 0);
	}

	OctTree2d.prototype.insert_helper = function(x, y, mass, node, particle, box, depth) {
		console.log('insert_helper: ', node.x, node.y, node.mass, box, depth);

		// first adjust the center of mass
		node.x = (node.x * node.mass + x * mass) / (node.mass + mass);
		node.y = (node.y * node.mass + y * mass) / (node.mass + mass);
		node.mass += mass;

		// pick quadrant
		var cx = (box.x1 + box.x2) / 2;
		var cy = (box.x1 + box.x2) / 2;

		var quadrant = 0;

		quadrant = quadrant | ((x - cx > 0) ? 0 : 1);
		quadrant = quadrant | ((y - cy > 0) ? 0 : 2);

		//console.log('particle: ', x, y, 'quad', quadrant);


		if(node.quads[quadrant]) {
			this.insert_helper(x, y, mass, node.quads[quadrant], particle, {
				x1: (quadrant | 1) ? cx : box.x1,
				y1: (quadrant | 2) ? cy : box.y1,
				x2: (quadrant | 1) ? box.x2 : cx,
				y2: (quadrant | 2) ? box.y2 : cy,
			}, depth + 1);
		}
		else {
			node.quads[quadrant] = {
				x: x,
				y: y, 
				mass: mass,
				parent: node,
				particle: particle,
				quads: [null,null,null,null],
			}
			particle.node = node.quads[quadrant];
		}
	}

	exports.OctTree2d = OctTree2d;
})();
