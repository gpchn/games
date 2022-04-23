const app = document.getElementById('app');
	const btn = document.getElementById('btn');
	const emojis = ['😅', '🥵', '🤡', '🥶', '🤢'];
	let cells = [];

	class GameMap {
		constructor(x, y, size) {
			this.x = x;
			this.y = y;
			this.size = size;
			this.matrix = [];
			this.useSwap = false;
			this.handleable = true;
			this.types = emojis.length;
		}
		genMatrix() {
			const { x, y } = this;
			const row = new Array(x).fill(undefined);
			const matrix = new Array(y).fill(undefined).map(item => row);
			this.matrix = matrix;
			return this;
		}
		genRandom() {
			const { x, y } = this;
			this.matrix = this.matrix.map(row => row.map(item => Math.floor(Math.random() * this.types)));
			console.log(this.matrix);
			return this;
		}
		init() {
			cells = [];
			const { x, y } = this;
			for (let i = 0; i < y; i++) {
				for (let j = 0; j < x; j++) {
					const type = this.matrix[i][j];
					const random = Math.floor(Math.random() * this.types);
					cells.push(new Cell({
						type: (type == undefined) ? random : type,
						position: [j, i],
						status: (type == undefined) ? 'emerge' : 'common',
						left: undefined,
						top: undefined,
						right: undefined,
						bottom: undefined,
						instance: undefined
					}));
				}
			}
			cells.forEach(cell => {
				const [row, col] = cell.position;
				cell.left = cells.find(_cell => {
					const [_row, _col] = _cell.position;
					return (_row == row - 1) && (_col == col);
				});
				cell.right = cells.find(_cell => {
					const [_row, _col] = _cell.position;
					return (_row == row + 1) && (_col == col);
				});
				cell.top = cells.find(_cell => {
					const [_row, _col] = _cell.position;
					return (_row == row) && (_col == col - 1);
				});
				cell.bottom = cells.find(_cell => {
					const [_row, _col] = _cell.position;
					return (_row == row) && (_col == col + 1);
				});
				cell.genCell();
			});
			return this;
		}
		genSwap(firstCell, secondCell) {
			return new Promise((resolve, reject) => {
				const { instance: c1, type: t1 } = firstCell;
				const { instance: c2, type: t2 } = secondCell;
				const { left: x1, top: y1 } = c1.style;
				const { left: x2, top: y2 } = c2.style;
				setTimeout(() => {
					c1.style.left = x2;
					c1.style.top = y2;
					c2.style.left = x1;
					c2.style.top = y1;
				}, 0);
				setTimeout(() => {
					firstCell.instance = c2;
					firstCell.type = t2;
					secondCell.instance = c1;
					secondCell.type = t1;
					resolve('ok');
				}, 500);
			});
		}
		checkCollapse() {
			return cells.some(cell => cell.status == 'collapse');
		}
		markCollapseCells() {
			cells.forEach(cell => {
				const { left, right, top, bottom, type } = cell;
				if (left?.type == type && right?.type == type) {
					left.status = 'collapse';
					cell.status = 'collapse';
					right.status = 'collapse';
				}
				if (top?.type == type && bottom?.type == type) {
					top.status = 'collapse';
					cell.status = 'collapse';
					bottom.status = 'collapse';
				}
			});
			return this;
		}
		genEmerge() {
			return new Promise((resolve, reject) => {
				this.regenCellMap();
				this.genCellMap();
				setTimeout(() => {
					cells.forEach(cell => {
						if (cell.status == 'emerge') {
							cell.instance.style.transform = 'scale(1)';
						}
					});
				}, 100);
				setTimeout(() => { resolve('ok'); }, 500);
			});
		}
		genCollapse() {
			return new Promise((resolve, reject) => {
				this.handleable = false;
				this.markCollapseCells();
				setTimeout(() => {
					cells.forEach(cell => {
						if (cell.status == 'collapse') {
							cell.instance.style.transform = 'scale(0)';
						}
					});
				}, 0);
				setTimeout(() => {
					resolve('ok');
				}, 500);
			});
		}
		genDownfall() {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					cells.forEach(cell => {
						if (cell.status != 'collapse') {
							let downfallRange = 0;
							let bottom = cell.bottom;
							while (bottom) {
								if (bottom.status == 'collapse') {
									downfallRange += 1;
								}
								bottom = bottom.bottom;
							}
							cell.instance.style.top = (parseInt(cell.instance.style.top) + gameMap.size * downfallRange) + 'px';
						}
					});
				}, 0);
				setTimeout(() => {
					resolve('ok');
				}, 500);
			});
		}
		genShuffle() {
			console.log(cells);
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					const len = this.x * this.y;
					const arr = new Array(len).fill(0).map((_, i) => i);
					const shuffle = arr => arr.sort(() => 0.5 - Math.random());
					const shuffleArray = shuffle(arr);
					console.log(shuffleArray);
					cells.forEach((cell, index) => {
						const newPosition = shuffleArray[index];
						cell.instance.style.top = Math.floor(newPosition / this.x) * this.size + 'px';
						cell.instance.style.left = newPosition % this.x * this.size + 'px';
					});
				}, 0);
				setTimeout(() => {
					this.regenCellMap();
					this.genCellMap();
					this.genLoop();
					resolve('ok');
				}, 500);
			});
		}
		async genLoop() {
			await gameMap.genCollapse();
			let status = cells.some(cell => cell.status == 'collapse');
			while (cells.some(cell => cell.status == 'collapse')) {
				await gameMap.genDownfall();
				await gameMap.genEmerge();
				await gameMap.genCollapse();
			}
			gameMap.handleable = true;
			return status;
		}
		regenCellMap() {
			const size = gameMap.size;
			const findInstance = (x, y) => {
				return cells.find(item => {
					const { offsetLeft, offsetTop } = item.instance;
					return (item.status != 'collapse' && (x == offsetLeft / size) && (y == offsetTop / size));
				})?.instance;
			};
			this.genMatrix();
			this.matrix = this.matrix.map((row, rowIndex) => row.map((item, itemIndex) => findInstance(itemIndex, rowIndex)?.type));

			console.log(this.matrix);

			this.init();
		}
		genCellMap() {
			app.innerHTML = '';
			cells.forEach(cell => {
				app.append(cell.instance);
			});
			console.log(cells);
			return this;
		}
	}

	class Cell {
		constructor(options) {
			const { position, status, type, left, top, right, bottom, instance } = options;
			this.type = type;
			this.position = position;
			this.status = status;
			this.top = top;
			this.bottom = bottom;
			this.left = left;
			this.right = right;
			this.instance = instance;
		}
		genCell() {
			const cell = document.createElement('div');
			const size = gameMap.size;
			const [x, y] = this.position;
			cell.type = this.type;
			cell.style.cssText =
				`
				width:${size}px;
				height:${size}px;
				left:${size * x}px;
				top:${size * y}px;
				box-sizing:border-box;
				border:5px solid transparent;
				transition:0.5s;
				position:absolute;
				transform:scale(${this.status == 'emerge' ? '0' : '1'});
				display:flex;
				justify-content:center;
				align-items:center
				`;
			cell.innerHTML = `<span style="font-size:35px;cursor:pointer">${emojis[this.type]}</span>`;
			this.instance = cell;
		}
	}

	let gameMap = new GameMap(6, 10, 50);

	gameMap.genMatrix().genRandom();
	gameMap.init().genCellMap();
	gameMap.genLoop();

	let cell1 = null;
	let cell2 = null;

	app.onclick = () => {
		if (gameMap.handleable) {
			const target = event.target.parentNode;
			const { left: x, top: y } = target.style;
			const _cell = cells.find(item => item.instance == target);
			if (!gameMap.useSwap) {
				target.className = 'active';
				cell1 = _cell;
			} else {
				cell2 = _cell;
				cell1.instance.className = '';
				if (['left', 'top', 'bottom', 'right'].some(item => cell1[item] == cell2)) {
					(async () => {
						await gameMap.genSwap(cell1, cell2);
						let res = await gameMap.genLoop();
						if (!res) {
							await gameMap.genSwap(cell1, cell2);
						}
					})();
				}
			}
			gameMap.useSwap = !gameMap.useSwap;
		}
	};

	btn.onclick = () => {
		gameMap.genShuffle();
	}
