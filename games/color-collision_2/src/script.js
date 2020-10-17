console.clear()

// Utility Functions -->

// This func. gets a random float between the given range
function randomFloatFromRange(min, max){
	return (Math.random() * (max - min + 1) + min);
}

// This func. gets a random item from a given array
function randomFromArray(arr){
	return arr[Math.floor(Math.random() * arr.length)]
}

// This func. gets the distance between two given points
function getDist(x1, y1, x2, y2){
	return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2))
}


// PARTICLE CLASS
class Particle{
	constructor(canvas, ctx, x, y, radius, color, velX, velY){
		this.canvas = canvas
		this.ctx = ctx
		this.x = x
		this.y = y
		this.velocity = {
			x: (Math.random() - 0.5) * velX,
			y: (Math.random() - 0.5) * velY,
		}
		this.radius = radius
		this.color = color
		this.timeToLive = 250
		this.opacity = 1
		this.gravity = 0.25
	}
	draw(){ // This func. draws the particle
		this.ctx.save()
		this.ctx.beginPath()
		this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
		this.ctx.fillStyle = this.color
		this.ctx.shadowColor = this.color
		this.shadowBlur = 25
		this.ctx.globalAlpha = this.opacity
		this.ctx.fill()
		this.ctx.closePath()
		this.ctx.restore()        
	}
	update(){ // This func. updates the particle
		this.x += this.velocity.x
		this.y += this.velocity.y
		this.velocity.y += this.gravity

		this.timeToLive -= 1
		this.opacity -= 1 / this.timeToLive
		this.draw()
	}
}

// BALL CLASS
class Ball{
	constructor(canvas, ctx, x, y, radius, color, particlesArr, velX, velY, dontCheck){
		this.canvas = canvas
		this.ctx = ctx
		this.x = x
		this.y = y
		this.radius = radius
		this.color = color
		this.velocity = {
			x: velX || 0,
			y: velY || 0
		}
		this.acc = 0.01
		this.origin = { x: x, y: y }
		this.dontCheck = dontCheck
		this.opacity = 1
		this.particlesArr = particlesArr
		this.collided = false
	}
	draw(){ // This func. draws the ball
		this.ctx.save()
		this.ctx.beginPath()
		this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
		this.ctx.fillStyle = this.color
		this.ctx.shadowColor = this.color
		this.shadowBlur = 25
		this.ctx.shadowOffsetX = 0;
		this.ctx.shadowOffsetY = 0;
		this.ctx.globalAlpha = this.opacity
		this.ctx.fill()
		this.ctx.closePath()
		this.ctx.restore()
	}
	// This func. updates the ball. The first argument of this func. takes an array where all the insrtance of balls are stored
	// The second argument is opotional [default is False]. If set to true then the position of the ball changes with its respective Velocity
	update(ballsArr, updateVel = false){
		if(this.origin.y <= 0){
			this.y += this.velocity.y
		}
		else if(this.origin.y >= this.canvas.height){
			this.y -= this.velocity.y
		}
		if(updateVel == true){
			this.y += this.velocity.y
			this.x += this.velocity.x
		}

		this.collisionDetect(ballsArr)
		this.draw()
	}
	// This func. is used to detect the collisions bettween any two balls
	// The func. takes an argument which is the array where al the balls are stored
	collisionDetect(ballsArr){
		for(let i = 0; i < ballsArr.length; i++){
			if(this === ballsArr[i] || this.dontCheck) continue
			let distBetweenPoints = getDist(this.x, this.y, ballsArr[i].x, ballsArr[i].y) - this.radius * 2
			if(distBetweenPoints < 0){
				if(this.color == ballsArr[i].color){
					for(let j = 0; j < Math.floor(randomFloatFromRange(20, 25)); j++){
						this.break(this.particlesArr, 0.4, 0.8)
						this.collided = true
					}
					this.opacity = 0
				}
				else if(this.color != ballsArr[i].color){
					for(let j = 0; j < Math.floor(randomFloatFromRange(40, 55)); j++){
						ballsArr.forEach((ball) => {
							ball.opacity = 0
							this.break(this.particlesArr, 2, 5, ball.x, ball.y, ball.color)
						})
						this.particlesArr.forEach((particle) => {
							particle.gravity = 0
						})
					}
				}
			}
		}
	}
	// This func. is used to detect if the ball hits any of the corners of the canvas
	// If hits any of the canvas sides then the ball would change its velocity direction
	edgeDetect(){
		if (this.y + this.radius + this.velocity.y > this.canvas.height) {
			this.velocity.y *= -1
		}
		else if(this.y - this.radius <= 0){
			this.velocity.y *= -1
		}

		if (this.x + this.radius + this.velocity.x > this.canvas.width) {
			this.velocity.x *= -1
		}
		else if (this.x - this.radius <= 0) {
			this.velocity.x *= -1
		}
	}
	// This function is used to show that when any ball hits each other then they create many small particles [Which looks kinda like sparks]
	// This func. takes 6 arguments [too many]
	// The first accepts an array where the sparks OR the small particles would be stored
	// The second and the third argument is nothing but accepts a min and max radius
	// The forth and fifth args. tahes where the sparks would be spawned
	// The sixth is nothing but 'c' which means color. I want to make the sparks the same color as the ball
	break(arr, minRadius, maxRadius, x, y, c){
		var randRadius = randomFloatFromRange(minRadius, maxRadius)
		var randVel = {
			x: randomFloatFromRange(-20, 20),
			y: randomFloatFromRange(-20, 20),
		}
		if(this.origin.y <= 0){
			let spawnX , spawnY
			let color
			if(x && y){
				spawnX = x
				spawnY = y
				color = c
			}else{
				spawnX = this.x
				spawnY = this.y + this.radius
				color = this.color
			}
			arr.push(
				new Particle(
					this.canvas, this.ctx,
					spawnX, spawnY,
					randRadius, color , randVel.x, randVel.y
				)
			)
		}else{
			let spawnX , spawnY
			let color
			if(x && y){
				spawnX = x
				spawnY = y
				color = c
			}else{
				spawnX = this.x
				spawnY = this.y - this.radius
				color = this.color
			}
			arr.push(
				new Particle(
					this.canvas, this.ctx,
					spawnX, spawnY,
					randRadius, color , randVel.x, randVel.y
				)
			)
		}
	}
	// When this func. is called with two colors passed as args. then it swaps the color between the two color provided
	change(colorDefault, colorTochange){
		if(this.color != colorDefault){
			this.color = colorDefault
		}else{
			this.color = colorTochange
		}
	}
}

