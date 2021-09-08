<template>
  <div class="imageView">
    <canvas id="viewContainer" @mousewheel="mousewheel" @mousedown="moveStart" @mouseup="moveEnd"></canvas>
  </div>
</template>
<script>
let startX, startY
export default {
  name: 'imageView',
  data() {
    return {
      currentUrl: '',
      currentIndex: -1,
      canvas: null,
      context: null,
      sourceImage: null,
      scaleX: -1,
      scaleY: -1,
      zoom: 1,
      centerX: 0,
      centerY: 0
    }
  },
  props: {
    url: {
      typeof: String | Array,
      require: false
    },
    multiple: {
      typeof: Boolean,
      default: false
    },
    addRatio: {
      typeof: Number,
      default: 0.3
    },
    subRatio: {
      typeof: Number,
      default: 0.1
    },
    maxZoom: {
      typeof: Number,
      default: 4
    },
    minZoom: {
      typeof: Number,
      default: 0.5
    }
  },
  watch: {
    currentUrl() {
      this.getImageData()
    }
  },
  mounted() {
    if (this.multiple) {
      this.currentUrl = this.url[0]
    } else {
      this.currentUrl = this.url
      this.currentIndex = 0
    }
    this.canvas = this.$el.querySelector('#viewContainer')
    this.canvas.width = this.$el.clientWidth
    this.canvas.height = this.$el.clientHeight
    this.context = this.canvas.getContext('2d')
  },
  methods: {
    prev() {
      this.currentIndex = this.currentIndex === 0 ? 0 : this.currentIndex - 1
      this.currentUrl = this.url[this.currentIndex]
    },
    next() {
      this.currentIndex = this.currentIndex === this.url.length - 1 ? this.url.length - 1 : this.currentIndex + 1
      this.currentUrl = this.url[this.currentIndex]
    },
    getImageData() {
      this.sourceImage = new Image()
      this.sourceImage.src = this.currentUrl
      const self = this
      this.sourceImage.onload = function () {
        self.scaleX = self.sourceImage.naturalWidth / self.canvas.width
        self.scaleY = self.sourceImage.naturalHeight / self.canvas.height
        self.centerX = self.sourceImage.naturalWidth / 2
        self.centerY = self.sourceImage.naturalHeight / 2
        self.context.drawImage(self.sourceImage, 0, 0, self.canvas.width, self.canvas.height)
      }
    },
    renderImage() {
      let sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight
      if (this.zoom >= 1) {
        dx = 0
        dy = 0
        dWidth = this.canvas.width
        dHeight = this.canvas.height
        const trueWidth = (this.canvas.width * this.scaleX) / this.zoom
        const trueHeight = (this.canvas.height * this.scaleY) / this.zoom
        if (this.centerX + trueWidth / 2 >= this.sourceImage.naturalWidth) {
          sx = this.sourceImage.naturalWidth - trueWidth
          this.centerX = sx + trueWidth / 2
        } else if (this.centerX - trueWidth / 2 < 0) {
          sx = 0
          this.centerX = trueWidth / 2
        } else {
          sx = this.centerX - trueWidth / 2
        }
        if (this.centerY + trueHeight / 2 >= this.sourceImage.naturalHeight) {
          sy = this.sourceImage.naturalHeight - trueHeight
          this.centerY = sx + trueHeight / 2
        } else if (this.centerY - trueHeight / 2 < 0) {
          sy = 0
          this.centerY = trueHeight / 2
        } else {
          sy = this.centerY - trueHeight / 2
        }
        sWidth = trueWidth
        sHeight = trueHeight
      } else {
        const trueWidth = (this.sourceImage.naturalWidth / this.scaleX) * this.zoom
        const trueHeight = (this.sourceImage.naturalHeight / this.scaleY) * this.zoom
        sx = 0
        sy = 0
        sWidth = this.sourceImage.naturalWidth
        sHeight = this.sourceImage.naturalHeight
        dx = (this.canvas.width - trueWidth) / 2
        dy = (this.canvas.height - trueHeight) / 2
        dWidth = trueWidth
        dHeight = trueHeight
      }
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.context.drawImage(this.sourceImage, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    },
    mousewheel(e) {
      let timeout
      if (this.zoom >= this.maxZoom || this.zoom <= this.minZoom) {
      }
      if (timeout) {
        clearTimeout(timeout)
      } else {
        timeout = setTimeout(() => {
          if (e.wheelDelta > 0) {
            this.zoom += this.zoom >= 1 ? this.addRatio : this.subRatio
            if (this.zoom > this.maxZoom) {
              this.zoom = this.maxZoom
            }
          } else {
            this.zoom -= this.zoom > 1 ? this.addRatio : this.subRatio
            if (this.zoom < this.minZoom) {
              this.zoom = this.minZoom
            }
          }
          this.renderImage()
        }, 500)
      }
    },
    moveStart(e) {
      startX = e.offsetX
      startY = e.offsetY
    },
    moveEnd(e) {
      let moveX = Math.abs((startX - e.offsetX) * this.scaleX) > 100 ? (startX - e.offsetX) * this.scaleX : 0
      let moveY = Math.abs((startY - e.offsetY) * this.scaleY) > 100 ? (startY - e.offsetY) * this.scaleY : 0
      if (moveX || moveY) {
        this.moveImage(moveX, moveY)
      }
    },
    moveImage(moveX, moveY) {
      let sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight
      if (this.zoom > 1) {
        dx = 0
        dy = 0
        dWidth = this.canvas.width
        dHeight = this.canvas.height
        this.centerX += moveX
        this.centerY += moveY
        const trueWidth = (this.canvas.width * this.scaleX) / this.zoom
        const trueHeight = (this.canvas.height * this.scaleY) / this.zoom
        if (moveX > 0) {
          if (this.centerX + trueWidth / 2 >= this.sourceImage.naturalWidth) {
            sx = this.sourceImage.naturalWidth - trueWidth
            this.centerX = sx + trueWidth / 2
          } else {
            sx = this.centerX - trueWidth / 2
          }
        } else {
          if (this.centerX - trueWidth / 2 < 0) {
            sx = 0
            this.centerX = trueWidth / 2
          } else {
            sx = this.centerX - trueWidth / 2
          }
        }
        if (moveY > 0) {
          if (this.centerY + trueHeight / 2 >= this.sourceImage.naturalHeight) {
            sy = this.sourceImage.naturalHeight - trueHeight
            this.centerY = sy + trueHeight / 2
          } else {
            sy = this.centerY - trueHeight / 2
          }
        } else {
          if (this.centerY - trueHeight / 2 < 0) {
            sy = 0
            this.centerY = trueHeight / 2
          } else {
            sy = this.centerY - trueHeight / 2
          }
        }
        sWidth = trueWidth
        sHeight = trueHeight
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.context.drawImage(this.sourceImage, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.imageView {
  width: 100%;
  height: 100%;
  border: 1px solid red;
  canvas {
    width: 100%;
    height: 100%;
  }
  #tranData {
    display: none;
  }
}
</style>
