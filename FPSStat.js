/**
 * 使用
 * var stats = new FPSStat();
 * stats.monitor(0)
 */

export class FPSStat {
    /**
     * @private 
     * @description 模式
     */
    mode = 0;

    /**
     * @private
     * @description 容器元素
     */
    container = document.createElement('div')

    /**
     * @static
     * @description 版本号
     */
    static REVISION = 1
    /**
     * @private
     * @description 开始时间
     */
    startTime = 0;
    /**
    * @private
    * @description 上一次时间
    */
    prevTime = 0;

    /**
     * @private
     * @description 面板列表
     */
    FPSPanelList = [];

    /**
     * @private
     * @description 帧数
     */
    frames = 0;

    /**
     * @private
     * @description 事件手柄
     */
    handler = null

    constructor() {
        this.start();
        this.prevTime = this.startTime
        this.frames = 0;
        this.container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
        this.container.addEventListener('click', (event) => {
            event.preventDefault();
            this.showFPSPanel(++this.mode % this.FPSPanelList.length);
        }, false);
        this.createFPSPanel();
    }

    addFPSPanel(panel) {
        this.container.appendChild(panel.canvas);
        this.FPSPanelList.push(panel)
    }

    showFPSPanel(mode) {
        for (var i = 0; i < this.FPSPanelList.length; i++) {
            this.container.children[i].style.display = i === mode ? 'block' : 'none';
        }
        this.mode = mode;
    }

    createFPSPanel() {
        this.addFPSPanel(new FPSPanel('FPS', '#0ff', '#002'))
        this.addFPSPanel(new FPSPanel('MS', '#0f0', '#020'))
        if (performance && performance.memory) {
            this.addFPSPanel(new FPSPanel('MB', '#f08', '#201'))
        }
        this.showFPSPanel(this.mode);
        document.body.appendChild(this.container)
    }

    start() {
        this.startTime = (performance || Date).now();
    }

    end() {
        this.frames++
        let time = (performance || Date).now();
        this.FPSPanelList[1].update(time - this.startTime, 200)
        if (time >= this.prevTime + 1000) {
            this.FPSPanelList[0].update((this.frames * 1000) / (time - this.prevTime), 100);
            this.prevTime = time;
            this.frames = 0;
            if (this.FPSPanelList[2]) {
                const memory = performance.memory;
                this.FPSPanelList[2].update(memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576);
            }
        }
    }

    update() {
        this.start()
        this.end()
    }


    /**
     * 检测帧速
     * @param {number} classify 检测方式 1 定时器 2 延迟器 0 requestAnimationFrame
     */
    monitor(classify = 0) {
        switch (classify) {
            case 1:
                this.update();
                this.handler = setInterval(() => {
                    this.update();
                }, 1000);
                break;
            case 2:
                var loop2 = () => {
                    this.update();
                    setTimeout(() => {
                        loop2();
                    }, 1000);
                }
                loop2();
                break;
            default:
                var loop = () => {
                    this.update();
                    requestAnimationFrame(loop);
                }
                requestAnimationFrame(loop)
        }
    }
}

class FPSPanel {

    /**
     * @private 
     * @description  帧面板的前景色
     */
    fg = "transparent"

    /**
    * @private 
    * @description 帧面板的背景色
    */
    bg = "transparent"

    /**
     * @private 
     * @description 帧面板的名称
     */
    name = ""

    /**
     * @private 
     * @description 帧速的最小值 
     */
    min = Infinity

    /**
     * @private 
     * @description 帧速的最大值 
     */
    max = 0

    /**
     * @private 
     * @description 物理像素和CSS像素比值
     * @default 1
     */
    pr = window.devicePixelRatio || 1

    /**
     * @private 
     * @description 帧面板的绘制宽度
     */
    drawWidth = 0

    /**
     * @private 
     * @description 帧面板的绘制高度 
     */
    drawHieght = 0

    /**
     * @private 
     * @description 帧面板的文字起点X坐标
     */
    textX = 0

    /**
     * @private 
     * @description 帧面板的文字起点Y坐标 
     */
    textY = 0

    /**
     * @private 
     * @description 帧面板的图形起点X坐标 
     */
    grphX = 0

    /**
     * @private 
     * @description 帧面板的图形起点Y坐标 
     */
    grphY = 0

    /**
     * @private 
     * @description  
     */
    grphH = 0

    /**
     * @private 
     * @description 容器元素
     */
    canvas = document.createElement('canvas')

    /**
     * @private
     * @description 容器元素上下文
     */
    context = null;

    /**
     * @description 创建一个帧速面板
     * @param {String} name 帧面板名称
     * @param {Color} fg 帧面板前景色
     * @param {Color} bg 帧面板背景色
     */
    constructor(name, fg, bg) {
        this.fg = fg;
        this.bg = bg;
        this.name = name;
        this.setPanelArea(160, 100, [10, 8]);
        this.context = this.canvas.getContext('2d');
        this.context.font = 'bold ' + (Math.floor((this.drawWidth / 10))) + 'px Helvetica,Arial,sans-serif';
        this.context.textBaseline = 'top';

        this.context.fillStyle = bg;
        this.context.fillRect(0, 0, this.drawWidth, this.drawHieght);

        this.context.fillStyle = fg;
        this.context.fillText(name, this.textX, this.textY);
        this.context.fillRect(this.grphX, this.grphY, this.grphW, this.grphH);

        this.context.fillStyle = bg;
        this.context.globalAlpha = 0.9;
        this.context.fillRect(this.grphX, this.grphY, this.grphW, this.grphH);
    }

    setPanelArea(width = 80, height = 48, padding = [3, 2]) {
        this.drawWidth = width * this.pr
        this.drawHieght = height * this.pr
        this.textX = padding[0] * this.pr
        this.textY = padding[1] * this.pr
        this.grphX = padding[0] * this.pr
        this.grphY = Math.ceil((height - padding[1] * 2) / 3) * this.pr
        this.grphH = this.drawHieght - this.grphY - padding[1]
        this.grphW = (width - padding[0] * 2) * this.pr
        this.canvas.width = this.drawWidth;
        this.canvas.height = this.drawHieght;
        this.canvas.style.cssText = `width:${this.drawWidth}px;height:${this.drawHieght}px`;
    }

    update(value, maxValue) {
        this.min = Math.min(this.min, value);
        this.max = Math.max(this.max, value);
        this.context.fillStyle = this.bg;
        this.context.globalAlpha = 1;
        this.context.fillRect(0, 0, this.drawWidth, this.grphY);
        this.context.fillStyle = this.fg;
        this.context.fillText(Math.round(value) + ' ' + this.name + ' (' + Math.round(this.min) + '-' + Math.round(this.max) + ')', this.textX, this.textY);
        this.context.drawImage(this.canvas, this.grphX + this.pr, this.grphY, this.grphW, this.grphH, this.grphX, this.grphY, this.grphW - this.pr, this.grphH);
        this.context.fillRect(this.grphX + this.grphW - this.pr, this.grphY, this.pr, this.grphH);
        this.context.fillStyle = this.bg;
        this.context.globalAlpha = 0.9;
        this.context.fillRect(this.grphX + this.grphW - this.pr, this.grphY, this.pr, Math.round((1 - (value / maxValue)) * this.grphH));
    }
}
