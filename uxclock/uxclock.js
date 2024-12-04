class UXClock extends HTMLElement {
    constructor() {
        super();
        this.totalRotation = 0;
    }

    setConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new Error('Invalid configuration!');
        }
        this.config = {
            // Card
            size: config.size || '200px',
            background_color: config.background_color || 'var(--card-background-color)', 
            fontType: config.font_type || 'var(--primary-font-family)',
            maskStartFade: config.start_fade || '10%', 
            maskFade: config.fade || '20%',
            // Circle
            lineColor: config.line_color || 'white',
            lineWidth: config.line_width || '15px',
            lineThick: config.line_thickness || '0.8px',
            lineOpacity: config.line_opacity || '0.4',
            // Clock
            time_fontSize: config.time_fontsize || '26px', 
            time_fontcolor: config.time_fontcolor || 'var(--font-color-primary)',
            time_fontweight: config.time_fontweight || '200',
            time_margin: config.time_margin || '0px',
            // Second
            second_fontsize: config.second_fontsize || '16px',
            second_fontweight: config.second_fontweight || '200',
            second_fontcolor: config.second_fontcolor || 'var(--font-color-secondary)',
            second_diameter: config.second_diameter || '30px',
            second_border: config.second_border || '0.8px solid white',
            second_background_color: config.second_background_color || 'var(--card-background-color)', 
        };
    }

    set hass(hass) {
        if (!this.content) {

            // Const section
            const fade = parseInt(this.config.maskFade.replace('%', '')) || 20;
            const startfade = parseInt(this.config.maskStartFade.replace('%', '')) || 10;
            const fadeTop = Math.max(0, 100 - startfade);
            const fadeBottom = Math.max(0, 0 + startfade);
            const fadeTopIncrease = Math.max(0, fadeTop - fade);
            const fadeBottomIncrease = Math.max(0, fadeBottom + fade);

            // Main card
            const card = document.createElement('ha-card'); 
            card.className = 'main-card';
            card.setAttribute('aria-label', 'Clock displaying current time with rotating second markers');
            card.style.height = this.config.size;
            card.style.width = this.config.size;
            card.style.backgroundColor = this.config.background_color
            card.style.maskImage = `linear-gradient(to top, transparent ${fadeBottom}%, black ${fadeBottomIncrease}%, black ${fadeTopIncrease}%, transparent ${fadeTop}%)`;
            card.style.webkitMaskImage = card.style.maskImage;
            
            const cardSize = parseInt(this.config.size.replace('px', ''));
            const hiddenContainer = cardSize * 2;
            const radius = (hiddenContainer * 0.75) / 2;
    
            // Container for circle
            const indicatorContainer = document.createElement('div');
            indicatorContainer.className ='inner-container';
            indicatorContainer.style.width = `${hiddenContainer}px`;
            indicatorContainer.style.height = `${hiddenContainer}px`;
    
            // Inner Circle
            const innerContainer = document.createElement('div');
            innerContainer.className = 'inner-circle';
            innerContainer.style.width = `${hiddenContainer}px`;
            innerContainer.style.height = `${hiddenContainer}px`;
            innerContainer.style.transformOrigin = 'center center';
    
            // Indicators
            for (let i = 0; i < 60; i++) {
                const line = document.createElement('div');
                line.className = 'circle-indicator';
                line.style.width = this.config.lineWidth; 
                line.style.height = this.config.lineThick; 
                line.style.backgroundColor = this.config.lineColor; 
                line.style.opacity = this.config.lineOpacity;
    
                const angle = i * 6 * (Math.PI / 180);
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                line.style.transform = `translate(-50%, -50%) rotate(${i * 6}deg) translate(${radius}px, 0)`;
    
                innerContainer.appendChild(line);
            }
    
            indicatorContainer.appendChild(innerContainer);
            card.appendChild(indicatorContainer);
    
            // :SS
            const fixedIndicator = document.createElement('div');
            fixedIndicator.className = 'fixed-indicator';
            fixedIndicator.setAttribute('aria-label', 'Current second indicator');
            fixedIndicator.style.width = this.config.second_diameter;
            fixedIndicator.style.height = this.config.second_diameter;
            fixedIndicator.style.backgroundColor = this.config.second_background_color;
            fixedIndicator.style.border = this.config.second_border;
            fixedIndicator.style.color = this.config.second_fontcolor;
            fixedIndicator.style.fontSize = this.config.second_fontsize;
            fixedIndicator.style.fontWeight = this.config.second_fontweight;
            indicatorContainer.appendChild(fixedIndicator);
            this.fixedIndicator = fixedIndicator;
    
            // HH:MM
            this.content = document.createElement('div');
            this.content.setAttribute('aria-label', 'Current time displayed as hours and minutes');
            this.content.style.fontSize = this.config.time_fontSize;
            this.content.style.color = this.config.time_fontcolor;
            this.content.style.fontWeight = this.config.time_fontweight;
            this.content.style.position = 'absolute';
            this.content.style.top = '50%';
            this.content.style.left = '40%';
            this.content.style.marginLeft = this.config.time_margin;
            this.content.style.transform = 'translateY(-50%)';
            card.appendChild(this.content);
            
            this.appendChild(card);
    
            this.startClock();

            // CSS-Style
            const style = document.createElement('style');
            style.textContent = `
                .main-card {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border: none;
                }
                .inner-container {
                    align-items: center;
                    justify-items: right;
                    position: relative;
                    overflow: visible;
                }
                .circle-indicator {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                }
                .inner-circle {
                    position: absolute;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 1s ease-in-out;
                }
                .fixed-indicator {
                    position: absolute;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    z-index: 10;
                    transform: translate(-50%, -50%);
                    top: 50%;
                    left: 25%;
                }
            `;
            this.appendChild(style);
        }
    }

    startClock() {
        const updateTime = () => {
            const now = new Date();
            const seconds = now.getSeconds();
            const timeString = `${this.addZero(now.getHours())}:${this.addZero(now.getMinutes())}`;
            this.content.innerHTML = timeString;
    
            this.updateCircleRotation(seconds);
        };
    
        updateTime();
        setInterval(updateTime, 1000);
    }

    updateCircleRotation(currentSecond) {
        const now = new Date();
        const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + currentSecond;
        const rotation = totalSeconds * 6;
    
        const innerCircle = this.querySelector('.inner-circle');
        if (innerCircle) {
            innerCircle.style.transform = `rotate(${rotation}deg)`;
        }
    
        const fixedIndicator = this.querySelector('.fixed-indicator');
        if (fixedIndicator) {
            fixedIndicator.innerText = this.addZero(currentSecond);
        }
    }

    addZero(i) {
        return i < 10 ? '0' + i : i;
    }

    getCardSize() {
        return 1;
    }
}

customElements.define('ux-clock-card', UXClock);