window.onload = function () {
	var idleCanvas = document.getElementById('idleCanvas');
	paper.setup(idleCanvas);
	paper.install(window)
	draw()
}

const strokeWidth = 4;
const strokeColor = 'white';
let density = 0.8

let QuadTree = class {
	constructor(root, tileSize, width, height) {
		this.root = new Point(root)
		this.tiles = []

		for (let row = 0; row < width; row++) {
			for (let col = 0; col < height; col++) {
				let t = new Tile(
					new Point(
						root.x + row * tileSize, 
						root.y + col * tileSize
					), tileSize, 1
				)
				this.tiles.push(t)
			}
		}
	}

	draw() {
		for (let i = 0; i < this.tiles.length; i++) {
			this.tiles[i].draw()
		}
	}

	morph() {
		for (let i = 0; i < this.tiles.length; i++) {
			this.tiles[i].morph()
		}
	}
}

let Tile = class {
	constructor(root, size, level) {
		this.root = new Point(root);
		this.size = size;
		this.level = level;
		this.rect = new Rectangle(
			this.root,
			new Size(size, size)
		)
		this.children = []
		this.path = null
		this.isSplit = false
	}

	draw() {
		if (this.isSplit) {
			for (let i = 0; i < 4; i++) {
				this.children[i].draw()
			}
		} else {
			this.path = new Path.Rectangle(this.rect)
			this.path.strokeWidth = strokeWidth
			this.path.strokeColor = strokeColor

			if (this.size < 128) {
				let p = Math.random()

				if (p < 0.7) {
					this.path.fillColor = 'black'
				} else {
					this.path.fillColor = '#48ffa4'
				}
			}
			
		}
	}

	undraw() {
		this.path.remove()
	}

	canMerge() {
		if (!this.isSplit) {
			return true
		} else {
			for (let i = 0; i < 4; i++) {
				if (this.children[i].isSplit) {
					return false
				}
			}
			return true
		}
	}

	split() {
		if (this.isSplit) {
			return
		}

		let halfSize = this.size / 2
		let r1 = this.rect.topLeft
		let r2 = this.rect.topCenter
		let r3 = this.rect.leftCenter
		let r4 = this.rect.center
		this.children.push(new Tile(r1, halfSize, this.level + 1))
		this.children.push(new Tile(r2, halfSize, this.level + 1))
		this.children.push(new Tile(r3, halfSize, this.level + 1))
		this.children.push(new Tile(r4, halfSize, this.level + 1))
		this.isSplit = true
	}

	merge() {
		if (!this.isSplit) {
			return
		}

		this.isSplit = false
		for (i = 0; i < 4; i++) {
			this.children[i].undraw()
		}

		this.children = []
	}

	morph() {
		let p = Math.random()

		if (!this.isSplit && p < Math.pow(density, this.level)) {
			this.split()
		} else if (this.canMerge() &&
					p / 2 < (1 - Math.pow(density, this.level))) {
			this.merge()
		} else if (this.isSplit) {
			for (let i = 0; i < 4; i++) {
				this.children[i].morph()
			}
		}

	}
}

let idleInterval = 100
let idleLoop;

function draw() {
	root = new Point(88, 192)
	drawBorder(root)

	quadTree = new QuadTree(root, 512, 2, 3)

	idleLoop = setInterval(function() {
		project.activeLayer.children = []
		quadTree.morph()
		drawBorder(root)
		quadTree.draw()
		// density += 0.001
	}, idleInterval)
}

function drawBorder(root) {
	bg = new Path.Rectangle([0, 0], [1200, 1920])
	bg.fillColor = 'black'

	borderRoot = new Point(root.x - 256, root.y - 256)

	for (i = 0; i < 8; i++) {
		b = new Path.Rectangle(
			[borderRoot.x, borderRoot.y + 256 * i],
			[256, 256])
		b.strokeColor = strokeColor
		b.strokeWidth = strokeWidth

		if (i == 0 || i == 7) {
			for (j = 1; j < 5; j++) {
				b = new Path.Rectangle(
					[borderRoot.x + 256 * j, borderRoot.y + 256 * i],
					[256, 256])
					b.strokeColor = strokeColor
					b.strokeWidth = strokeWidth
			}
			
		}

		b = new Path.Rectangle(
			[borderRoot.x + 1280, borderRoot.y + 256 * i],
			[256, 256])
		b.strokeColor = strokeColor
		b.strokeWidth = strokeWidth
	}
}