// calling the spliiting function
Splitting()

// Selecting the canvas
const canvas = document.querySelector('[data-canvas]')
// getting its context
const ctx = canvas.getContext('2d')

// Setting its width and height
let canvasMaxHeight = 800,
	 canvasWidth = 400,
	 canvasHeight = innerHeight - 50 > canvasMaxHeight ? canvasMaxHeight : innerHeight - 50;
canvas.width = canvasWidth
canvas.height = canvasHeight

let retryBtn = document.querySelector('.retry-btn')
let retryText = document.querySelector('.retry-text')
let playBtn = document.querySelector('.btn.play')
let startScreen = document.querySelector('.start-screen')


// Initializing everything

let balls = [], // balls array
	 particles = [] // sparks array
var redBall, blueBall // the TWO cantral balls
var separation = 35 // separation between central balls
var globalRadius = 18 // radius for all the Balls
let generateBall = false // generate a new ball or not
let timeInterval
let velocityOfBall // velocity of the ball
let failed = false // game failed or not
let timer = 0 // timer (increments every 1ms)
let score = 0 // score counter
let fillColor // Text fill color
// colors array
var colors = ['#e74c3c', '#3498db']
// random points where the ball would generate and start moving
let randPoints;

// Function that initializes the canvas
function init(){
	balls = []
	particles = []
	uselessBalls = []
	generateBall = true
	timeInterval = 2000
	timer = 0
	velocityOfBall = 2.5
	score = 0
	fillColor = '#fff'

	blueBall = new Ball(
		canvas, ctx,
		canvasWidth/2, canvasHeight/2 - separation,
		globalRadius, colors[1], particles, 0, 0, true
	)
	redBall = new Ball(
		canvas, ctx,
		canvasWidth/2, canvasHeight/2 + separation,
		globalRadius, colors[0], particles, 0, 0, true
	)
	balls.push(redBall, blueBall)

	randPoints = [
		{
			x: canvas.width / 2,
			y: -50
		},
		{
			x: canvas.width / 2,
			y: canvas.height + 50
		}
	]
}

// This is an array for a bunch of useless balls on the start of the game
var uselessBalls = []
// This function will push many useless balls balls to the useless array and then push all the useless balls to the default ballas array
function initUseless(){
	for(let i = 0; i < 20; i++){
		let randVelXY = {
			x: randomFloatFromRange(-5, 5),
			y: randomFloatFromRange(-5, 5)
		}
		let r = randomFloatFromRange(5, 10)
		uselessBalls.push(
			new Ball(
				canvas, ctx, canvasWidth / 2, canvasHeight / 2,
				r, colors[Math.floor(Math.random() * colors.length)],
				particles, randVelXY.x, randVelXY.y, true
			)
		)
	}
	balls.push([...uselessBalls])
}
// calling it on execution of code
initUseless()


// initialiazing the background in a variable
var background = BG_Gradient('#2c3e50', '#34495e')

// this func. calls itself again and again every 60ms and is the reason you can play this game
function loop(){
	// func. that will call itself
	requestAnimationFrame(loop)

	// seting the background
	ctx.fillStyle = background
	ctx.fillRect(0, 0, canvas.width, canvas.height)

	// setting the scorecard
	ctx.fillStyle = fillColor
	ctx.font = '21px sans-serif'
	ctx.fillText(`SCORE : ${score.toString()}`, 20, 35)

	// updating every uselessballs
	uselessBalls.forEach(ball => {
		ball.update(balls, true)
		ball.edgeDetect()
	})
	if(uselessBalls.length != 0){
		return
	}

	// updating every balls in the balls array
	if(balls.length != 0){
		balls.forEach((ball, index) => {
			ball.update(balls)
			if(ball.collided == true){
				score += 10
				fillColor = ball.color
			}
			if(ball.opacity <= 0){
				ball.dontCheck = true
				balls.splice(index, 1)
			}
		})
	}
	if(balls.length == 0 || balls.length == 1){
		failed = true
		generateBall = false
	}
	if(balls.length == 2){
		generateBall = true
	}
	if(timeInterval % timer == 0 && generateBall == true){
		generateBall = false
		pushNewBalls()
	}

	// updating every particles or sparks in the particles array
	if(particles.length != 0){
		particles.forEach((particle, index) => {
			particle.update()
			if(particle.opacity <= 0.05){
				particles.splice(index, 1)
			}
		})
	}

	// reseting the timer to 0 every 600ms
	if(timer == 600){
		timer = 0
	}

	// func. that is used to show and hide the UI options
	showHideOptions()
	// increment timer by 1 every 1ms
	timer++
}
// calling the func. once will make the recurrsion possible which in return will start the animations
loop()


// Function that is used tto push new balls to the Balls array whenever called
function pushNewBalls(){
	var randomPoint = randomFromArray(randPoints),
		 randomColor = randomFromArray(colors)
	balls.push(
		new Ball(
			canvas, ctx,
			randomPoint.x, randomPoint.y,
			globalRadius, randomColor, particles, 0, velocityOfBall, false
		)
	)
}

// Func. to show and hide the UI
function showHideOptions(){
	if(failed == true && generateBall == false){
		retryText.classList.remove('hide')
		retryText.classList.add('show')
		retryBtn.classList.remove('hide')
		retryBtn.classList.add('show')
	}else if(failed == false && generateBall == true){
		retryText.classList.add('hide')
		retryText.classList.remove('show')
		retryBtn.classList.add('hide')
		retryBtn.classList.remove('show')
	}
}

// Func. that returns simple color gradient by providing two colors
function BG_Gradient(color1, color2){
	let bg = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
	bg.addColorStop(0, color1)
	bg.addColorStop(1, color2)
	return bg
}

// This will be called every 1000ms and the code would execute
setInterval(() => {
	if(velocityOfBall <= 7){
		velocityOfBall += 0.08
	}else{
		velocityOfBall += 0
	}
}, 1500)


// EVENT LISTENERS

// Clicking on the canvas would change the color
canvas.addEventListener('mousedown', () => {
	redBall.change(colors[0], colors[1])
	blueBall.change(colors[1], colors[0])
})

// retry again by clicking the retry button
retryBtn.addEventListener('mousedown', () => {
	failed = false
	init()
})

// Start playing now.
playBtn.addEventListener('mousedown', () => {
	startScreen.classList.add('hide')
	init()
})

window.addEventListener('resize', () => {
	if(canvasHeight >= canvasMaxHeight){
		canvasHeight = canvasMaxHeight;
	}else{
		canvasHeight = innerHeight - 50		
	}
	canvas.height = canvasHeight
})